import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { menuConfig, MenuItem } from './config';
import { App } from 'antd';
import { AuthProvider } from '../context/AuthContext';
import PageLoader from '../components/atoms/PageLoader';

const AppRouter: React.FC = () => {
  const renderRoutes = (items: MenuItem[]) => {
    return items.map((item) => (
      <React.Fragment key={item.id}>
        <Route
          path={item.path}
          element={
            <Suspense fallback={<PageLoader />}>
              <item.component />
            </Suspense>
          }
        />
        {item.children && renderRoutes(item.children)}
      </React.Fragment>
    ));
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <App>
          <Routes>
            {renderRoutes(menuConfig)}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </App>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default AppRouter;
