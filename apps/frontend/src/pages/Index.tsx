import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Tag, Space, Button, Empty, Spin } from 'antd';
import { UserOutlined, CheckCircleFilled, ArrowRightOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';

import AppLayout from '../layouts/AppLayout';
import HeroSection from '../components/organisms/HeroSection';
import StatsBar from '../components/organisms/StatsBar';
import FeaturesGrid from '../components/organisms/FeaturesGrid';
import InteractiveWidgets from '../components/organisms/InteractiveWidgets';
import CustomerReviews from '../components/organisms/CustomerReviews';
import ContactForm from '../components/organisms/ContactForm';
import FloatingWhatsApp from '../components/atoms/FloatingWhatsApp';

import { getPackages, PackageListItem } from '../services/packageService';
import { getArtikel, Artikel } from '../services/artikelService';
import { recordMenuLogAPI } from '../services/logService';
import { useAuth } from '../context/AuthContext';

const backendUrl = process.env.REACT_APP_LINK_BACKEND?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:3026';
const { Title, Paragraph, Text } = Typography;

const IndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const [blogs, setBlogs] = useState<Artikel[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  const handlePackageClick = (pkg: PackageListItem) => {
    const device = window.innerWidth < 768 ? 'mobile' : 'web';
    recordMenuLogAPI({
      path: `/paket/${pkg.slug}`,
      label: pkg.title,
      device,
      user_id: user?.id,
    });
    navigate(`/paket/${pkg.slug}`);
  };

  useEffect(() => {
    let mounted = true;

    getPackages()
      .then((data) => {
        if (mounted) {
          setPackages(data.filter((pkg) => pkg.status === 'published'));
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

  return (
    <AppLayout>
      <HeroSection />
      <StatsBar />
      <FeaturesGrid />
      <InteractiveWidgets />

      {/* Package Catalog - 4 Grid */}
      <section id="paket" className="py-24 bg-background dark:bg-zinc-800/10 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <Title level={2} className="!text-4xl !font-manrope mb-4">Katalog Tryout Unggulan</Title>
          <Paragraph className="text-lg text-surface-on/60 max-w-2xl mx-auto">
            Pilihlah paket yang sesuai dengan minat dan target PTN impian Anda.
          </Paragraph>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Spin spinning={loadingPackages}>
            {packages.length > 0 ? (
              <Row gutter={[24, 24]}>
                {packages.slice(0, 4).map((pkg) => (
                  <Col xs={24} sm={12} lg={6} key={pkg.slug}>
                    <Card
                      className="h-full weightless-card border-none hover:shadow-2xl transition-all"
                      cover={
                        <div className="h-24 bg-primary/5 flex items-center justify-center relative overflow-hidden">
                          <Tag color="blue" className="m-0 absolute top-4 left-4 font-bold border-none">
                            PUBLISHED
                          </Tag>
                          <div className="absolute top-0 right-0 w-16 h-16 bg-primary opacity-5 rounded-bl-full" />
                        </div>
                      }
                    >
                      <Space direction="vertical" className="w-full" size="small">
                        <Title level={4} className="m-0">{pkg.title}</Title>
                        <div className="flex items-center space-x-2 text-surface-on/60 text-xs">
                          <UserOutlined />
                          <span>{pkg.category || 'Tryout'} Berlangganan</span>
                        </div>

                        <div className="py-4">
                          {pkg.discount_type && (
                            <Text className="text-xs text-surface-on/40 line-through">
                              Rp {Number(pkg.price).toLocaleString('id-ID')}
                            </Text>
                          )}
                          <div className="flex items-end space-x-1">
                            <Text className="text-xl font-bold text-primary">
                              {(() => {
                                const finalPrice = pkg.discount_type === 'percent'
                                  ? pkg.price - (pkg.price * (pkg.discount_value || 0)) / 100
                                  : pkg.discount_type === 'harga'
                                  ? pkg.price - (pkg.discount_value || 0)
                                  : pkg.price;
                                return finalPrice === 0 ? 'Gratis' : `Rp ${Number(finalPrice).toLocaleString('id-ID')}`;
                              })()}
                            </Text>
                            <Text className="text-xs text-surface-on/60 mb-1">/Paket</Text>
                          </div>
                        </div>

                        <div className="space-y-2 mb-6">
                          {[
                            `${pkg.questions_count} Soal`,
                            `${pkg.materials_count} Materi`,
                            `${pkg.videos_count} Video Pembahasan`,
                          ].map((feature) => (
                            <div key={feature} className="flex items-center space-x-2">
                              <CheckCircleFilled className="text-primary/40 text-xs" />
                              <Text className="text-xs text-surface-on/70">{feature}</Text>
                            </div>
                          ))}
                        </div>

                        <Button
                          type="primary"
                          block
                          className="h-10 rounded-xl font-bold"
                          onClick={() => handlePackageClick(pkg)}
                        >
                          Pilih Paket
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Card className="border-none glass rounded-3xl py-12">
                <Empty description="Belum ada paket published" />
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
                      <img src={blogs[0].thumbnail ? `${backendUrl}${blogs[0].thumbnail}` : 'https://images.unsplash.com/photo-1434031211128-095490e7e7e9?auto=format&fit=crop&q=80&w=800'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={blogs[0].judul} />
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
                          <img src={post.thumbnail ? `${backendUrl}${post.thumbnail}` : 'https://images.unsplash.com/photo-1434031211128-095490e7e7e9?auto=format&fit=crop&q=80&w=800'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={post.judul} />
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

            {/* Mobile View All Button */}
            <div className="mt-8 text-center sm:hidden">
              <Button type="primary" block className="h-12 rounded-xl font-bold shadow-md shadow-primary/20" onClick={() => navigate('/blog')}>
                Lihat Semua Artikel
              </Button>
            </div>
          </Spin>
        </div>
      </section>

      <CustomerReviews />

      <ContactForm />

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-br from-primary to-primary-container text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 py-20">
          <Title level={2} className="!text-white !text-3xl md:!text-5xl mb-8">Mulai Tryout Saat Ini</Title>
          <Paragraph className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Asah pemahaman materi dan raih nilai impianmu. Mulai latihan tryout intensif sekarang untuk persiapan ujian yang lebih matang!
          </Paragraph>
          <button className="bg-white text-primary px-12 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl">
            Ikuti Tryout Sekarang
          </button>
        </div>
      </section>

      <FloatingWhatsApp />
    </AppLayout>
  );
};

export default IndexPage;
