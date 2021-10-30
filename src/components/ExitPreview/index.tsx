import Link from 'next/link';
import { ReactElement } from 'react';

import styles from './exit-preview.module.scss';

export default function ExitPreview(): ReactElement {
  return (
    <Link href="/api/exit-preview">
      <a className={styles.exitPreview}>
        <span>Exit Preview Mode</span>
      </a>
    </Link>
  );
}
