import React from 'react';

// Lazy load components
const Landing = React.lazy(() => import('../pages/Index'));
const LoginPage = React.lazy(() => import('../pages/Login'));
const RegisterPage = React.lazy(() => import('../pages/Register'));
const Packages = React.lazy(() => import('../pages/Packages'));
const PackageDetail = React.lazy(() => import('../pages/PackageDetail'));
const History = React.lazy(() => import('../pages/History'));
const Cart = React.lazy(() => import('../pages/Cart'));
const Checkout = React.lazy(() => import('../pages/Checkout'));
const Profile = React.lazy(() => import('../pages/Profile'));

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
    component: Landing,
    guest: true,
  },
  {
    id: 'login',
    path: '/login',
    name: 'Masuk',
    component: LoginPage,
    hidden: true,
    guest: true,
  },
  {
    id: 'register',
    path: '/register',
    name: 'Daftar',
    component: RegisterPage,
    hidden: true,
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
    id: 'keranjang',
    path: '/keranjang',
    name: 'Keranjang',
    component: Cart,
    hidden: true,
    guest: true,
  },
  {
    id: 'checkout',
    path: '/checkout',
    name: 'Selesaikan Pesanan',
    component: Checkout,
    hidden: true,
    guest: true,
  },
  {
    id: 'profile',
    path: '/profile',
    name: 'Profil Saya',
    component: Profile,
    hidden: true,
  },
  {
    id: 'riwayat',
    path: '/riwayat',
    name: 'Riwayat Tryout',
    component: History,
    hidden: true,
  },
  {
    id: 'kontak',
    path: '/#kontak',
    name: 'Kontak',
    component: Landing,
    guest: true,
  },
];
