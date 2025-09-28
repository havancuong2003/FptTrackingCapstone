import React from 'react';
import styles from './index.module.scss';
import Card from '../../../components/Card/Card';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import { getCurrentUser } from '../../../auth/auth';

export default function Dashboard() {
  const [open, setOpen] = React.useState(false);
  const user = getCurrentUser();
  return (
    <div className={styles.wrap}>
      <h1>Dashboard</h1>
      <p>Tổng quan nhanh. Role hiện tại: <strong>{user.role}</strong></p>
      <div className={styles.cards}>
        <Card title="Người dùng">123</Card>
        <Card title="Đơn hàng">45</Card>
        <Card title="Doanh thu">$6,789</Card>
      </div>
      <div style={{ marginTop: 12 }}>
        <Button onClick={() => setOpen(true)}>Mở Modal</Button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)}>
        <h3>Modal Demo</h3>
        <p>Nội dung modal.</p>
      </Modal>
    </div>
  );
} 