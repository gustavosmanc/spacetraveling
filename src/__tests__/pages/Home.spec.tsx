import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GetStaticPropsContext } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { RouterContext } from 'next/dist/next-server/lib/router-context';

import { getPrismicClient } from '../../services/prismic';
import App, { getStaticProps } from '../../pages';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

interface GetStaticPropsResult {
  props: HomeProps;
}

const mockedQueryReturn = {
  next_page: 'link',
  results: [
    {
      uid: 'how-to-use-hooks',
      first_publication_date: '2021-03-15T19:25:28+0000',
      data: {
        title: 'How to use Hooks',
        subtitle: 'Learn all about React Hooks with this hands-on guide',
        author: 'Luke Skywalker',
      },
    },
    {
      uid: 'creating-a-cra-app-from-scratch',
      first_publication_date: '2021-03-25T19:27:35+0000',
      data: {
        title: 'Creating a CRA app from scratch',
        subtitle:
          'Everything about how to create your first application using Create React App',
        author: 'John Smith',
      },
    },
  ],
};

jest.mock('@prismicio/client');
jest.mock('../../services/prismic');

const mockedPrismic = getPrismicClient as jest.Mock;
const mockedFetch = jest.spyOn(window, 'fetch') as jest.Mock;
const mockedPush = jest.fn();
let RouterWrapper;

describe('Home', () => {
  beforeAll(() => {
    mockedPush.mockImplementation(() => Promise.resolve());
    const MockedRouterContext = RouterContext as React.Context<unknown>;
    RouterWrapper = ({ children }): JSX.Element => {
      return (
        <MockedRouterContext.Provider
          value={{
            push: mockedPush,
          }}
        >
          {children}
        </MockedRouterContext.Provider>
      );
    };

    mockedPrismic.mockReturnValue({
      query: () => {
        return Promise.resolve(mockedQueryReturn);
      },
    });

    mockedFetch.mockImplementation(() => {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            next_page: null,
            results: [
              {
                uid: 'creating-a-cra-app-from-scratch',
                first_publication_date: '2021-03-25T19:27:35+0000',
                data: {
                  title: 'Creating a CRA app from scratch',
                  subtitle:
                    'Everything about how to create your first application using Create React App',
                  author: 'John Smith',
                },
              },
            ],
          }),
      });
    });
  });

  it('should be able to return prismic posts documents using getStaticProps', async () => {
    const postsPaginationReturn = mockedQueryReturn;

    const getStaticPropsContext: GetStaticPropsContext<ParsedUrlQuery> = {};

    const response = (await getStaticProps(
      getStaticPropsContext
    )) as GetStaticPropsResult;

    expect(response.props.postsPagination.next_page).toEqual(
      postsPaginationReturn.next_page
    );
    expect(response.props.postsPagination.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining(postsPaginationReturn.results[0]),
        expect.objectContaining(postsPaginationReturn.results[1]),
      ])
    );
  });

  it('should be able to render posts documents info', () => {
    const postsPagination = mockedQueryReturn;

    render(<App postsPagination={postsPagination} preview={false} />);

    screen.getByText('How to use Hooks');
    screen.getByText('Learn all about React Hooks with this hands-on guide');
    screen.getByText('Mar 15, 2021');
    screen.getByText('Luke Skywalker');

    screen.getByText('Creating a CRA app from scratch');
    screen.getByText(
      'Everything about how to create your first application using Create React App'
    );
    screen.getByText('Mar 15, 2021');
    screen.getByText('John Smith');
  });

  it('should be able to navigate to post page after a click', () => {
    const postsPagination = mockedQueryReturn;

    render(<App postsPagination={postsPagination} preview={false} />, {
      wrapper: RouterWrapper,
    });

    const firstPostTitle = screen.getByText('How to use Hooks');
    const secondPostTitle = screen.getByText('Creating a CRA app from scratch');

    fireEvent.click(firstPostTitle);
    fireEvent.click(secondPostTitle);

    expect(mockedPush).toHaveBeenNthCalledWith(
      1,
      '/post/how-to-use-hooks',
      expect.anything(),
      expect.anything()
    );
    expect(mockedPush).toHaveBeenNthCalledWith(
      2,
      '/post/creating-a-cra-app-from-scratch',
      expect.anything(),
      expect.anything()
    );
  });

  it('should be able to load more posts if available', async () => {
    const postsPagination = { ...mockedQueryReturn };
    postsPagination.results = [
      {
        uid: 'how-to-use-hooks',
        first_publication_date: '2021-03-15T19:25:28+0000',
        data: {
          title: 'How to use Hooks',
          subtitle: 'Learn all about React Hooks with this hands-on guide',
          author: 'Luke Skywalker',
        },
      },
    ];

    render(<App postsPagination={postsPagination} preview={false} />);

    screen.getByText('How to use Hooks');
    const loadMorePostsButton = screen.getByText('Load more posts');

    fireEvent.click(loadMorePostsButton);

    await waitFor(
      () => {
        expect(mockedFetch).toHaveBeenCalled();
      },
      { timeout: 200 }
    );

    screen.getByText('Creating a CRA app from scratch');
  });

  it('should not be able to load more posts if not available', async () => {
    const postsPagination = mockedQueryReturn;
    postsPagination.next_page = null;

    render(<App postsPagination={postsPagination} preview={false} />);

    screen.getByText('How to use Hooks');
    screen.getByText('Creating a CRA app from scratch');
    const loadMorePostsButton = screen.queryByText('Load more posts');

    expect(loadMorePostsButton).not.toBeInTheDocument();
  });
});
