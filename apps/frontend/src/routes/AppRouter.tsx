import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { menuConfig, MenuItem } from './config';
import { App } from 'antd';

const AppRouter: React.FC = () => {
  const renderRoutes = (items: MenuItem[]) => {
    return items.map((item) => (
      <React.Fragment key={item.id}>
        <Route
          path={item.path}
          element={
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
              <item.component />
            </Suspense>
          }
        />
        {item.children && renderRoutes(item.children)}
      </React.Fragment>
    ));
  };

  return (
    <BrowserRouter>
      <App> {/* Antd App component for message/notification context */}
        <Routes>
          {renderRoutes(menuConfig)}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </App>
    </BrowserRouter>
  );
};

export default AppRouter;
