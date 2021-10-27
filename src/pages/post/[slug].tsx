import { GetStaticPaths, GetStaticProps } from 'next';
import { Fragment, ReactElement } from 'react';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
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
}

interface PostProps {
  post: Post;
}

export default function Post({
  post: { first_publication_date, data },
}: PostProps): ReactElement {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const wordCount = data.content.reduce((acc, curr) => {
    const headingWords = curr.heading.split(' ');
    const bodyWords = RichText.asText(curr.body).split(' ');

    return acc + headingWords.length + bodyWords.length;
  }, 0);

  const estimatedReadingTime = Math.ceil(wordCount / 200);

  return (
    <>
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
            <time>
              <FiCalendar />
              {format(new Date(first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>

            <span>
              <FiUser />
              {data.author}
            </span>

            <span>
              <FiClock />
              {estimatedReadingTime} min
            </span>
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

      <Head>
        <title>{data.title} | spacetraveling</title>
      </Head>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { pageSize: 10 }
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
};

export const getStaticProps: GetStaticProps = async ({ params }: Params) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('post', slug, {
    lang: 'en-us',
  });

  const data = {
    title: response.data.title,
    subtitle: response.data.subtitle,
    banner: {
      url: response.data.banner.url,
    },
    author: response.data.author,
    content: response.data.content,
  };

  return {
    props: {
      post: {
        data,
        first_publication_date: response.first_publication_date,
        uid: response.uid,
      },
    },
  };
};
