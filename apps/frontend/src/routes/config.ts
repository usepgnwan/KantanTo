import React from 'react';

// Lazy load components
const Login = React.lazy(() => import('../pages/Index'));
const Packages = React.lazy(() => import('../pages/Packages'));
const PackageDetail = React.lazy(() => import('../pages/PackageDetail'));
const Platform = React.lazy(() => import('../pages/Home'));
const History = React.lazy(() => import('../pages/History'));
const Clockin = React.lazy(() => import('../pages/Clockin'));
const Karyawan = React.lazy(() => import('../pages/Karyawan'));

export interface MenuItem {
  id: string;
  path: string;
  name: string;
  component: any;
  roles?: string[];
  permissions?: string[];
  children?: MenuItem[];
  hidden?: boolean;
  guest?: boolean;
}

export const menuConfig: MenuItem[] = [
  {
    id: 'home',
    path: '/',
    name: 'Beranda',
    component: Login,
    guest: true,
  },
  {
    id: 'paket',
    path: '/paket',
    name: 'Katalog Paket',
    component: Packages,
    guest: true,
  },
  {
    id: 'paket-detail',
    path: '/paket/:slug',
    name: 'Detail Paket',
    component: PackageDetail,
    hidden: true,
    guest: true,
  },
  {
    id: 'kontak',
    path: '/#kontak',
    name: 'Kontak',
    component: Login,
    guest: true,
  },
];
