import React, { useMemo, useState } from 'react';
import styles from './Sidebar.module.scss';
import { NavLink } from 'react-router-dom';
import { getCurrentUser } from '../auth/auth';
import { getMenuForRole } from '../menu';
import { useLayout } from './LayoutContext';

export default function Sidebar() {
  const user = getCurrentUser();
  const items = getMenuForRole((user.role || '').toString());
  const { sidebarOpen } = useLayout();
  const [openParents, setOpenParents] = useState(() => new Set());

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

  function getItemKey(item) {
    return item.path || item.label;
  }

  function isParentOpen(item) {
    return openParents.has(getItemKey(item));
  }

  function toggleParent(e, item) {
    // Chặn điều hướng khi là parent có submenu
    if (e) e.preventDefault();
    const key = getItemKey(item);
    setOpenParents(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
      <nav className={styles.nav}>
        {items.map(item => {
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;
          const itemKey = getItemKey(item);

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
              <button
                type="button"
                className={`${styles.link} ${styles.parentLink} ${isParentOpen(item) ? styles.parentOpen : ''}`}
                onClick={(e) => toggleParent(e, item)}
                aria-expanded={isParentOpen(item)}
                aria-controls={`submenu-${itemKey}`}
              >
                <span className={styles.parentButtonInner}>
                  <span className={styles.parentLabelText}>{item.label}</span>
                  <svg className={styles.caret} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              <div
                id={`submenu-${itemKey}`}
                className={`${styles.submenu} ${isParentOpen(item) ? styles.submenuOpen : styles.submenuClosed}`}
              >
                {item.children.map(child => {
                  // Nếu child path giống parent path, cần end={true} để chỉ match exact path
                  const shouldEnd = child.path === item.path;
                  return (
                    <NavLink
                      key={child.path || child.label}
                      to={child.path}
                      end={shouldEnd}
                      className={({ isActive }) => isActive ? `${styles.submenuLink} ${styles.active}` : styles.submenuLink}
                    >
                      {child.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
