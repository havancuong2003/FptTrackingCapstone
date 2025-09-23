import React from 'react';
import styles from './LoadingOverlay.module.scss';
import Spinner from '../Spinner/Spinner';
import { getLoadingCount, subscribeLoading } from '../../utils/loading';

export default function LoadingOverlay() {
  const [count, setCount] = React.useState(getLoadingCount());

  React.useEffect(() => {
    const unsub = subscribeLoading(setCount);
    return unsub;
  }, []);

  if (count <= 0) return null;

  return (
    <div className={styles.overlay}>
      <Spinner fullScreen={false} />
    </div>
  );
} 