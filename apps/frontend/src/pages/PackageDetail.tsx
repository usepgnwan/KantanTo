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
  BookOutlined,
  WarningOutlined
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
import { getMyPackagesAPI, MyTransaction } from '../services/myPackageService';
import dayjs from 'dayjs';

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
  const [ownedTx, setOwnedTx] = useState<MyTransaction | null>(null);

  const { isExpired, isLimitReached, isPackageValid } = useMemo(() => {
    let expired = false;
    let limitReached = false;

    if (ownedTx) {
      if (!ownedTx.is_lifetime && ownedTx.active_until) {
        if (dayjs(ownedTx.active_until).isBefore(dayjs())) {
          expired = true;
        }
      }

      if (ownedTx.max_exam_attempts > 0 && ownedTx.used_exam_attempts >= ownedTx.max_exam_attempts) {
        limitReached = true;
      }
    }

    return {
      isExpired: expired,
      isLimitReached: limitReached,
      isPackageValid: ownsPackage && !expired && !limitReached
    };
  }, [ownedTx, ownsPackage]);

  const hasAccess = isPreviewMode || isPackageValid;

  const totalQuestionsCount = useMemo(() => {
    let total = 0;
    for (const q of questions) {
      if (q.type === 'linked' && q.sub_questions && q.sub_questions.length > 0) {
        total += q.sub_questions.length;
      } else {
        total += 1;
      }
    }
    return total;
  }, [questions]);

  const headerData = useMemo(() => ({
    title: packageData?.title || 'Paket tidak ditemukan',
    description: packageData?.description || '',
    joinedCount: 0,
    duration: packageData?.duration ? `${packageData.duration} Menit` : 'Tryout',
    questionCount: totalQuestionsCount,
    category: packageData?.category || 'Tryout',
    classes: packageData?.classes || [],
    subjects: packageData?.subjects || [],
  }), [packageData, totalQuestionsCount]);

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
      const activeTxs = myPackages.filter(tx => tx.package?.slug === slug && tx.status === 'active');
      
      if (activeTxs.length > 0) {
        const combinedTx = JSON.parse(JSON.stringify(activeTxs[0]));
        
        for (let i = 1; i < activeTxs.length; i++) {
          const tx = activeTxs[i];
          
          if (combinedTx.max_exam_attempts === 0 || tx.max_exam_attempts === 0) {
            combinedTx.max_exam_attempts = 0;
          } else {
            combinedTx.max_exam_attempts += tx.max_exam_attempts;
          }
          
          combinedTx.used_exam_attempts = (combinedTx.used_exam_attempts || 0) + (tx.used_exam_attempts || 0);
          
          if (tx.package?.is_lifetime || combinedTx.package?.is_lifetime) {
            combinedTx.is_lifetime = true;
            combinedTx.active_until = null;
          } else {
            let combinedUntil = combinedTx.active_until ? new Date(combinedTx.active_until) : null;
            if (!combinedUntil && combinedTx.package?.validity_days > 0 && combinedTx.created_at) {
               const createdAt = new Date(combinedTx.created_at);
               combinedUntil = new Date(createdAt.getTime() + combinedTx.package.validity_days * 24 * 60 * 60 * 1000);
            }
            
            let txUntil = tx.active_until ? new Date(tx.active_until) : null;
            if (!txUntil && tx.package?.validity_days > 0 && tx.created_at) {
               const createdAt = new Date(tx.created_at);
               txUntil = new Date(createdAt.getTime() + tx.package.validity_days * 24 * 60 * 60 * 1000);
            }
            
            if (txUntil && combinedUntil) {
               if (txUntil > combinedUntil) {
                   combinedTx.active_until = txUntil.toISOString();
                   combinedTx.created_at = tx.created_at;
               }
            } else if (txUntil) {
               combinedTx.active_until = txUntil.toISOString();
               combinedTx.created_at = tx.created_at;
            }
          }
        }
        
        // Final fallback override for old data
        combinedTx.is_lifetime = combinedTx.package?.is_lifetime || false;
        
        setOwnsPackage(true);
        setOwnedTx(combinedTx);
      } else {
        setOwnsPackage(false);
        setOwnedTx(null);
      }
    }).catch(console.error);
  }, [slug, user]);

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!packageData) return;

    if (!isInCart(packageData.slug)) {
      const finalPrice = packageData.discount_type === 'percent'
        ? packageData.price - (packageData.price * (packageData.discount_value || 0)) / 100
        : packageData.discount_type === 'harga'
          ? packageData.price - (packageData.discount_value || 0)
          : packageData.price;

      addToCart({
        id: packageData.slug,
        slug: packageData.slug,
        title: packageData.title,
        variant: `${packageData.category} • ${packageData.duration} Menit`,
        price: finalPrice,
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
          <ExperimentOutlined /> Soal ({totalQuestionsCount})
        </span>
      ),
      children: (
        totalQuestionsCount > 0 ? (
          <QuestionGrid
            count={totalQuestionsCount}
            duration={packageData?.duration || 45}
            answersLocked={!hasAccess}
            rawQuestions={questions}
          />
        ) : (
          <Empty description="Belum ada soal untuk paket ini" className="py-12" />
        )
      ),
    },
    materials.length > 0 ? {
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
    } : null,
    videos.length > 0 ? {
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
    } : null,
  ].filter(Boolean) as any[];

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
                          <div className="flex justify-between items-start mb-2">
                            <Text className="text-xs text-green-500 font-bold uppercase tracking-widest block mt-1">Paket Aktif</Text>
                            {ownedTx && (
                              <Tag color={ownedTx.is_lifetime ? 'green' : 'blue'} className="m-0 rounded-full font-bold">
                                {ownedTx.is_lifetime ? 'Selamanya (Lifetime)' : `Berlaku s/d ${new Date(ownedTx.active_until || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                              </Tag>
                            )}
                          </div>
                          <Title level={3} className="!m-0">Siap Untuk Simulasi?</Title>
                          <Paragraph className="text-surface-on/60 mt-4">
                            Uji kemampuanmu sekarang dengan simulasi ujian sesuai standar CBT terbaru.
                          </Paragraph>

                          {ownedTx && (
                            <div className="bg-surface-low p-4 rounded-xl mt-4 border border-surface-container flex justify-between items-center">
                              <Text className="font-bold text-sm text-on-surface/80">Sisa Kuota Ujian</Text>
                              <Text className="font-black text-primary text-base">
                                {ownedTx.max_exam_attempts === 0 ? 'Tak Terbatas' : `Terpakai: ${ownedTx.used_exam_attempts || 0} | Sisa: ${Math.max(0, ownedTx.max_exam_attempts - (ownedTx.used_exam_attempts || 0))} dari ${ownedTx.max_exam_attempts}`}
                              </Text>
                            </div>
                          )}
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

                        {isPackageValid ? (
                          <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-200 text-center font-bold">
                            Anda sudah memiliki akses aktif ke paket ini.
                          </div>
                        ) : (
                          <>
                            {(isExpired || isLimitReached) && (
                              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center text-sm font-bold animate-pulse">
                                <WarningOutlined className="mr-2" />
                                Paket anda saat ini sudah tidak aktif, segera aktivasi kembali.
                              </div>
                            )}
                            <div className="bg-surface-low p-6 rounded-2xl border border-surface-container">
                              {packageData && packageData.discount_type && (
                                <Text className="text-xs text-surface-on/40 line-through">
                                  Rp {Number(packageData.price).toLocaleString('id-ID')}
                                </Text>
                              )}
                              <div className="flex items-baseline gap-2">
                                <Title level={2} className="!m-0 !text-primary">
                                  {(() => {
                                    if (!packageData) return 'Gratis';
                                    const finalPrice = packageData.discount_type === 'percent'
                                      ? packageData.price - (packageData.price * (packageData.discount_value || 0)) / 100
                                      : packageData.discount_type === 'harga'
                                        ? packageData.price - (packageData.discount_value || 0)
                                        : packageData.price;
                                    return finalPrice === 0 ? 'Gratis' : `Rp ${Number(finalPrice).toLocaleString('id-ID')}`;
                                  })()}
                                </Title>
                                <Text className="text-xs text-surface-on/40">
                                  / {packageData?.is_lifetime ? 'Selamanya (Lifetime)' : `${packageData?.validity_days} Hari`}
                                </Text>
                              </div>
                              <div className="mt-2 text-[10px] uppercase font-bold tracking-widest text-primary/60">
                                {packageData?.max_exam_attempts === 0 ? 'Bebas Ujian Berkali-kali' : `Maksimal ${packageData?.max_exam_attempts}x Ujian`}
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
