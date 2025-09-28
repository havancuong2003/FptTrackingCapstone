import React from 'react';
import styles from './index.module.scss';
import Tooltip from '../../../components/Tooltip/Tooltip';
import Switch from '../../../components/Switch/Switch';

export default function Home() {
  const [on, setOn] = React.useState(false);
  return (
    <div className={styles.wrap}>
      <h1>Home</h1>
      <p>Chào mừng đến với FPT Tracking Capstone.</p>
      <Tooltip content="Tooltip demo">
        <span tabIndex={0} style={{ textDecoration: 'underline', cursor: 'help' }}>hãy hover vào đây</span>
      </Tooltip>
      <div style={{ marginTop: 12 }}>
        <Switch checked={on} onChange={setOn} label={on ? 'Bật' : 'Tắt'} />
      </div>
    </div>
  );
} 