import React, { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import DefaultLayout from './layout/DefaultLayout';
import { routes } from './routes/routes';
import RequireAuth from './auth/RequireAuth';
import RouteGuard from './auth/RouteGuard';
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
    // Tìm route match chính xác trước
    let match = routes.find(r => r.path === pathname);
    
    // Nếu không tìm thấy, thử match với route có tham số
    if (!match) {
      match = routes.find(r => {
        if (r.path === '*' || !r.path.includes(':')) return false;
        // Chuyển route path thành regex để match
        const regex = new RegExp('^' + r.path.replace(/:[^/]+/g, '[^/]+') + '$');
        return regex.test(pathname);
      });
    }
    
    // Cuối cùng mới dùng route catch-all
    if (!match) {
      match = routes.find(r => r.path === '*');
    }
    
    document.title = (match && match.meta && match.meta.title) ? match.meta.title : 'FPT Tracking Capstone';
  }, [location.pathname]);

  // Tách route catch-all ra khỏi các route thường
  const regularRoutes = routes.filter(route => route.path !== '*');
  const notFoundRoute = routes.find(route => route.path === '*');

  return (
    <AppErrorBoundary>
      <LoadingOverlay />
      <Suspense fallback={<Spinner fullScreen />}>
        <Routes>
          {regularRoutes.map(route => {
            const Element = route.element;
            const isProtected = route.meta && route.meta.protected;
            const noLayout = route.meta && route.meta.layout === 'none';

            let content = <Element />;
            if (isProtected) {
              content = (
                <RouteGuard requiredRoles={route.meta.roles}>
                  {content}
                </RouteGuard>
              );    
            }

            if (!noLayout) {
              content = <DefaultLayout>{content}</DefaultLayout>;
            }

            return (
              <Route key={route.path} path={route.path} element={content} />
            );
          })}
          {notFoundRoute && (() => {
            const Element = notFoundRoute.element;
            const noLayout = notFoundRoute.meta && notFoundRoute.meta.layout === 'none';
            let content = <Element />;
            if (!noLayout) {
              content = <DefaultLayout>{content}</DefaultLayout>;
            }
            return (
              <Route key="*" path="*" element={content} />
            );
          })()}
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
} 