import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import useForm from '../../../hooks/useForm';
import { required } from '../../../utils/validate';
import { login } from '../../../auth/auth';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../../auth/authProvider';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const [error, setError] = React.useState('');
  const { status, refresh } = useAuth();

  const form = useForm({
    initialValues: { username: '', password: '' },
    validators: {
      username: required(),
      password: required(),
    },
    onSubmit: async (values) => {
      try {
        setError('');
        await login(values);
        await refresh();
        // Điều hướng sẽ được thực hiện bởi <Navigate> khi status === 'authenticated'
      } catch (e) {
        setError(e.message || 'Đăng nhập thất bại');
      }
    },
  });

  if (status === 'loading') return null;
  const isAuthed = status === 'authenticated';
  if (isAuthed) return <Navigate to={from} replace />;

  return (
    <div className={styles.wrap}>
      <h1>Login</h1>
      {error && <div className={styles.error}>{error}</div>}
      <form className={styles.form} onSubmit={form.handleSubmit}>
        <label>
          Username
          <input type="text" {...form.register('username')} />
        </label>
        <label>
          Password
          <input type="password" {...form.register('password')} />
        </label>
        <Button type="submit">Đăng nhập</Button>
      </form>
      <p>Tài khoản mẫu: admin/admin123@1 · staff/staff123 · student/student123 · teacher/teacher123</p>
    </div>
  );
} 