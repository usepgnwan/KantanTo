import React, { useState } from 'react';
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
  Card
} from 'antd';
import { SearchOutlined, AppstoreOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// Mock data for packages
const mockPackages: PackageProps[] = [
  {
    id: '1',
    slug: 'saintek-pro',
    title: 'Intensive SNBT 2024 - Saintek Pro',
    image: 'https://images.unsplash.com/photo-1434031211128-095490e7e7e9?auto=format&fit=crop&q=80&w=800',
    price: 75000,
    originalPrice: 150000,
    rating: 5,
    studentCount: 850,
    duration: '30 Hari',
    category: 'Intensive Bootcamp',
    isPopular: true
  },
  {
    id: '2',
    slug: 'soshum-mastery',
    title: 'Soshum Mastery - Full Package',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800',
    price: 75000,
    originalPrice: 150000,
    rating: 4.8,
    studentCount: 920,
    duration: '30 Hari',
    category: 'Intensive Bootcamp'
  },
  {
    id: '3',
    slug: 'mock-tryout-akbar',
    title: 'Mock Tryout Akbar - Sistem IRT',
    image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800',
    price: 25000,
    originalPrice: 50000,
    rating: 4.9,
    studentCount: 1200,
    duration: '7 Hari',
    category: 'Mock Exams'
  },
  {
    id: '4',
    slug: 'literasi-inggris',
    title: 'Katalog Literasi Bahasa Inggris',
    image: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&q=80&w=800',
    price: 45000,
    originalPrice: 90000,
    rating: 4.7,
    studentCount: 450,
    duration: '14 Hari',
    category: 'Subject Mastery'
  },
  {
    id: '5',
    slug: 'kuantitatif-specialist',
    title: 'Pengetahuan Kuantitatif Specialist',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd482180c?auto=format&fit=crop&q=80&w=800',
    price: 45000,
    originalPrice: 85000,
    rating: 4.9,
    studentCount: 680,
    duration: '14 Hari',
    category: 'Subject Mastery',
    isPopular: true
  },
  {
    id: '6',
    slug: 'ultimate-rush-pass',
    title: 'Ultimate 1-Day Rush Pass',
    image: 'https://images.unsplash.com/photo-1454165833767-027ffea7e78b?auto=format&fit=crop&q=80&w=800',
    price: 15000,
    originalPrice: 30000,
    rating: 4.5,
    studentCount: 2100,
    duration: '1 Hari',
    category: 'Mock Exams'
  }
];

const PackagesPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

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
              />
              <Select
                defaultValue="popular"
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
                {mockPackages.length > 0 ? (
                  <>
                    <Row gutter={[24, 24]}>
                      {mockPackages.map((pkg) => (
                        <Col xs={24} sm={12} xl={8} key={pkg.id}>
                          <PackageCard {...pkg} />
                        </Col>
                      ))}
                    </Row>
                    
                    <div className="mt-16 flex justify-center">
                      <Pagination 
                        current={currentPage} 
                        total={18} 
                        pageSize={pageSize}
                        onChange={(page) => setCurrentPage(page)}
                        className="weightless-pagination"
                      />
                    </div>
                  </>
                ) : (
                  <Card className="border-none glass rounded-3xl py-20">
                    <Empty description="Tidak ada paket yang ditemukan" />
                  </Card>
                )}
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
