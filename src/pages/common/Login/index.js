import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import useForm from '../../../hooks/useForm';
import { required } from '../../../utils/validate';
import { login } from '../../../auth/auth';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const [error, setError] = React.useState('');

  const form = useForm({
    initialValues: { username: '', password: '' },
    validators: {
      username: required(),
      password: required(),
    },
    onSubmit: async (values) => {
      try {
        setError('');
        const { user } = await login(values);
        navigate(from || '/dashboard', { replace: true });
      } catch (e) {
        setError(e.message || 'Đăng nhập thất bại');
      }
    },
  });

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