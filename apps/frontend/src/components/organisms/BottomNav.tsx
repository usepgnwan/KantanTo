import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  ShoppingCartOutlined,
  ThunderboltOutlined,
  UserOutlined,
  BookOutlined
} from '@ant-design/icons';

const BottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <HomeOutlined />,
      path: '/',
    },
    {
      id: 'latihan',
      label: 'Belajar',
      icon: <BookOutlined />,
      path: '/latihan',
    },
    {
      id: 'pembelian',
      label: 'Pembelian',
      icon: <ShoppingCartOutlined />,
      path: '/pembelian',
    },
    {
      id: 'dashboard',
      label: 'Stats',
      icon: <ThunderboltOutlined />,
      path: '/dashboard',
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: <UserOutlined />,
      path: '/profile',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-on-surface/5 px-4 py-2 pb-safe z-50 md:hidden transition-colors duration-500">
      <div className="flex justify-between items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={`flex flex-col items-center gap-1 min-w-[64px] transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-on-surface/40 hover:text-on-surface/60'
                }`}
            >
              <div className={`text-xl flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/10 shadow-sm' : ''
                }`}>
                {item.icon}
              </div>
              <span className={`text-[10px] uppercase font-heavy tracking-wider ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-primary rounded-full absolute -bottom-1" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
