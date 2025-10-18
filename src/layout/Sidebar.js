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

  function resolvePath(path) {
    try {
      const normalizedRole = String(user.role || '').toUpperCase();
      if (normalizedRole === 'STUDENT' && path === '/student/tasks') {
        const groupId = localStorage.getItem('student_group_id') || '1';
        const url = `/student/tasks?groupId=${encodeURIComponent(groupId)}`;
        return url;
      }
    } catch {}
    return path;
  }

  return (
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
      <nav className={styles.nav}>
        {items.map(item => {
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;
          const itemKey = item.path || item.label;

          if (!hasChildren) {
            return (
              <NavLink
                key={itemKey}
                to={resolvePath(item.path)}
                className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
              >
                {item.label}
              </NavLink>
            );
          }

          return (
            <div key={itemKey} className={styles.parent}>
              {item.path ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) => isActive ? `${styles.link} ${styles.active} ${styles.parentLink}` : `${styles.link} ${styles.parentLink}`}
                >
                  {item.label}
                </NavLink>
              ) : (
                <div className={styles.parentLabel}>{item.label}</div>
              )}

              <div className={styles.submenu}>
                {item.children.map(child => (
                  <NavLink
                    key={child.path || child.label}
                    to={child.path}
                    className={({ isActive }) => isActive ? `${styles.submenuLink} ${styles.active}` : styles.submenuLink}
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
