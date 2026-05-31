import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Col, Empty, Row, Spin, Tag, Typography } from 'antd';
import { ArrowLeftOutlined, FileSearchOutlined } from '@ant-design/icons';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';
import PackageDetailHeader from '../components/organisms/PackageDetailHeader';
import ResourceCard from '../components/molecules/ResourceCard';
import { getPackageMaterials, getPackages, PackageListItem, PackageMaterialPayload } from '../services/packageService';

const { Title, Text } = Typography;

const PackageMaterialsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState<PackageListItem | null>(null);
  const [materials, setMaterials] = useState<PackageMaterialPayload[]>([]);
  const [loading, setLoading] = useState(true);

  const { isAdmin } = useAuth();
  const hasAccess = isAdmin();

  const headerData = useMemo(() => ({
    title: packageData?.title || 'Paket tidak ditemukan',
    description: packageData?.description || '',
    joinedCount: 0,
    duration: packageData?.duration ? `${packageData.duration} Menit` : 'Tryout',
    category: packageData?.category || 'Tryout',
    classes: packageData?.classes || [],
    subjects: packageData?.subjects || [],
  }), [packageData]);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;

    setLoading(true);
    getPackages()
      .then(async (packages) => {
        const found = packages.find((pkg) => pkg.slug === slug && pkg.status === 'published') || null;
        const materialData = await getPackageMaterials(slug).catch(() => []);

        if (mounted) {
          setPackageData(found);
          setMaterials(materialData);
        }
      })
      .catch(() => {
        if (mounted) {
          setPackageData(null);
          setMaterials([]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  return (
    <AppLayout>
      <Spin spinning={loading}>
        <PackageDetailHeader {...headerData} />

        <section className="pb-24 bg-white dark:bg-zinc-900 transition-colors duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3 -mt-10 relative z-10">
              <Button
                icon={<ArrowLeftOutlined />}
                className="rounded-xl"
                onClick={() => navigate(slug ? `/paket/${slug}` : '/paket')}
              >
                Kembali
              </Button>
              <div className="flex items-center gap-2 text-surface-on/60">
                <FileSearchOutlined />
                <Text className="text-xs">Materi Pembahasan</Text>
              </div>
            </div>

            <Row gutter={[24, 24]} className="mt-6">
              <Col xs={24} lg={16}>
                <Card className="border-none shadow-xl rounded-[2rem] p-6 bg-white dark:bg-zinc-950">
                  <Title level={4} className="!m-0">
                    Daftar Materi
                  </Title>

                  <div className="py-6 space-y-4">
                    {materials.length > 0 ? (
                      materials.map((item, index) => {
                        const isLocked = !hasAccess && index > 0;
                        return (
                          <div key={item.id} className="relative">
                            <ResourceCard
                              title={item.title}
                              type="discussion"
                              isLocked={isLocked}
                              onClick={() => {
                                if (isLocked || !slug) return;
                                navigate(`/paket/${slug}/materi/${item.id}`);
                              }}
                            />
                            {!isLocked && !hasAccess && (
                              <Tag color="green" className="absolute right-4 top-4 rounded-full border-none font-bold">
                                Preview Publik
                              </Tag>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <Empty description="Belum ada materi pembahasan" />
                    )}
                  </div>
                </Card>
              </Col>

              <Col xs={24} lg={8}>
                <Card className="border-none shadow-xl rounded-[2rem] p-6 bg-white dark:bg-zinc-950">
                  <Title level={5} className="!m-0">
                    Preview Publik
                  </Title>
                  <Text className="text-xs text-surface-on/60 block mt-3">
                    Pengunjung dapat membuka materi pembahasan pertama. Materi lainnya terkunci.
                  </Text>
                </Card>
              </Col>
            </Row>
          </div>
        </section>
      </Spin>
    </AppLayout>
  );
};

export default PackageMaterialsPage;

