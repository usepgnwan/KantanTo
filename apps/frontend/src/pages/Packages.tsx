import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import PackageCard, { PackageProps } from '../components/molecules/PackageCard';
import PackageFilters from '../components/organisms/PackageFilters';
import LatestActivity from '../components/molecules/LatestActivity';
import CustomerReviews from '../components/organisms/CustomerReviews';
import { 
  Typography, 
  Row, 
  Col, 
  Input, 
  Select, 
  Pagination, 
  Empty, 
  Breadcrumb,
  Space,
  Card,
  Spin
} from 'antd';
import { SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import { getPackages, PackageListItem } from '../services/packageService';

const { Title, Text, Paragraph } = Typography;

const fallbackImage = 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800';

const toPackageCard = (pkg: PackageListItem): PackageProps => ({
  id: pkg.slug,
  slug: pkg.slug,
  title: pkg.title,
  image: pkg.thumbnail || fallbackImage,
  price: pkg.price,
  originalPrice: pkg.price > 0 ? pkg.price * 2 : 0,
  rating: 5,
  studentCount: 0,
  duration: pkg.duration > 0 ? `${pkg.duration} Menit` : 'Tryout',
  category: pkg.category || 'Tryout',
  classes: pkg.classes,
  subjects: pkg.subjects,
  isPopular: pkg.questions_count > 0,
});

const PackagesPage: React.FC = () => {
  const [packages, setPackages] = useState<PackageProps[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const filteredPackages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const searched = query
      ? packages.filter((pkg) =>
          [pkg.title, pkg.category, ...pkg.classes, ...pkg.subjects]
            .join(' ')
            .toLowerCase()
            .includes(query)
        )
      : packages;

    return [...searched].sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'newest') return b.slug.localeCompare(a.slug);
      return Number(b.isPopular) - Number(a.isPopular);
    });
  }, [packages, searchQuery, sortBy]);

  const visiblePackages = filteredPackages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  return (
    <AppLayout>
      <div className="bg-surface-low/30 pt-32 pb-24 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-8">
            <Breadcrumb.Item>Beranda</Breadcrumb.Item>
            <Breadcrumb.Item>Katalog Paket</Breadcrumb.Item>
          </Breadcrumb>

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-primary font-bold mb-2">
                 <AppstoreOutlined />
                 <span className="uppercase tracking-widest text-xs">Explore Catalog</span>
              </div>
              <Title level={1} className="!text-4xl md:!text-5xl !font-manrope !m-0">Katalog Paket Belajar</Title>
              <Paragraph className="text-lg text-surface-on/60 mt-4 !m-0">
                Temukan amunisi terbaikmu untuk menaklukkan SNBT 2024. Pilih paket yang sesuai kebutuhanmu.
              </Paragraph>
            </div>
            
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
              <Input 
                placeholder="Cari paket tryout..." 
                prefix={<SearchOutlined className="text-surface-on/30" />}
                className="h-12 w-full sm:w-64 rounded-xl border-none shadow-sm"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <Select
                value={sortBy}
                onChange={setSortBy}
                className="h-12 w-full sm:w-48"
                style={{ borderRadius: '12px' }}
                options={[
                  { value: 'popular', label: 'Terpopuler' },
                  { value: 'newest', label: 'Terbaru' },
                  { value: 'price-low', label: 'Harga Terendah' },
                  { value: 'price-high', label: 'Harga Tertinggi' },
                ]}
              />
            </div>
          </div>

          <Row gutter={[32, 32]}>
            {/* Sidebar - Desktop Refinement */}
            <Col xs={24} lg={6} className="order-2 lg:order-1">
              <PackageFilters />
              <LatestActivity />
            </Col>

            {/* Main Content */}
            <Col xs={24} lg={18} className="order-1 lg:order-2">
              <div className="min-h-[600px]">
                <Spin spinning={loadingPackages}>
                  {visiblePackages.length > 0 ? (
                    <>
                      <Row gutter={[24, 24]}>
                        {visiblePackages.map((pkg) => (
                          <Col xs={24} sm={12} xl={8} key={pkg.id}>
                            <PackageCard {...pkg} />
                          </Col>
                        ))}
                      </Row>

                      <div className="mt-16 flex justify-center">
                        <Pagination
                          current={currentPage}
                          total={filteredPackages.length}
                          pageSize={pageSize}
                          onChange={(page) => setCurrentPage(page)}
                          className="weightless-pagination"
                        />
                      </div>
                    </>
                  ) : (
                    <Card className="border-none glass rounded-3xl py-20">
                      <Empty description={loadingPackages ? 'Memuat paket...' : 'Tidak ada paket published yang ditemukan'} />
                    </Card>
                  )}
                </Spin>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <CustomerReviews />

      {/* Mini CTA */}
      <section className="py-20 bg-white dark:bg-black border-t border-surface-container">
        <div className="max-w-4xl mx-auto px-4 text-center">
           <Title level={3} className="!font-manrope mb-6 italic">"Pendidikan adalah senjata paling mematikan di dunia, karena dengan itu Anda bisa mengubah dunia."</Title>
           <Text className="text-surface-on/60">— Nelson Mandela</Text>
        </div>
      </section>
    </AppLayout>
  );
};

export default PackagesPage;
