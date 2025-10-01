import React from 'react';
import styles from './Header.module.scss';
import Button from '../components/Button/Button';
import { logout } from '../auth/auth';
import { useLayout } from './LayoutContext';
import { useAuth } from '../auth/authProvider';

export default function Header() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'light');
  const { status, refresh } = useAuth();
  const authed = status === 'authenticated';
  const { sidebarOpen, setSidebarOpen } = useLayout();

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  function handleToggleTheme() {
    setTheme(t => (t === 'light' ? 'dark' : 'light'));
  }

  async function handleLogout() {
    await logout();
    await refresh();
    window.location.href = '/';
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Button className={styles.hamburger} variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
          <span className={styles.hamburgerInner} />
        </Button>
        <a className={styles.brand} href="/">
          <img className={styles.logo} src="/logo.png" alt="Logo" />
        </a>
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={handleToggleTheme}>
          {theme === 'light' ? 'Dark' : 'Light'}
        </Button>
        {authed ? (
          <Button variant="secondary" onClick={handleLogout}>Logout</Button>
        ) : (
          <Button as="a" href="/login">Login</Button>
        )}
      </div>
    </header>
  );
} 