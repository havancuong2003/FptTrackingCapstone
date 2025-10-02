import React from 'react';
import styles from './Sidebar.module.scss';
import { NavLink } from 'react-router-dom';
import { getCurrentUser } from '../auth/auth';
import { getMenuForRole } from '../menu';
import { useLayout } from './LayoutContext';

export default function Sidebar() {
  const user = getCurrentUser();
  const items = getMenuForRole((user.role || '').toString());
  const { sidebarOpen } = useLayout();

  return (
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
      <nav className={styles.nav}>
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
