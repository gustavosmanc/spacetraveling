import { GetStaticPaths, GetStaticProps } from 'next';
import { Fragment, ReactElement, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';
import ExitPreview from '../../components/ExitPreview';
import LoadingOverlay from '../../components/LoadingOverlay';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

type Link = { slug: string; title: string } | null;

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
  previousPost: Link;
  nextPost: Link;
}

interface PostProps {
  post: Post;
  preview: boolean;
}

export default function Post({
  post: {
    first_publication_date,
    last_publication_date,
    data,
    previousPost,
    nextPost,
  },
  preview,
}: PostProps): ReactElement {
  useEffect(() => {
    const anchor = document.getElementById('container-utterances');

    if (anchor) {
      const script = document.createElement('script');

      script.setAttribute('src', 'https://utteranc.es/client.js');
      script.setAttribute('repo', process.env.NEXT_PUBLIC_UTTERANCES_REPO);
      script.setAttribute('issue-term', 'pathname');
      script.setAttribute('theme', 'github-dark');
      script.setAttribute('crossorigin', 'anonymous');
      script.setAttribute('async', '');

      anchor.innerHTML = '';
      anchor.appendChild(script);
    }
  }, [data]);

  const router = useRouter();

  if (router.isFallback) {
    return <LoadingOverlay />;
  }

  const wordCount = data.content.reduce((acc, curr) => {
    const headingWords = curr.heading.split(' ');
    const bodyWords = RichText.asText(curr.body).split(' ');

    return acc + headingWords.length + bodyWords.length;
  }, 0);

  const estimatedReadingTime = Math.ceil(wordCount / 200);

  return (
    <>
      <Head>
        <title>{data.title} | spacetraveling</title>
      </Head>

      <Header />

      <img
        className={styles.postBanner}
        src={data.banner.url}
        alt={data.title}
      />

      <main className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{data.title}</h1>
          <div className={styles.postInfo}>
            <div>
              <time>
                <FiCalendar />
                {format(new Date(first_publication_date), 'MMM dd, yyyy', {
                  locale: enUS,
                })}
              </time>

              <span>
                <FiUser />
                {data.author}
              </span>

              <span>
                <FiClock />
                {estimatedReadingTime} min read
              </span>
            </div>

            <i>
              {`* Updated on ${format(
                new Date(last_publication_date),
                'MMM dd, yyyy',
                {
                  locale: enUS,
                }
              )} at ${format(new Date(last_publication_date), 'hh:mm', {
                locale: enUS,
              })}`}
            </i>
          </div>
          {data.content.map(item => (
            <Fragment key={item.heading}>
              <h2>{item.heading}</h2>

              <div
                className={styles.postContentBody}
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(item.body) }}
              />
            </Fragment>
          ))}
        </article>
      </main>

      <footer className={commonStyles.container}>
        <div className={styles.footer}>
          <div className={styles.divider} />
          <div className={styles.links}>
            {previousPost && (
              <div className={styles.previousPost}>
                <span title={previousPost.title}>{previousPost.title}</span>

                <Link href={`/post/${previousPost.slug}`}>
                  <a>Previous post</a>
                </Link>
              </div>
            )}

            {nextPost && (
              <div className={styles.nextPost}>
                <span title={nextPost.title}>{nextPost.title}</span>

                <Link href={`/post/${nextPost.slug}`}>
                  <a>Next post</a>
                </Link>
              </div>
            )}
          </div>

          <div id="container-utterances" />

          {preview && (
            <div className={styles.exitPreview}>
              <ExitPreview />
            </div>
          )}
        </div>
      </footer>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      orderings: '[document.first_publication_date desc]',
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

type Params = {
  params: {
    slug: string;
  };
  preview: boolean;
  previewData: {
    ref: string;
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}: Params) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('post', slug, {
    ref: previewData?.ref ?? null,
  });

  const previousResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
      ref: previewData?.ref ?? null,
    }
  );

  const nextResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
      ref: previewData?.ref ?? null,
    }
  );

  const data = {
    title: response.data.title,
    subtitle: response.data.subtitle,
    banner: {
      url: response.data.banner.url,
    },
    author: response.data.author,
    content: response.data.content,
  };

  const previousPost = previousResponse.results[0]
    ? {
        slug: previousResponse.results[0].uid,
        title: previousResponse.results[0].data.title,
      }
    : null;

  const nextPost = nextResponse.results[0]
    ? {
        slug: nextResponse.results[0].uid,
        title: nextResponse.results[0].data.title,
      }
    : null;

  return {
    props: {
      post: {
        data,
        previousPost,
        nextPost,
        first_publication_date: response.first_publication_date,
        last_publication_date: response.last_publication_date,
        uid: response.uid,
      },
      preview,
    },
  };
};
