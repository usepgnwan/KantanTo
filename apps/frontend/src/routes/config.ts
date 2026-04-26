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
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Practice = React.lazy(() => import('../pages/Practice'));
const Review = React.lazy(() => import('../pages/Review'));
const MaterialDetail = React.lazy(() => import('../pages/MaterialDetail'));
const VideoPlayer = React.lazy(() => import('../pages/VideoPlayer'));
const ExamSimulation = React.lazy(() => import('../pages/ExamSimulation'));
const Contact = React.lazy(() => import('../pages/Contact'));
const BlogList = React.lazy(() => import('../pages/BlogList'));
const BlogDetail = React.lazy(() => import('../pages/BlogDetail'));
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const AdminAnalytics = React.lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminPackageForm = React.lazy(() => import('../pages/admin/AdminPackageForm'));
const AdminPackageSettings = React.lazy(() => import('../pages/admin/AdminPackageSettings'));
const AdminUsers = React.lazy(() => import('../pages/admin/AdminUsers'));
const AdminOrders = React.lazy(() => import('../pages/admin/AdminOrders'));
const AdminMaterialForm = React.lazy(() => import('../pages/admin/AdminMaterialForm'));
const AdminVouchers = React.lazy(() => import('../pages/admin/AdminVouchers'));
const AdminSettings = React.lazy(() => import('../pages/admin/AdminSettings'));
const AdminCategories = React.lazy(() => import('../pages/admin/AdminCategories'));
const AdminClasses = React.lazy(() => import('../pages/admin/AdminClasses'));
const AdminSubjects = React.lazy(() => import('../pages/admin/AdminSubjects'));
const AdminRoles = React.lazy(() => import('../pages/admin/AdminRoles'));
const NotFound = React.lazy(() => import('../pages/NotFound'));

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
    id: 'dashboard',
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
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
    id: 'review',
    path: '/riwayat/:id/review',
    name: 'Review Tryout',
    component: Review,
    hidden: true,
  },
  {
    id: 'latihan',
    path: '/latihan',
    name: 'Latihan Soal',
    component: Practice,
    hidden: true,
  },
  {
    id: 'materi-detail',
    path: '/materi/:id',
    name: 'Detail Materi',
    component: MaterialDetail,
    hidden: true,
  },
  {
    id: 'video-player',
    path: '/video/:id',
    name: 'Video Player',
    component: VideoPlayer,
    hidden: true,
  },
  {
    id: 'blog',
    path: '/blog',
    name: 'Blog',
    component: BlogList,
    guest: true,
  },
  {
    id: 'kontak',
    path: '/kontak',
    name: 'Kontak',
    component: Contact,
    guest: true,
  },
  {
    id: 'blog-detail',
    path: '/blog/:slug',
    name: 'Detail Blog',
    component: BlogDetail,
    hidden: true,
    guest: true,
  },
  {
    id: 'exam',
    path: '/exam/:id',
    name: 'Ujian',
    component: ExamSimulation,
    hidden: true,
    guest: true,
  },
  {
    id: 'admin-dashboard',
    path: '/admin/dashboard',
    name: 'Admin Dashboard',
    component: AdminDashboard,
    hidden: true,
  },
  {
    id: 'admin-analytics',
    path: '/admin/analytics',
    name: 'Admin Analytics',
    component: AdminAnalytics,
    hidden: true,
  },
  {
    id: 'admin-packages',
    path: '/admin/packages',
    name: 'Paket & Soal',
    component: AdminPackageForm,
    hidden: true,
  },
  {
    id: 'admin-package-settings',
    path: '/admin/packages/:id',
    name: 'Kelola Paket',
    component: AdminPackageSettings,
    hidden: true,
  },
  {
    id: 'admin-users',
    path: '/admin/users',
    name: 'Pengguna',
    component: AdminUsers,
    hidden: true,
  },
  {
    id: 'admin-orders',
    path: '/admin/orders',
    name: 'Pesanan',
    component: AdminOrders,
    hidden: true,
  },
  {
    id: 'admin-materials',
    path: '/admin/materials',
    name: 'Manajemen Blog',
    component: AdminMaterialForm,
    hidden: true,
  },
  {
    id: 'admin-settings',
    path: '/admin/settings',
    name: 'Pengaturan',
    component: AdminSettings,
    hidden: true,
  },
  {
    id: 'admin-roles',
    path: '/admin/roles',
    name: 'Manajemen Roles',
    component: AdminRoles,
    hidden: true,
  },
  {
    id: 'admin-vouchers',
    path: '/admin/vouchers',
    name: 'Voucher',
    component: AdminVouchers,
    hidden: true,
  },
  {
    id: 'admin-master-categories',
    path: '/admin/master/categories',
    name: 'Kelola Kategori',
    component: AdminCategories,
    hidden: true,
  },
  {
    id: 'admin-master-classes',
    path: '/admin/master/classes',
    name: 'Kelola Kelas',
    component: AdminClasses,
    hidden: true,
  },
  {
    id: 'admin-master-subjects',
    path: '/admin/master/subjects',
    name: 'Kelola Mapel',
    component: AdminSubjects,
    hidden: true,
  },
  {
    id: 'not-found',
    path: '*',
    name: '404',
    component: NotFound,
    hidden: true,
    guest: true,
  },
];
