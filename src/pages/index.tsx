import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Link from 'next/link';
import format from 'date-fns/format';
import { useEffect, useState } from 'react';
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

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  useEffect(() => {
    setPosts(postsPagination.results);
  }, []);

  const handleLoadMore = async () => {
    if (!nextPage) {
      return;
    }
    const morePost = await fetch(`${postsPagination.next_page}`).then(
      response => response.json()
    );

    setNextPage(morePost.next_page);

    setPosts(state => [...state, ...morePost.results]);
  };

  return (
    <div className={commonStyles.container}>
      <header className={styles.header}>
        <img src="/images/Logo.svg" alt="logo" />
      </header>

      <div className={styles.post}>
        {posts.map(post => {
          return (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle} </p>
                <span className={styles.postInfo}>
                  <p className={styles.postInfoText}>
                    <FiCalendar />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy'
                    ).toLowerCase()}
                  </p>
                  <p>
                    <FiUser /> {post.data.author}
                  </p>
                </span>
              </a>
            </Link>
          );
        })}
        {postsPagination.next_page && (
          <button onClick={handleLoadMore} className={styles.button}>
            Carregar mais posts
          </button>
        )}
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      data: {
        author: post.data.author,
        subtitle: post.data.subtitle,
        title: post.data.title,
      },
      first_publication_date: post.first_publication_date,
      uid: post.uid,
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
