import React, { useState, useEffect } from 'react';
import { Menu, Button, Space, Drawer, Avatar, Dropdown, Divider, Badge } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuOutlined,
  SunOutlined,
  MoonOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  HistoryOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
  BookOutlined
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { menuConfig } from '../../routes/config';
import { recordMenuLogAPI } from '../../services/logService';

const Navbar: React.FC = () => {
  const { mode, toggleTheme } = useTheme();
  const { isLoggedIn, user, logout } = useAuth();
  const { items: cartItems } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logMenuClick = (path: string, label: string) => {
    if (path.includes('/keranjang') || path.includes('/paket/')) return;
    const device = window.innerWidth < 768 ? 'mobile' : 'web';
    recordMenuLogAPI({
      path,
      label,
      device,
      user_id: user?.id,
    });
  };

  const handleLogout = () => {
    logout();
    setMobileVisible(false);
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      label: <Link to="/dashboard">Dashboard</Link>,
      icon: <ThunderboltOutlined />,
    },
    {
      key: 'latihan',
      label: <Link to="/latihan">Belajar</Link>,
      icon: <BookOutlined />,
    },
    {
      key: 'profile',
      label: <Link to="/profile">Profil Saya</Link>,
      icon: <UserOutlined />,
    },
    {
      key: 'history',
      label: <Link to="/riwayat">Riwayat Tryout</Link>,
      icon: <HistoryOutlined />,
    },
    {
      key: 'settings',
      label: <Link to="/profile">Pengaturan</Link>,
      icon: <SettingOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Keluar',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const menuItems = menuConfig
    .filter(item => !item.hidden && (item.guest || isLoggedIn))
    .map(item => {
      if (item.path.startsWith('/#')) {
        return {
          key: item.path,
          label: (
            <a
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                const id = item.path.split('#')[1];
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                setMobileVisible(false);
              }}
            >
              {item.name}
            </a>
          )
        };
      }
      return {
        key: item.path,
        label: <Link to={item.path}>{item.name}</Link>,
      };
    });

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled || mobileVisible ? 'bg-white/80 backdrop-blur-xl py-2 shadow-sm' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" onClick={() => logMenuClick('/', 'Logo')} className="text-2xl font-black tracking-tighter text-primary font-manrope">
            Kantan.
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-1">
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={(info) => {
              const item = menuConfig.find(m => m.path === info.key);
              logMenuClick(info.key, item?.name || info.key);
            }}
            className="bg-transparent border-none flex-grow min-w-[400px] font-bold text-xs uppercase tracking-widest"
          />
          <Space size="large" className="ml-8 border-l border-on-surface/5 pl-8">
            <Button
              type="text"
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              className="text-lg opacity-40 hover:opacity-100 transition-opacity"
            />

            <Link to="/keranjang" className="relative group">
              <Badge count={cartItems.length} size="small" offset={[-2, 6]}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-low transition-colors">
                  <ShoppingOutlined className="text-xl opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all" />
                </div>
              </Badge>
            </Link>

            {isLoggedIn ? (
              <Dropdown menu={{ 
                items: userMenuItems,
                onClick: (info) => logMenuClick(info.key, `UserMenu: ${info.key}`)
              }} placement="bottomRight" arrow={{ pointAtCenter: true }} trigger={['click']}>
                <div className="flex items-center gap-3 cursor-pointer group">
                  <Avatar
                    src={user?.avatar}
                    icon={<UserOutlined />}
                    className="border-2 border-primary/20 group-hover:border-primary transition-all shadow-md shadow-primary/5"
                  />
                  <div className="hidden lg:block text-left leading-tight">
                    <div className="text-[10px] uppercase font-heavy tracking-widest text-on-surface/40">Halo,</div>
                    <div className="text-xs font-black text-on-surface truncate max-w-[100px]">{user?.name.split(' ')[0]}</div>
                  </div>
                </div>
              </Dropdown>
            ) : (
              <Space size="middle">
                <Link to="/login" onClick={() => logMenuClick('/login', 'Login')} className="text-xs font-heavy uppercase tracking-widest text-on-surface/60 hover:text-primary transition-colors">Masuk</Link>
                <Link to="/register" onClick={() => logMenuClick('/register', 'Register')} className="rounded-full px-8 h-10 font-bold uppercase tracking-widest text-[10px] p-3 text-white text-xs font-heavy bg-primary shadow-lg shadow-primary/20">Daftar</Link>
              </Space>
            )}
          </Space>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center space-x-4">
          <Link to="/keranjang" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-low transition-colors">
            <Badge count={cartItems.length} size="small">
              <ShoppingOutlined className="text-xl opacity-60" />
            </Badge>
          </Link>
          <Button
            type="text"
            icon={<MenuOutlined className="text-xl" />}
            onClick={() => setMobileVisible(true)}
          />
        </div>
      </div>

      <Drawer
        title={<span className="font-black tracking-tighter text-2xl">Kantan.</span>}
        placement="right"
        onClose={() => setMobileVisible(false)}
        open={mobileVisible}
        width={320}
        extra={
          <Button
            type="text"
            icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
          />
        }
      >
        {isLoggedIn && (
          <div className="mb-8 p-6 rounded-3xl bg-surface-low flex gap-4 items-center border border-on-surface/5">
            <Avatar size={54} src={user?.avatar} icon={<UserOutlined />} className="border-2 border-white shadow-md" />
            <div className="space-y-1">
              <div className="font-black text-on-surface">{user?.name}</div>
              <div className="text-xs text-on-surface/40">{user?.email}</div>
            </div>
          </div>
        )}

        <div className="text-[10px] uppercase font-heavy tracking-widest text-on-surface/30 mb-4 px-2">Navigasi Utama</div>
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={(info) => {
            const item = menuConfig.find(m => m.path === info.key);
            logMenuClick(info.key, item?.name || info.key);
            setMobileVisible(false);
          }}
          className="border-none weightless-menu font-bold"
        />

        {isLoggedIn ? (
          <>
            <>
              <Divider className="my-8" />
              <div className="text-[10px] uppercase font-heavy tracking-widest text-on-surface/30 mb-4 px-2">Akun Saya</div>
              <Menu
                mode="vertical"
                items={userMenuItems.filter((i: any) => i.type !== 'divider')}
                onClick={(info) => {
                  logMenuClick(info.key, `UserMenu: ${info.key}`);
                  setMobileVisible(false);
                }}
                className="border-none weightless-menu font-bold"
              />
            </>
          </>
        ) : (
          <div className="mt-12 space-y-4">
            <Button block size="large" className="rounded-2xl h-14 font-bold border-on-surface/10" onClick={() => { logMenuClick('/login', 'Login'); navigate('/login'); }}>Masuk</Button>
            <Button block type="primary" size="large" className="rounded-2xl h-14 font-bold shadow-lg shadow-primary/20" onClick={() => { logMenuClick('/register', 'Register'); navigate('/register'); }}>Buat Akun Gratis</Button>
          </div>
        )}
      </Drawer>
    </nav>
  );
};

export default Navbar;
