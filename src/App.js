import React, { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import DefaultLayout from './layout/DefaultLayout';
import { routes } from './routes/routes';
import RequireAuth from './auth/RequireAuth';
import Spinner from './components/Spinner/Spinner';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div>Đã có lỗi xảy ra. Vui lòng tải lại trang.</div>;
    }
    return this.props.children;
  }
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const match = routes.find(r => r.path === pathname) || routes.find(r => r.path === '*');
    document.title = (match && match.meta && match.meta.title) ? match.meta.title : 'React Core FE';
  }, [location.pathname]);

  return (
    <AppErrorBoundary>
      <LoadingOverlay />
      <Suspense fallback={<Spinner fullScreen />}>
        <Routes>
          {routes.map(route => {
            const Element = route.element;
            const isProtected = route.meta && route.meta.protected;
            const noLayout = route.meta && route.meta.layout === 'none';

            let content = <Element />;
            if (isProtected) {
              content = (
                <RequireAuth roles={route.meta.roles}>
                  {content}
                </RequireAuth>
              );
            }

            if (!noLayout) {
              content = <DefaultLayout>{content}</DefaultLayout>;
            }

            return (
              <Route key={route.path} path={route.path} element={content} />
            );
          })}
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
} 