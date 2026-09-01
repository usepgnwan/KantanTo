import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Typography, Row, Col, Card, Tag, Space, Button, Empty, Spin } from 'antd';
import { ArrowRightOutlined, StarFilled, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';

import AppLayout from '../layouts/AppLayout';
import HeroSection from '../components/organisms/HeroSection';
import StatsBar from '../components/organisms/StatsBar';
import FeaturesGrid from '../components/organisms/FeaturesGrid';
import InteractiveWidgets from '../components/organisms/InteractiveWidgets';
import CustomerReviews from '../components/organisms/CustomerReviews';
import ContactForm from '../components/organisms/ContactForm';
import FloatingWhatsApp from '../components/atoms/FloatingWhatsApp';
import PackageCard, { PackageProps } from '../components/molecules/PackageCard';

import { getPackages, PackageListItem } from '../services/packageService';
import { getArtikel, Artikel } from '../services/artikelService';
import { getMyPackagesAPI } from '../services/myPackageService';
import { useAuth } from '../context/AuthContext';

const backendUrl = process.env.REACT_APP_LINK_BACKEND?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:3026';
const fallbackImage = 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800';
const { Title, Paragraph, Text } = Typography;

const toPackageCard = (pkg: PackageListItem): PackageProps => {
  let finalPrice = pkg.price;
  let originalPrice = 0;

  if (pkg.is_bundle && pkg.original_price && pkg.original_price > pkg.price) {
    originalPrice = pkg.original_price;
    finalPrice = pkg.price;
  } else if (pkg.discount_type === 'percent') {
    finalPrice = pkg.price - (pkg.price * (pkg.discount_value || 0)) / 100;
    originalPrice = pkg.price;
  } else if (pkg.discount_type === 'harga') {
    finalPrice = pkg.price - (pkg.discount_value || 0);
    originalPrice = pkg.price;
  }

  return {
    id: pkg.slug,
    slug: pkg.slug,
    title: pkg.title,
    image: pkg.thumbnail || fallbackImage,
    price: finalPrice,
    originalPrice: originalPrice,
    rating: 5,
    studentCount: 0,
    duration: pkg.is_bundle ? 'Sesuai Sub-Paket' : (pkg.duration > 0 ? `${pkg.duration} Menit` : 'Tryout'),
    category: pkg.category || (pkg.is_bundle ? 'Bundle Hemat' : 'Tryout'),
    classes: pkg.classes,
    subjects: pkg.subjects,
    isPopular: pkg.questions_count > 0 || Boolean(pkg.is_bundle),
    is_lifetime: pkg.is_lifetime,
    validity_days: pkg.validity_days,
    max_exam_attempts: pkg.max_exam_attempts,
    questions_count: pkg.questions_count,
    materials_count: pkg.materials_count,
    videos_count: pkg.videos_count,
    is_bundle: pkg.is_bundle,
    bundled_package_ids: pkg.bundled_package_ids,
    bundled_packages: pkg.bundled_packages,
  };
};

const IndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageProps[]>([]);
  const [ownedSlugs, setOwnedSlugs] = useState<Set<string>>(new Set());
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'bundle' | 'single'>('all');

  const [blogs, setBlogs] = useState<Artikel[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  // Fetch owned packages
  useEffect(() => {
    if (user?.id) {
      getMyPackagesAPI(user.id, 'active')
        .then((myTransactions) => {
          const slugs = new Set(
            (myTransactions || [])
              .filter((tx) => {
                if (!tx.is_lifetime && tx.active_until && dayjs(tx.active_until).isBefore(dayjs())) {
                  return false;
                }
                if (tx.max_exam_attempts > 0 && tx.used_exam_attempts >= tx.max_exam_attempts) {
                  return false;
                }
                return true;
              })
              .map((tx) => tx.package?.slug)
              .filter(Boolean) as string[]
          );
          setOwnedSlugs(slugs);
        })
        .catch(console.error);
    }
  }, [user]);

  // Fetch published packages
  useEffect(() => {
    let mounted = true;

    getPackages()
      .then((data) => {
        if (mounted) {
          setPackages(data.filter((pkg) => pkg.status === 'published').map(toPackageCard));
        }
      })
      .catch(() => {
        if (mounted) {
          setPackages([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingPackages(false);
        }
      });

    getArtikel(1, 5, '', 'publish')
      .then((res) => {
        if (mounted) {
          setBlogs(res.list?.rows || []);
        }
      })
      .catch(() => {
        if (mounted) setBlogs([]);
      })
      .finally(() => {
        if (mounted) setLoadingBlogs(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const bundleCount = useMemo(() => packages.filter(p => p.is_bundle).length, [packages]);
  const singleCount = useMemo(() => packages.filter(p => !p.is_bundle).length, [packages]);

  const displayedPackages = useMemo(() => {
    let list = packages;
    if (activeTab === 'bundle') {
      list = packages.filter(p => p.is_bundle);
    } else if (activeTab === 'single') {
      list = packages.filter(p => !p.is_bundle);
    }
    return list.slice(0, 8);
  }, [packages, activeTab]);

  return (
    <AppLayout>
      <HeroSection />
      <StatsBar />
      <FeaturesGrid />
      <InteractiveWidgets />

      {/* Package Catalog - Katalog Tryout Unggulan */}
      <section id="paket" className="py-24 bg-background dark:bg-zinc-800/10 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 text-primary font-bold mb-2">
              <AppstoreOutlined />
              <span className="uppercase tracking-widest text-xs">Pilihan Terbaik</span>
            </div>
            <Title level={2} className="!text-3xl md:!text-5xl !font-black !font-manrope mb-4">
              Katalog Tryout Unggulan
            </Title>
            <Paragraph className="text-base md:text-lg text-surface-on/60 max-w-2xl mx-auto m-0">
              Pilihlah paket yang sesuai dengan minat dan target PTN impian Anda.
            </Paragraph>
          </div>

          {/* Tab Filter */}
          <div className="flex justify-center items-center gap-2 mb-12 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all cursor-pointer border ${
                activeTab === 'all'
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-white dark:bg-zinc-900 text-on-surface/70 border-surface-container hover:border-primary/40'
              }`}
            >
              Semua Paket ({packages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bundle')}
              className={`px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                activeTab === 'bundle'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20'
                  : 'bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-300 border-purple-200 hover:border-purple-400'
              }`}
            >
              <span>🎁 Paket Bundle</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${activeTab === 'bundle' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
                {bundleCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all cursor-pointer border ${
                activeTab === 'single'
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'bg-white dark:bg-zinc-900 text-on-surface/70 border-surface-container hover:border-primary/40'
              }`}
            >
              Paket Satuan ({singleCount})
            </button>
          </div>

          <Spin spinning={loadingPackages}>
            {displayedPackages.length > 0 ? (
              <>
                <Row gutter={[24, 24]}>
                  {displayedPackages.map((pkg) => (
                    <Col xs={24} sm={12} lg={6} key={pkg.id}>
                      <PackageCard {...pkg} isOwned={ownedSlugs.has(pkg.slug)} />
                    </Col>
                  ))}
                </Row>

                <div className="mt-14 text-center">
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate('/paket')}
                    className="h-14 px-8 rounded-2xl font-bold shadow-xl shadow-primary/20 text-base inline-flex items-center gap-2"
                  >
                    <span>Lihat Seluruh Katalog Paket</span>
                    <ArrowRightOutlined />
                  </Button>
                </div>
              </>
            ) : (
              <Card className="border-none glass rounded-3xl py-16 text-center max-w-lg mx-auto">
                <Empty
                  description={
                    <div className="space-y-1">
                      <Text className="font-bold text-base block text-on-surface">
                        {loadingPackages ? 'Memuat paket...' : 'Belum ada paket yang dipublikasikan'}
                      </Text>
                      <Text className="text-xs text-on-surface/50 block">
                        Silakan cek kembali beberapa saat lagi.
                      </Text>
                    </div>
                  }
                />
              </Card>
            )}
          </Spin>
        </div>
      </section>

      {/* Top 5 Blogs Section */}
      <section className="py-24 bg-white dark:bg-zinc-900 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 sm:mb-16 gap-6">
            <div>
              <Text className="text-[10px] uppercase font-black tracking-[0.3em] text-primary block mb-3 sm:mb-4">Kantan Insight</Text>
              <Title level={2} className="!text-3xl sm:!text-4xl !font-manrope !m-0">Artikel &amp; Berita Terbaru</Title>
            </div>
            <Button type="link" onClick={() => navigate('/blog')} className="hidden sm:flex font-bold px-0 text-base h-auto">
              Lihat Semua Artikel <ArrowRightOutlined />
            </Button>
          </div>

          <Spin spinning={loadingBlogs}>
            {blogs.length > 0 ? (
              <Row gutter={[32, 32]}>
                {/* Headline (1st post) */}
                <Col xs={24} lg={12}>
                  <Card
                    className="border-none group overflow-hidden rounded-[24px] sm:rounded-[32px] shadow-xl hover:shadow-2xl transition-all shadow-primary/5 bg-surface-low/30 h-full p-0 cursor-pointer flex flex-col"
                    bodyStyle={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
                    onClick={() => navigate(`/blog/${blogs[0].slug}`)}
                  >
                    <div className="aspect-video sm:aspect-[16/10] overflow-hidden relative shrink-0">
                      <img src={blogs[0].thumbnail ? `${backendUrl}${blogs[0].thumbnail}` : '/logo-rifaya.png'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={blogs[0].judul} />
                      <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                        <StarFilled className="text-[8px]" /> Terbaru
                      </div>
                    </div>
                    <div className="p-6 sm:p-8 flex flex-col flex-1">
                      <Tag className="rounded-full bg-primary/10 text-primary border-none font-bold text-[9px] px-3 uppercase tracking-tighter mb-4 w-fit">
                        {blogs[0].category?.title || 'Umum'}
                      </Tag>
                      <Title level={3} className="!font-manrope !font-black !mb-4 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {blogs[0].judul}
                      </Title>
                      <Paragraph className="text-on-surface/60 line-clamp-2 sm:line-clamp-3 mb-0 text-sm sm:text-base">
                        {blogs[0].deskripsi}
                      </Paragraph>
                    </div>
                  </Card>
                </Col>

                {/* 4 other posts */}
                <Col xs={24} lg={12}>
                  <div className="flex flex-col gap-4 sm:gap-6 h-full justify-start">
                    {blogs.slice(1, 5).map(post => (
                      <div key={post.id} className="flex gap-3 sm:gap-5 group cursor-pointer bg-white dark:bg-zinc-800/50 p-2 sm:p-3 rounded-2xl sm:rounded-[20px] hover:shadow-lg transition-all" onClick={() => navigate(`/blog/${post.slug}`)}>
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden shrink-0">
                          <img src={post.thumbnail ? `${backendUrl}${post.thumbnail}` : '/logo-rifaya.png'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={post.judul} />
                        </div>
                        <div className="flex flex-col justify-center flex-1 py-1 sm:py-2 pr-2">
                          <Space className="mb-1 sm:mb-2 flex-wrap gap-y-1">
                            <Text className="text-[9px] sm:text-[10px] text-primary font-black uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-md">
                              {post.category?.title || 'Umum'}
                            </Text>
                            <Text className="text-[9px] sm:text-[10px] text-on-surface/40 font-bold">
                              {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                          </Space>
                          <Title level={5} className="!font-manrope !font-black !m-0 !text-sm sm:!text-base group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {post.judul}
                          </Title>
                        </div>
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>
            ) : (
              <Empty description="Belum ada artikel" />
            )}
          </Spin>
        </div>
      </section>

      <CustomerReviews />
      <ContactForm />
      <FloatingWhatsApp />
    </AppLayout>
  );
};

export default IndexPage;
