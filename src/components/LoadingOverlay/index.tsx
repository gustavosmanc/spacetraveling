import { ReactElement } from 'react';
import ReactLoading from 'react-loading';

import styles from './loading-overlay.module.scss';

export default function LoadingOverlay(): ReactElement {
  return (
    <div data-testid="loading-overlay" className={styles.loadingOverlay}>
      <ReactLoading type="bars" color="#ff57b2" width="6rem" />
    </div>
  );
}
