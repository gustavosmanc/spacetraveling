import Link from 'next/link';
import { ReactElement } from 'react';

import styles from './header.module.scss';

export default function Header(): ReactElement {
  return (
    <div className={styles.headerContainer}>
      <header className={styles.headerContent}>
        <Link href="/">
          <a>
            <img src="/images/logo.svg" alt="logo" />
          </a>
        </Link>
      </header>
    </div>
  );
}
