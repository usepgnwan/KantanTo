import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Row, Col, Card, Button, Typography, Space, Empty, Spin, Tag } from 'antd';
import {
  ExperimentOutlined, 
  FileSearchOutlined, 
  VideoCameraOutlined,
  ShoppingOutlined,
  PlayCircleOutlined,
  LockOutlined,
  EyeOutlined,
  BookOutlined
} from '@ant-design/icons';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import PackageDetailHeader from '../components/organisms/PackageDetailHeader';
import QuestionGrid from '../components/molecules/QuestionGrid';
import ResourceCard from '../components/molecules/ResourceCard';
import {
  getPackages,
  getPackageMaterials,
  getPackageQuestions,
  getPackageVideos,
  PackageListItem,
  PackageMaterialPayload,
  PackageQuestionPayload,
  PackageVideoPayload,
} from '../services/packageService';
import { getMyPackagesAPI } from '../services/myPackageService';

const { Title, Text, Paragraph } = Typography;

const fallbackVideoThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800';

const PackageDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState<PackageListItem | null>(null);
  const [questions, setQuestions] = useState<PackageQuestionPayload[]>([]);
  const [materials, setMaterials] = useState<PackageMaterialPayload[]>([]);
  const [videos, setVideos] = useState<PackageVideoPayload[]>([]);
  const [loading, setLoading] = useState(true);

  const { isAdmin, isLoggedIn, user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [ownsPackage, setOwnsPackage] = useState(false);

  const hasAccess = isPreviewMode || ownsPackage;
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
        if (!found) {
          if (mounted) {
            setPackageData(null);
            setQuestions([]);
            setMaterials([]);
            setVideos([]);
          }
          return;
        }

        const [questionData, materialData, videoData] = await Promise.all([
          getPackageQuestions(slug).catch(() => []),
          getPackageMaterials(slug).catch(() => []),
          getPackageVideos(slug).catch(() => []),
        ]);

        if (mounted) {
          setPackageData(found);
          setQuestions(questionData);
          setMaterials(materialData);
          setVideos(videoData);
        }
      })
      .catch(() => {
        if (mounted) {
          setPackageData(null);
          setQuestions([]);
          setMaterials([]);
          setVideos([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug || !user?.id) return;
    
    getMyPackagesAPI(user.id).then((myPackages) => {
      const owned = myPackages.some(tx => tx.package?.slug === slug && tx.status === 'active');
      setOwnsPackage(owned);
    }).catch(console.error);
  }, [slug, user]);

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    if (!packageData) return;
    
    if (!isInCart(packageData.slug)) {
      addToCart({
        id: packageData.slug,
        slug: packageData.slug,
        title: packageData.title,
        variant: `${packageData.category} • ${packageData.duration} Menit`,
        price: packageData.price,
        image: packageData.thumbnail || fallbackVideoThumbnail,
        quantity: 1,
      });
    }
    navigate('/keranjang');
  };

  const alreadyInCart = packageData ? isInCart(packageData.slug) : false;

  const tabItems = [
    {
      key: 'soal',
      label: (
        <span className="flex items-center gap-2 px-2">
          <ExperimentOutlined /> Soal
        </span>
      ),
      children: (
        questions.length > 0 ? (
          <QuestionGrid
            count={questions.length}
            duration={packageData?.duration || 45}
            answersLocked={!hasAccess}
          />
        ) : (
          <Empty description="Belum ada soal untuk paket ini" className="py-12" />
        )
      ),
    },
    {
      key: 'pembahasan',
      label: (
        <span className="flex items-center gap-2 px-2">
          <FileSearchOutlined /> Pembahasan
        </span>
      ),
      children: (
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
                      if (!isLocked && slug) navigate(`/paket/${slug}/materi/${item.id}`);
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
      ),
    },
    {
      key: 'video',
      label: (
        <span className="flex items-center gap-2 px-2">
          <VideoCameraOutlined /> Video Terkait
        </span>
      ),
      children: (
        <div className="py-6">
          {videos.length > 0 ? (
            <Row gutter={[24, 24]}>
              {videos.map((video) => (
                <Col xs={24} sm={12} key={video.id}>
                  <ResourceCard
                    title={video.title}
                    duration={video.duration}
                    thumbnail={fallbackVideoThumbnail}
                    type="video"
                    isLocked={!hasAccess}
                    onClick={() => navigate(`/video/${video.id}`)}
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="Belum ada video untuk paket ini" />
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <Spin spinning={loading}>
        <PackageDetailHeader {...headerData} />

        {!loading && !packageData ? (
          <section className="pb-24 bg-white dark:bg-zinc-900 transition-colors duration-500">
            <div className="max-w-3xl mx-auto px-4">
              <Card className="border-none shadow-xl rounded-[2rem] py-16 text-center">
                <Empty description="Paket tidak ditemukan atau belum dipublish" />
              </Card>
            </div>
          </section>
        ) : (
          <section className="pb-24 bg-white dark:bg-zinc-900 transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Row gutter={[48, 48]}>
                <Col xs={24} lg={16}>
                  <div className="bg-surface-low/30 dark:bg-zinc-800/20 p-8 rounded-[2.5rem] border border-surface-container -mt-12 relative z-10 backdrop-blur-xl">
                    <Tabs
                      defaultActiveKey="soal"
                      items={tabItems}
                      className="weightless-tabs"
                      size="large"
                    />
                  </div>
                </Col>

                <Col xs={24} lg={8}>
                  <Card className="border-none shadow-2xl rounded-[2rem] p-6 lg:-mt-24 relative z-20 bg-white dark:bg-zinc-950">
                    {hasAccess ? (
                      <Space direction="vertical" size="large" className="w-full">
                        <div>
                          <Text className="text-xs text-green-500 font-bold uppercase tracking-widest mb-2 block">Paket Aktif</Text>
                          <Title level={3} className="!m-0">Siap Untuk Simulasi?</Title>
                          <Paragraph className="text-surface-on/60 mt-4">
                            Uji kemampuanmu sekarang dengan simulasi ujian sesuai standar CBT terbaru.
                          </Paragraph>
                        </div>

                        <Button
                          type="primary"
                          block
                          size="large"
                          className="h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                          icon={<PlayCircleOutlined />}
                          onClick={() => navigate(`/exam/${slug}`)}
                        >
                          Mulai Simulasi Ujian
                        </Button>

                        {materials.length > 0 && (
                          <Button
                            type="default"
                            block
                            size="large"
                            className="h-14 rounded-2xl font-bold flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary/5"
                            icon={<BookOutlined />}
                            onClick={() => navigate(`/paket/${slug}/materi/${materials[0].client_id || materials[0].id}`)}
                          >
                            Mulai Belajar Modul
                          </Button>
                        )}

                        <div className="text-center pt-4 border-t border-surface-container">
                          <Text className="text-[10px] text-surface-on/40 uppercase font-bold tracking-tight">
                            Pastikan koneksi internet stabil
                          </Text>
                        </div>
                      </Space>
                    ) : (
                      <Space direction="vertical" size="large" className="w-full">
                        <div>
                          <Text className="text-xs text-primary font-bold uppercase tracking-widest mb-2 block">Premium Access</Text>
                          <Title level={3} className="!m-0">Mulai Belajar Hari Ini</Title>
                          <Paragraph className="text-surface-on/60 mt-4">
                            Akses penuh membuka simulasi, semua video, semua materi pembahasan, dan kunci jawaban.
                          </Paragraph>
                        </div>

                        {ownsPackage ? (
                          <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-200 text-center font-bold">
                            Anda sudah memiliki paket ini.
                          </div>
                        ) : (
                          <>
                            <div className="bg-surface-low p-6 rounded-2xl border border-surface-container">
                              {packageData && packageData.price > 0 && (
                                <Text className="text-xs text-surface-on/40 line-through">
                                  Rp {Number(packageData.price * 2).toLocaleString('id-ID')}
                                </Text>
                              )}
                              <div className="flex items-baseline gap-2">
                                <Title level={2} className="!m-0 !text-primary">
                                  {packageData?.price === 0 ? 'Gratis' : `Rp ${Number(packageData?.price || 0).toLocaleString('id-ID')}`}
                                </Title>
                                <Text className="text-xs text-surface-on/40">/ Lifetime</Text>
                              </div>
                            </div>

                            <Button
                              type={alreadyInCart ? "default" : "primary"}
                              block
                              size="large"
                              className={`h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl ${alreadyInCart ? 'border-primary text-primary' : 'shadow-primary/20'}`}
                              icon={<ShoppingOutlined />}
                              onClick={handleAddToCart}
                            >
                              {alreadyInCart ? 'Lihat Keranjang' : 'Beli Paket Sekarang'}
                            </Button>
                          </>
                        )}

                        {isAdmin() && !isPreviewMode && (
                          <Button
                            type="default"
                            block
                            size="large"
                            className="h-14 rounded-2xl font-bold flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary/5"
                            icon={<EyeOutlined />}
                            onClick={() => setIsPreviewMode(true)}
                          >
                            Preview Paket (Admin)
                          </Button>
                        )}

                        <Card className="border-none bg-primary/5 rounded-2xl">
                          <Space align="start">
                            <LockOutlined className="text-primary mt-1" />
                            <Text className="text-xs text-surface-on/60">
                              Preview publik hanya membuka materi pembahasan pertama. Video, kunci jawaban, dan konten lainnya terkunci.
                            </Text>
                          </Space>
                        </Card>
                      </Space>
                    )}
                  </Card>
                </Col>
              </Row>
            </div>
          </section>
        )}
      </Spin>
    </AppLayout>
  );
};

export default PackageDetailPage;
