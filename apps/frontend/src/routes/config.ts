import React from 'react';

// Lazy load components
const Landing = React.lazy(() => import('../pages/Index'));
const LoginPage = React.lazy(() => import('../pages/Login'));
const RegisterPage = React.lazy(() => import('../pages/Register'));
const OAuthCallback = React.lazy(() => import('../pages/OAuthCallback'));
const ForgotPassword = React.lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('../pages/ResetPassword'));
const Packages = React.lazy(() => import('../pages/Packages'));
const PackageDetail = React.lazy(() => import('../pages/PackageDetail'));
const PackageMaterials = React.lazy(() => import('../pages/PackageMaterials'));
const PackageMaterialDetail = React.lazy(() => import('../pages/PackageMaterialDetail'));
const History = React.lazy(() => import('../pages/History'));
const Cart = React.lazy(() => import('../pages/Cart'));
const Checkout = React.lazy(() => import('../pages/Checkout'));
const Profile = React.lazy(() => import('../pages/Profile'));
const Purchases = React.lazy(() => import('../pages/Purchases'));
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
const AdminEducationLevels = React.lazy(() => import('../pages/admin/AdminEducationLevels'));
const AdminContactMessages = React.lazy(() => import('../pages/admin/AdminContactMessages'));
const AdminSubjects = React.lazy(() => import('../pages/admin/AdminSubjects'));
const AdminRoles = React.lazy(() => import('../pages/admin/AdminRoles'));
const AdminExamHistory = React.lazy(() => import('../pages/admin/AdminExamHistory'));
const AdminExampleExams = React.lazy(() => import('../pages/admin/AdminExampleExams'));
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
  allowAdmin?: boolean;
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
    id: 'oauth-callback',
    path: '/oauth/callback',
    name: 'OAuth Callback',
    component: OAuthCallback,
    hidden: true,
    guest: true,
  },
  {
    id: 'forgot-password',
    path: '/forgot-password',
    name: 'Lupa Password',
    component: ForgotPassword,
    hidden: true,
    guest: true,
  },
  {
    id: 'reset-password',
    path: '/reset-password',
    name: 'Reset Password',
    component: ResetPassword,
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
    id: 'paket-materials',
    path: '/paket/:slug/materi',
    name: 'Materi Paket',
    component: PackageMaterials,
    hidden: true,
    guest: true,
  },
  {
    id: 'paket-material-detail',
    path: '/paket/:slug/materi/:materialSlug',
    name: 'Detail Materi Paket',
    component: PackageMaterialDetail,
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
    id: 'pembelian',
    path: '/pembelian',
    name: 'Pembelian',
    component: Purchases,
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
    allowAdmin: true,
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
    allowAdmin: true,
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
    id: 'admin-example-exam',
    path: '/admin/example-exam',
    name: 'Soal Landing Page',
    component: AdminExampleExams,
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
    id: 'admin-exam-history',
    path: '/admin/exam-history',
    name: 'Riwayat Ujian',
    component: AdminExamHistory,
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
    id: 'admin-grades',
    path: '/admin/grades',
    name: 'Kelas (Grade)',
    component: AdminClasses,
    hidden: true,
  },
  {
    id: 'admin-education-levels',
    path: '/admin/education-levels',
    name: 'Tingkat Pendidikan',
    component: AdminEducationLevels,
    hidden: true,
  },
  {
    id: 'admin-contact-messages',
    path: '/admin/messages',
    name: 'Pesan Masuk',
    component: AdminContactMessages,
    hidden: true,
  },
  {
    id: 'admin-subjects',
    path: '/admin/subjects',
    name: 'Mata Pelajaran',
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
