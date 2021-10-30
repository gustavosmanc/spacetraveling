import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { ReactElement, useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

import { getPrismicClient } from '../services/prismic';

import ExitPreview from '../components/ExitPreview';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

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
  preview: boolean;
}

export default function Home({
  postsPagination: { next_page, results },
  preview,
}: HomeProps): ReactElement {
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  function handleLoadMorePosts(): void {
    fetch(nextPage).then(response =>
      response.json().then(data => {
        const formattedData = data.results.map(post => ({
          uid: post.uid,
          first_publication_date: post.first_publication_date,
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        }));

        setPosts([...posts, ...formattedData]);
        setNextPage(data.next_page);
      })
    );
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.homeContent}>
          <img src="/images/logo.svg" alt="logo" />

          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a className={styles.post}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <time>
                    <FiCalendar />
                    {format(
                      new Date(post.first_publication_date),
                      'MMM dd, yyyy',
                      { locale: enUS }
                    )}
                  </time>
                  <span>
                    <FiUser />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}

          {nextPage && (
            <button type="button" onClick={handleLoadMorePosts}>
              Load more posts
            </button>
          )}

          {preview && (
            <div className={styles.exitPreview}>
              <ExitPreview />
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      fetch: ['post.title', 'post.subtitle', 'post.author', 'post.content'],
      orderings: '[document.first_publication_date desc]',
      ref: previewData?.ref ?? null,
    }
  );

  const results = response.results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));

  return {
    props: {
      postsPagination: {
        results,
        next_page: response.next_page,
      },
      preview,
    },
  };
};
