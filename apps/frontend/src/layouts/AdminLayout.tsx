import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  TagsOutlined,
  SunOutlined,
  MoonOutlined,
  AppstoreOutlined,
  BankOutlined,
  ReadOutlined,
  PercentageOutlined,
  SafetyCertificateOutlined,
  AppstoreAddOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    section: 'Utama',
    items: [
      { path: '/admin/dashboard', label: 'Overview', icon: <DashboardOutlined /> },
      { path: '/admin/analytics', label: 'Analitik', icon: <BarChartOutlined /> },
    ],
  },
  {
    section: 'Konten',
    items: [
      { path: '/admin/packages', label: 'Paket & Soal', icon: <TagsOutlined /> },
      { path: '/admin/materials', label: 'Blog', icon: <ReadOutlined /> },
      { path: '/admin/example-exam', label: 'Soal Landing Page', icon: <FileTextOutlined /> },
      // { path: '/admin/questions', label: 'Bank Soal', icon: <FileTextOutlined /> },
    ],
  },
  {
    section: 'Marketing',
    items: [
      { path: '/admin/vouchers', label: 'Voucher & Promo', icon: <PercentageOutlined /> },
    ],
  },
  {
    section: 'Komunikasi',
    items: [
      { path: '/admin/messages', label: 'Pesan Masuk', icon: <MailOutlined /> },
    ],
  },
  {
    section: 'Pengguna',
    items: [
      { path: '/admin/users', label: 'Pengguna', icon: <TeamOutlined /> },
      { path: '/admin/orders', label: 'Pesanan', icon: <ShoppingCartOutlined /> },
      { path: '/admin/exam-history', label: 'Riwayat Ujian', icon: <FileTextOutlined /> },
    ],
  },
  {
    section: 'Master Data',
    items: [
      { path: '/admin/master/categories', label: 'Kategori', icon: <AppstoreOutlined /> },
      { path: '/admin/education-levels', label: 'Tingkat Pendidikan', icon: <BankOutlined /> },
      { path: '/admin/grades', label: 'Kelas (Grade)', icon: <ReadOutlined /> },
      { path: '/admin/subjects', label: 'Mata Pelajaran', icon: <AppstoreAddOutlined /> },
    ],
  },
  {
    section: 'Sistem',
    items: [
      { path: '/admin/settings', label: 'Pengaturan', icon: <SettingOutlined /> },
      { path: '/admin/roles', label: 'Manajemen Roles', icon: <SafetyCertificateOutlined /> },
    ],
  },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();

  const userDropdownItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Profil Admin',
      icon: <UserOutlined />,
    },
    {
      key: 'change-password',
      label: 'Ubah Password',
      icon: <SettingOutlined />,
      onClick: () => navigate('/admin/change-password'),
    },
    {
      key: 'settings',
      label: 'Pengaturan',
      icon: <SettingOutlined />,
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: 'Keluar',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => navigate('/login'),
    },
  ];

  return (
    <div className="flex h-screen bg-surface-low dark:bg-zinc-950 overflow-hidden font-sans transition-colors duration-300">

      {/* ── SIDEBAR ──────────────────────────────────────── */}
      <aside
        className={`
          flex flex-col shrink-0 transition-all duration-300 ease-in-out
          bg-white dark:bg-zinc-900
          border-r border-on-surface/5 dark:border-white/5
          shadow-[4px_0_24px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.3)]
          ${collapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 shrink-0 px-6 border-b border-on-surface/5 dark:border-white/5 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-primary/30">
            <span className="text-white font-black text-sm">K</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="block font-black text-lg font-manrope leading-tight text-on-surface dark:text-zinc-100">Rifaya Tryout</span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-primary/60 leading-tight">Admin Panel</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
          {menuItems.map((section) => (
            <div key={section.section}>
              {!collapsed && (
                <p className="text-[9px] uppercase font-black tracking-[0.2em] text-on-surface/30 dark:text-zinc-500 mb-2 px-3">
                  {section.section}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const link = (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all group
                        ${isActive
                          ? 'bg-primary text-white shadow-lg shadow-primary/25'
                          : 'text-on-surface/60 dark:text-zinc-400 hover:bg-surface-low dark:hover:bg-zinc-800 hover:text-on-surface dark:hover:text-zinc-100'
                        }
                        ${collapsed ? 'justify-center' : ''}
                      `}
                    >
                      <span className={`text-base shrink-0 ${isActive ? 'text-white' : 'text-on-surface/40 dark:text-zinc-500 group-hover:text-primary'}`}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                  return collapsed ? (
                    <Tooltip key={item.path} title={item.label} placement="right">
                      <li>{link}</li>
                    </Tooltip>
                  ) : (
                    <li key={item.path}>{link}</li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className={`shrink-0 p-4 border-t border-on-surface/5 dark:border-white/5 ${collapsed ? 'flex justify-center' : ''}`}>
          {collapsed ? (
            <Tooltip title="Admin User" placement="right">
              <Avatar size={36} icon={<UserOutlined />} className="bg-primary/10 text-primary cursor-pointer" />
            </Tooltip>
          ) : (
            <Dropdown menu={{ items: userDropdownItems }} placement="topLeft" trigger={['click']}>
              <div className="flex items-center gap-3 cursor-pointer group p-2 rounded-xl hover:bg-surface-low dark:hover:bg-zinc-800 transition-all">
                <Avatar size={36} icon={<UserOutlined />} className="bg-primary/10 text-primary shrink-0" />
                <div className="overflow-hidden">
                  <span className="block text-sm font-bold text-on-surface dark:text-zinc-100 truncate">Admin Rifaya Tryout</span>
                  <span className="block text-[10px] text-on-surface/40 dark:text-zinc-500 truncate">admin@rifayatryout.edu.id</span>
                </div>
              </div>
            </Dropdown>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ──────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header bar */}
        <header className="
          h-16 shrink-0 flex items-center justify-between px-6
          bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl
          border-b border-on-surface/5 dark:border-white/5
          shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]
          transition-colors duration-300
        ">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface/40 dark:text-zinc-400 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
          >
            {collapsed ? <MenuUnfoldOutlined className="text-base" /> : <MenuFoldOutlined className="text-base" />}
          </button>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface/40 dark:text-zinc-400 hover:text-primary hover:bg-surface-low dark:hover:bg-zinc-800 transition-all"
            >
              {mode === 'dark' ? <SunOutlined className="text-base" /> : <MoonOutlined className="text-base" />}
            </button>

            {/* Notification Bell */}
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface/40 dark:text-zinc-400 hover:text-primary hover:bg-surface-low dark:hover:bg-zinc-800 transition-all relative">
              <Badge count={3} size="small">
                <BellOutlined className="text-base" />
              </Badge>
            </button>

            {/* User Avatar */}
            <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight" trigger={['click']}>
              <div className="flex items-center gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-surface-low dark:hover:bg-zinc-800 transition-all">
                <Avatar size={32} icon={<UserOutlined />} className="bg-primary/10 text-primary" />
                <span className="hidden sm:block text-sm font-bold text-on-surface dark:text-zinc-100">Admin</span>
              </div>
            </Dropdown>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
