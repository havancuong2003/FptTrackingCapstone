import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import styles from './DefaultLayout.module.scss';
import { LayoutContext } from './LayoutContext';

export default function DefaultLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <LayoutContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className={styles.container}>
        <Header />
        <div className={styles.main}>
          <Sidebar />
          <main>
            {children}
          </main>
          {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}
        </div>
        <Footer />
      </div>
    </LayoutContext.Provider>
  );
} 