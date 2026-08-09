import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Tag, Space, Button, Empty, Spin } from 'antd';
import { UserOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import AppLayout from '../layouts/AppLayout';
import HeroSection from '../components/organisms/HeroSection';
import StatsBar from '../components/organisms/StatsBar';
import FeaturesGrid from '../components/organisms/FeaturesGrid';
import InteractiveWidgets from '../components/organisms/InteractiveWidgets';
import CustomerReviews from '../components/organisms/CustomerReviews';
import ContactForm from '../components/organisms/ContactForm';
import FloatingWhatsApp from '../components/atoms/FloatingWhatsApp';

import { getPackages, PackageListItem } from '../services/packageService';
import { recordMenuLogAPI } from '../services/logService';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph, Text } = Typography;

const IndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

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
                          <Text className="text-xs text-surface-on/40 line-through">
                            Rp {Number(pkg.price * 2).toLocaleString('id-ID')}
                          </Text>
                          <div className="flex items-end space-x-1">
                            <Text className="text-xl font-bold text-primary">
                              {pkg.price === 0 ? 'Gratis' : `Rp ${Number(pkg.price).toLocaleString('id-ID')}`}
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

      <CustomerReviews />
      
      <ContactForm />

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-br from-primary to-primary-container text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 py-20">
          <Title level={2} className="!text-white !text-3xl md:!text-5xl mb-8">Siap Bersaing di SNBT {new Date().getFullYear()}?</Title>
          <Paragraph className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan pejuang PTN lainnya dan mulailah latihan intensif hari ini.
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
