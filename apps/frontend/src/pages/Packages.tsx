import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import AppLayout from '../layouts/AppLayout';
import PackageCard, { PackageProps } from '../components/molecules/PackageCard';
import PackageFilters, { FilterState } from '../components/organisms/PackageFilters';
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
  Card,
  Spin,
  Tag,
} from 'antd';
import { SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import { getPackages, PackageListItem } from '../services/packageService';
import { getMyPackagesAPI } from '../services/myPackageService';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const fallbackImage = 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800';

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

const initialFilters: FilterState = {
  category: 'all',
  selectedDurations: [],
  promoOnly: false,
};

const PackagesPage: React.FC = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageProps[]>([]);
  const [ownedSlugs, setOwnedSlugs] = useState<Set<string>>(new Set());
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const pageSize = 6;

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

  // Category list with real counts
  const categoriesList = useMemo(() => {
    const bundleCount = packages.filter(p => p.is_bundle).length;
    const catMap = new Map<string, number>();

    packages.forEach(p => {
      if (!p.is_bundle && p.category) {
        catMap.set(p.category, (catMap.get(p.category) || 0) + 1);
      }
    });

    const list = [
      { label: 'Semua Paket', value: 'all', count: packages.length },
      { label: '🎁 Paket Bundle', value: 'bundle', count: bundleCount },
    ];

    catMap.forEach((count, cat) => {
      list.push({ label: cat, value: cat, count });
    });

    return list;
  }, [packages]);

  const filteredPackages = useMemo(() => {
    let result = [...packages];

    // Search Query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((pkg) =>
        [
          pkg.title,
          pkg.category,
          pkg.is_bundle ? 'bundle hemat' : '',
          ...(pkg.classes || []),
          ...(pkg.subjects || []),
          ...(pkg.bundled_packages?.map(bp => bp.title) || []),
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    // Category / Bundle filter
    if (filters.category !== 'all') {
      if (filters.category === 'bundle') {
        result = result.filter(p => p.is_bundle);
      } else {
        result = result.filter(p => !p.is_bundle && p.category?.toLowerCase() === filters.category.toLowerCase());
      }
    }

    // Price filter
    if (filters.minPrice !== undefined) {
      result = result.filter(p => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter(p => p.price <= filters.maxPrice!);
    }

    // Promo Only filter
    if (filters.promoOnly) {
      result = result.filter(p => p.originalPrice > p.price);
    }

    // Duration filter
    if (filters.selectedDurations.length > 0) {
      result = result.filter(p => {
        if (p.is_bundle) return filters.selectedDurations.includes('Bundle');
        if (p.is_lifetime && filters.selectedDurations.includes('Lifetime')) return true;
        if (p.validity_days) {
          const match = filters.selectedDurations.some(d => d.includes(`${p.validity_days}`));
          if (match) return true;
        }
        return false;
      });
    }

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'newest') return b.slug.localeCompare(a.slug);
      return Number(b.isPopular) - Number(a.isPopular);
    });
  }, [packages, searchQuery, sortBy, filters]);

  const visiblePackages = filteredPackages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, filters]);

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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-primary font-bold mb-2">
                <AppstoreOutlined />
                <span className="uppercase tracking-widest text-xs">Explore Catalog</span>
              </div>
              <Title level={1} className="!text-3xl md:!text-5xl !font-black !mb-4 tracking-tight">Pilih Paket Belajarmu!</Title>
              <Paragraph className="text-on-surface/60 text-lg max-w-2xl mx-auto m-0">
                Temukan paket satuan & kombo bundle terbaik untuk menaklukkan ujian SNBT & PTN impian Anda.
              </Paragraph>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Cari paket / bundle..."
                prefix={<SearchOutlined className="text-surface-on/30" />}
                className="h-12 w-full sm:w-64 rounded-xl border-none shadow-sm"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                allowClear
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

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
            {categoriesList.map(cat => {
              const isSelected = filters.category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, category: cat.value }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? (cat.value === 'bundle' ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20' : 'bg-primary text-white border-primary shadow-md shadow-primary/20')
                      : 'bg-white dark:bg-zinc-900 text-on-surface/70 border-surface-container hover:border-primary/40'
                  }`}
                >
                  <span>{cat.label}</span>
                  {typeof cat.count === 'number' && (
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-surface-low text-on-surface/50'}`}>
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Row gutter={[32, 32]}>
            {/* Sidebar Filter */}
            <Col xs={24} lg={7} xl={6} className="order-2 lg:order-1">
              <PackageFilters
                filters={filters}
                onFilterChange={setFilters}
                onReset={() => {
                  setFilters(initialFilters);
                  setSearchQuery('');
                }}
                categoriesList={categoriesList}
              />
              <div className="mt-6">
                <LatestActivity />
              </div>
            </Col>

            {/* Main Content */}
            <Col xs={24} lg={17} xl={18} className="order-1 lg:order-2">
              <div className="min-h-[600px]">
                <Spin spinning={loadingPackages}>
                  {visiblePackages.length > 0 ? (
                    <>
                      <Row gutter={[24, 24]}>
                        {visiblePackages.map((pkg) => (
                          <Col xs={24} sm={12} xl={8} key={pkg.id}>
                            <PackageCard {...pkg} isOwned={ownedSlugs.has(pkg.slug)} />
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
                    <Card className="border-none glass rounded-3xl py-20 text-center">
                      <Empty
                        description={
                          <div className="space-y-2">
                            <Text className="font-bold text-base block text-on-surface">
                              {loadingPackages ? 'Memuat paket...' : 'Tidak ada paket yang sesuai dengan filter'}
                            </Text>
                            <Text className="text-xs text-on-surface/50 block">
                              Coba ganti kata kunci pencarian atau reset filter untuk melihat seluruh katalog.
                            </Text>
                          </div>
                        }
                      />
                    </Card>
                  )}
                </Spin>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      <CustomerReviews />
    </AppLayout>
  );
};

export default PackagesPage;
