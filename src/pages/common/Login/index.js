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
  const from = location.state?.from?.pathname || '/';
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
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
        setIsLoading(true);
        await login(values);
        await refresh();
        // Điều hướng sẽ được thực hiện bởi <Navigate> khi status === 'authenticated'
      } catch (e) {
        setError(e.message || 'Đăng nhập thất bại');
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (status === 'loading') return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
    </div>
  );
  const isAuthed = status === 'authenticated';
  if (isAuthed) return <Navigate to={from} replace />;

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="Logo" />
          </div>
          <h1 className={styles.title}>Đăng nhập</h1>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
              <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={form.handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <span>Tên đăng nhập</span>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input 
                  type="text" 
                  className={styles.input}
                  placeholder="Nhập tên đăng nhập"
                  {...form.register('username')} 
                />
              </div>
            </label>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>
              <span>Mật khẩu</span>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input 
                  type="password" 
                  className={styles.input}
                  placeholder="Nhập mật khẩu"
                  {...form.register('password')} 
                />
              </div>
            </label>
          </div>

          <Button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.buttonSpinner}></div>
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </Button>
        </form>

        <div className={styles.demoAccounts}>
          <h3>Tài khoản demo</h3>
          <div className={styles.accountList}>
            <div className={styles.accountItem}>
              <span className={styles.role}>Admin</span>
              <span className={styles.credentials}>admin / 123456</span>
            </div>
            <div className={styles.accountItem}>
              <span className={styles.role}>Staff</span>
              <span className={styles.credentials}>sont5 / 123456</span>
            </div>
            <div className={styles.accountItem}>
              <span className={styles.role}>Student</span>
              <span className={styles.credentials}>haildhe172452 / 123456</span>
            </div>
            <div className={styles.accountItem}>
              <span className={styles.role}>Giáo viên</span>
              <span className={styles.credentials}>thuypt26 / 123456</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 