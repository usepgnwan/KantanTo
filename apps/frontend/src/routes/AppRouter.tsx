import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { menuConfig, MenuItem } from './config';
import { App } from 'antd';
import { AuthProvider, useAuth } from '../context/AuthContext';
import PageLoader from '../components/atoms/PageLoader';

// Guard: ensures only Admins (roleId=1) can access /admin/* routes
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// Guard: protects logged-in pages and keeps auth pages out of active sessions.
const StudentGuard: React.FC<{ children: React.ReactNode; requireAuth?: boolean; guestOnly?: boolean; allowAdmin?: boolean }> = ({
  children,
  requireAuth = false,
  guestOnly = false,
  allowAdmin = false,
}) => {
  const { isLoggedIn, isAdmin } = useAuth();
  if (guestOnly && isLoggedIn) return <Navigate to={isAdmin() ? '/admin/dashboard' : '/dashboard'} replace />;
  
  if (requireAuth) {
    if (!isLoggedIn) return <Navigate to="/login" replace />;
    if (isAdmin() && !allowAdmin) return <Navigate to="/admin/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const renderRoutes = (items: MenuItem[]) => {
  return items.map((item) => {
    const isAdminRoute = item.path.startsWith('/admin');
    const isGuestOnlyRoute = item.path === '/login' || item.path === '/register';
    // Routes that require login for students
    const requiresAuth = !item.guest && !isAdminRoute;

    const element = (
      <Suspense fallback={<PageLoader />}>
        {isAdminRoute ? (
          <AdminGuard>
            <item.component />
          </AdminGuard>
        ) : (
          <StudentGuard requireAuth={requiresAuth} guestOnly={isGuestOnlyRoute} allowAdmin={item.allowAdmin}>
            <item.component />
          </StudentGuard>
        )}
      </Suspense>
    );

    return (
      <React.Fragment key={item.id}>
        <Route path={item.path} element={element} />
        {item.children && renderRoutes(item.children)}
      </React.Fragment>
    );
  });
};

const RouterContent: React.FC = () => {
  return (
    <Routes>
      {renderRoutes(menuConfig)}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <App>
          <RouterContent />
        </App>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRouter;
