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
  GiftOutlined,
  AppstoreOutlined,
  WarningOutlined,
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

interface SubPackageContent {
  package: PackageListItem;
  questions: PackageQuestionPayload[];
  materials: PackageMaterialPayload[];
  videos: PackageVideoPayload[];
  effectiveQuestionsCount: number;
}

const PackageDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState<PackageListItem | null>(null);
  const [questions, setQuestions] = useState<PackageQuestionPayload[]>([]);
  const [materials, setMaterials] = useState<PackageMaterialPayload[]>([]);
  const [videos, setVideos] = useState<PackageVideoPayload[]>([]);
  const [bundledContents, setBundledContents] = useState<SubPackageContent[]>([]);
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
    if (packageData?.is_bundle) {
      return bundledContents.reduce((acc, curr) => acc + curr.effectiveQuestionsCount, 0);
    }
    let total = 0;
    for (const q of questions) {
      if (q.type === 'linked' && q.sub_questions && q.sub_questions.length > 0) {
        total += q.sub_questions.length;
      } else {
        total += 1;
      }
    }
    return total;
  }, [packageData?.is_bundle, bundledContents, questions]);

  const headerData = useMemo(() => ({
    title: packageData?.title || 'Paket tidak ditemukan',
    description: packageData?.description || '',
    joinedCount: 0,
    duration: packageData?.is_bundle ? 'Sesuai Sub-Paket' : (packageData?.duration ? `${packageData.duration} Menit` : 'Tryout'),
    questionCount: totalQuestionsCount,
    category: packageData?.category || (packageData?.is_bundle ? 'Bundle Hemat' : 'Tryout'),
    classes: packageData?.classes || [],
    subjects: packageData?.subjects || [],
    is_bundle: packageData?.is_bundle,
    bundledPackageCount: packageData?.bundled_packages?.length || packageData?.bundled_package_ids?.length || 0,
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
            setBundledContents([]);
          }
          return;
        }

        if (found.is_bundle && found.bundled_packages && found.bundled_packages.length > 0) {
          const subContents = await Promise.all(
            found.bundled_packages.map(async (sub) => {
              const [qData, mData, vData] = await Promise.all([
                getPackageQuestions(sub.slug).catch(() => []),
                getPackageMaterials(sub.slug).catch(() => []),
                getPackageVideos(sub.slug).catch(() => []),
              ]);

              let effCount = 0;
              for (const q of qData) {
                if (q.type === 'linked' && q.sub_questions && q.sub_questions.length > 0) {
                  effCount += q.sub_questions.length;
                } else {
                  effCount += 1;
                }
              }

              return {
                package: sub,
                questions: qData,
                materials: mData,
                videos: vData,
                effectiveQuestionsCount: effCount,
              };
            })
          );

          if (mounted) {
            setPackageData(found);
            setBundledContents(subContents);
            setQuestions([]);
            setMaterials([]);
            setVideos([]);
          }
        } else {
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
            setBundledContents([]);
          }
        }
      })
      .catch(() => {
        if (mounted) {
          setPackageData(null);
          setQuestions([]);
          setMaterials([]);
          setVideos([]);
          setBundledContents([]);
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
      let finalPrice = packageData.price;
      if (packageData.discount_type === 'percent') {
        finalPrice = packageData.price - (packageData.price * (packageData.discount_value || 0)) / 100;
      } else if (packageData.discount_type === 'harga') {
        finalPrice = packageData.price - (packageData.discount_value || 0);
      }

      addToCart({
        id: packageData.slug,
        slug: packageData.slug,
        title: packageData.title,
        variant: packageData.is_bundle ? `🎁 Bundle (${packageData.bundled_packages?.length || packageData.bundled_package_ids?.length || 0} Paket)` : `${packageData.category} • ${packageData.duration} Menit`,
        price: finalPrice,
        image: packageData.thumbnail || fallbackVideoThumbnail,
        quantity: 1,
      });
    }
    navigate('/keranjang');
  };

  const alreadyInCart = packageData ? isInCart(packageData.slug) : false;

  // Bundle aggregated materials & videos
  const bundleMaterials = useMemo(() => {
    if (!packageData?.is_bundle) return materials;
    const allMat: { subPackage: PackageListItem; material: PackageMaterialPayload }[] = [];
    bundledContents.forEach((sc) => {
      sc.materials.forEach((m) => {
        allMat.push({ subPackage: sc.package, material: m });
      });
    });
    return allMat;
  }, [packageData?.is_bundle, materials, bundledContents]);

  const bundleVideos = useMemo(() => {
    if (!packageData?.is_bundle) return videos;
    const allVid: { subPackage: PackageListItem; video: PackageVideoPayload }[] = [];
    bundledContents.forEach((sc) => {
      sc.videos.forEach((v) => {
        allVid.push({ subPackage: sc.package, video: v });
      });
    });
    return allVid;
  }, [packageData?.is_bundle, videos, bundledContents]);

  const tabItems = [
    // 1. Tab Paket Termasuk (Hanya untuk Paket Bundle)
    packageData?.is_bundle && packageData?.bundled_packages && packageData.bundled_packages.length > 0 ? {
      key: 'bundle_items',
      label: (
        <span className="flex items-center gap-2 px-2 text-purple-600 font-bold">
          <GiftOutlined /> Paket Termasuk ({packageData.bundled_packages.length})
        </span>
      ),
      children: (
        <div className="py-6 space-y-6">
          <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded-2xl p-5">
            <h4 className="font-bold text-purple-900 dark:text-purple-200 text-base mb-1 flex items-center gap-2">
              <GiftOutlined className="text-purple-600" />
              Paket Kombo Spesial ({packageData.bundled_packages.length} Paket Sekaligus)
            </h4>
            <p className="text-xs text-purple-700 dark:text-purple-300 m-0 leading-relaxed">
              Dengan 1x transaksi paket bundle ini, seluruh {packageData.bundled_packages.length} paket di bawah ini otomatis aktif ke akun Anda dengan akses penuh kepaket masing-masing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packageData.bundled_packages.map((sub, idx) => (
              <Card
                key={sub.id}
                className="weightless-card border border-surface-container hover:border-purple-400 transition-all rounded-2xl overflow-hidden shadow-sm flex flex-col p-4"
              >
                <div className="flex gap-3 items-start">
                  <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-xl shrink-0 overflow-hidden">
                    {sub.thumbnail ? (
                      <img src={sub.thumbnail} alt={sub.title} className="w-full h-full object-cover" />
                    ) : (
                      <span>#{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {sub.category && (
                        <Tag color="purple" className="m-0 border-none font-bold text-[9px] px-2 rounded-md">
                          {sub.category}
                        </Tag>
                      )}
                      {sub.is_lifetime ? (
                        <Tag color="green" className="m-0 border-none font-bold text-[9px] px-2 rounded-md">Lifetime</Tag>
                      ) : (
                        <Tag color="blue" className="m-0 border-none font-bold text-[9px] px-2 rounded-md">{sub.validity_days} Hari</Tag>
                      )}
                    </div>
                    <h4 className="font-bold text-on-surface text-sm truncate mb-1">{sub.title}</h4>
                    <p className="text-xs text-surface-on/50 line-clamp-2 mb-0">{sub.description}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between">
                  <Space size={4} wrap>
                    <Tag className="rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none font-bold text-[10px] px-2">
                      {sub.questions_count || 0} Soal
                    </Tag>
                    <Tag className="rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-none font-bold text-[10px] px-2">
                      {sub.materials_count || 0} Materi
                    </Tag>
                    <Tag className="rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 border-none font-bold text-[10px] px-2">
                      {sub.videos_count || 0} Video
                    </Tag>
                  </Space>
                  <Button
                    size="small"
                    type="link"
                    className="font-bold text-primary p-0"
                    onClick={() => navigate(`/paket/${sub.slug}`)}
                  >
                    Buka Detail &rarr;
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ),
    } : null,

    // 2. Tab Soal (List Soal Dikelompokkan per Paket untuk Bundle)
    {
      key: 'soal',
      label: (
        <span className="flex items-center gap-2 px-2">
          <ExperimentOutlined /> Soal ({totalQuestionsCount})
        </span>
      ),
      children: (
        packageData?.is_bundle ? (
          <div className="py-6 space-y-8">
            <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded-2xl p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-bold text-purple-900 dark:text-purple-200 text-base mb-0 flex items-center gap-2">
                  <GiftOutlined className="text-purple-600" />
                  Daftar Soal Per Sub-Paket Bundle ({bundledContents.length} Paket)
                </h4>
                <Tag color="purple" className="font-bold border-none rounded-lg px-2.5 py-1">
                  Total {totalQuestionsCount} Soal
                </Tag>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-2 mb-0 leading-relaxed">
                Butir soal di bawah ini dikelompokkan berdasarkan sub-paket yang termasuk di dalam bundle kombo ini.
              </p>
            </div>

            {bundledContents.map((subItem, idx) => (
              <div
                key={subItem.package.id}
                className="bg-white dark:bg-zinc-900 border border-purple-100 dark:border-purple-900/40 rounded-3xl p-6 shadow-sm space-y-4"
              >
                {/* Header Paket */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-purple-600/30 shrink-0">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-on-surface text-base m-0">
                          {subItem.package.title}
                        </h3>
                        {subItem.package.category && (
                          <Tag color="purple" className="m-0 border-none font-bold text-[9px] px-2 rounded-md">
                            {subItem.package.category}
                          </Tag>
                        )}
                      </div>
                      <p className="text-xs text-on-surface/50 line-clamp-1 m-0">
                        {subItem.package.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tag color="blue" className="m-0 font-bold border-none rounded-lg px-2.5 py-1 text-xs">
                      {subItem.effectiveQuestionsCount} Soal
                    </Tag>
                    <Button
                      size="small"
                      type="link"
                      className="font-bold text-primary text-xs p-0"
                      onClick={() => navigate(`/paket/${subItem.package.slug}`)}
                    >
                      Buka Paket &rarr;
                    </Button>
                  </div>
                </div>

                {/* Grid Soal Sub-Paket */}
                {subItem.effectiveQuestionsCount > 0 ? (
                  <QuestionGrid
                    count={subItem.effectiveQuestionsCount}
                    duration={subItem.package.duration || 45}
                    answersLocked={!hasAccess}
                    rawQuestions={subItem.questions}
                  />
                ) : (
                  <div className="py-6 text-center text-xs text-on-surface/40">
                    Belum ada butir soal di paket ini.
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          totalQuestionsCount > 0 ? (
            <QuestionGrid
              count={totalQuestionsCount}
              duration={packageData?.duration || 45}
              answersLocked={!hasAccess}
              rawQuestions={questions}
            />
          ) : (
            <Empty description="Belum ada soal di paket ini" className="py-12" />
          )
        )
      ),
    },

    // 3. Tab Pembahasan
    (packageData?.is_bundle ? bundleMaterials.length > 0 : materials.length > 0) ? {
      key: 'pembahasan',
      label: (
        <span className="flex items-center gap-2 px-2">
          <FileSearchOutlined /> Pembahasan ({packageData?.is_bundle ? bundleMaterials.length : materials.length})
        </span>
      ),
      children: (
        <div className="py-6 space-y-4">
          {packageData?.is_bundle ? (
            bundledContents.map((subItem) => (
              subItem.materials.length > 0 && (
                <div key={subItem.package.id} className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 font-bold text-sm text-purple-900 dark:text-purple-200">
                    <Tag color="purple" className="font-bold border-none">Paket {subItem.package.title}</Tag>
                    <span>({subItem.materials.length} Materi)</span>
                  </div>
                  {subItem.materials.map((item, index) => {
                    const isLocked = !hasAccess && index > 0;
                    return (
                      <div key={item.id} className="relative">
                        <ResourceCard
                          title={item.title}
                          type="discussion"
                          isLocked={isLocked}
                          onClick={() => {
                            if (!isLocked) navigate(`/paket/${subItem.package.slug}/materi/${item.id}`);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )
            ))
          ) : (
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
          )}
        </div>
      ),
    } : null,

    // 4. Tab Video
    (packageData?.is_bundle ? bundleVideos.length > 0 : videos.length > 0) ? {
      key: 'video',
      label: (
        <span className="flex items-center gap-2 px-2">
          <VideoCameraOutlined /> Video ({packageData?.is_bundle ? bundleVideos.length : videos.length})
        </span>
      ),
      children: (
        <div className="py-6">
          {packageData?.is_bundle ? (
            bundledContents.map((subItem) => (
              subItem.videos.length > 0 && (
                <div key={subItem.package.id} className="mb-6 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-purple-900 dark:text-purple-200">
                    <Tag color="purple" className="font-bold border-none">Paket {subItem.package.title}</Tag>
                    <span>({subItem.videos.length} Video)</span>
                  </div>
                  <Row gutter={[24, 24]}>
                    {subItem.videos.map((video) => (
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
                </div>
              )
            ))
          ) : (
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
                      defaultActiveKey={packageData?.is_bundle ? 'bundle_items' : 'soal'}
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
                                {ownedTx.is_lifetime ? 'Lifetime' : 'Aktif'}
                              </Tag>
                            )}
                          </div>
                          <Title level={3} className="!m-0 !font-black !font-manrope">Anda Memiliki Akses</Title>
                          <Text className="text-xs text-surface-on/50 block mt-1">
                            {packageData?.is_bundle ? 'Akses ke seluruh sub-paket dalam bundle telah terbuka.' : 'Semua simulasi dan materi pembahasan siap dipelajari.'}
                          </Text>
                        </div>

                        <div className="space-y-3 bg-surface-low p-4 rounded-2xl border border-surface-container text-xs">
                          {packageData?.is_bundle ? (
                            <div className="space-y-2">
                              <div className="font-bold text-purple-900 dark:text-purple-200">
                                🎁 Termasuk {packageData.bundled_packages?.length || 0} Sub-Paket:
                              </div>
                              {packageData.bundled_packages?.map(sp => (
                                <div key={sp.id} className="flex items-center justify-between text-on-surface/70">
                                  <span className="truncate">• {sp.title}</span>
                                  <Button size="small" type="link" className="p-0 text-xs font-bold text-primary" onClick={() => navigate(`/paket/${sp.slug}`)}>
                                    Buka &rarr;
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-center text-surface-on/70">
                                <span>Durasi Ujian</span>
                                <span className="font-bold">{packageData?.duration} Menit</span>
                              </div>
                              <div className="flex justify-between items-center text-surface-on/70">
                                <span>Masa Aktif</span>
                                <span className="font-bold">
                                  {ownedTx?.is_lifetime ? 'Selamanya (Lifetime)' : (
                                    ownedTx?.active_until ? `s/d ${new Date(ownedTx.active_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Aktif'
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-surface-on/70">
                                <span>Sisa Kesempatan</span>
                                <span className="font-bold">
                                  {ownedTx?.max_exam_attempts === 0 ? 'Bebas Ujian (Unlimited)' : `${Math.max(0, (ownedTx?.max_exam_attempts || 0) - (ownedTx?.used_exam_attempts || 0))}x lagi`}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        <Button
                          type="primary"
                          block
                          size="large"
                          className="h-14 rounded-2xl font-bold bg-green-600 hover:bg-green-700 border-none shadow-xl shadow-green-600/20 text-base"
                          icon={<PlayCircleOutlined />}
                          onClick={() => {
                            if (packageData?.is_bundle && packageData.bundled_packages && packageData.bundled_packages.length > 0) {
                              navigate(`/paket/${packageData.bundled_packages[0].slug}`);
                            } else {
                              navigate(`/ujian/${slug}`);
                            }
                          }}
                        >
                          {packageData?.is_bundle ? 'Mulai Ujian Paket Pertama' : 'Mulai Ujian Sekarang'}
                        </Button>
                      </Space>
                    ) : (
                      <Space direction="vertical" size="large" className="w-full">
                        <div>
                          <Text className="text-xs text-primary font-bold uppercase tracking-widest block mb-1">Daftar Sekarang</Text>
                          <Title level={3} className="!m-0 !font-black !font-manrope">Akses Penuh Pembahasan &amp; Tryout</Title>
                          <Text className="text-xs text-surface-on/50 block mt-1">
                            {packageData?.is_bundle ? 'Dapatkan akses ke seluruh paket kombo sekaligus dengan harga hemat.' : 'Dapatkan simulasi CBT standar nasional dan materi lengkap.'}
                          </Text>
                        </div>

                        <div className="space-y-4">
                          {isExpired && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-100 font-semibold">
                              <WarningOutlined /> Masa aktif paket Anda telah habis. Silakan perpanjang paket.
                            </div>
                          )}
                          {isLimitReached && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-100 font-semibold">
                              <WarningOutlined /> Limit kesempatan ujian telah habis.
                            </div>
                          )}
                          <div className="bg-surface-low p-6 rounded-2xl border border-surface-container">
                            {packageData?.is_bundle && packageData.original_price && packageData.original_price > packageData.price ? (
                              <div className="flex items-center gap-2 mb-1">
                                <Text className="text-xs text-surface-on/40 line-through">
                                  Rp {Number(packageData.original_price).toLocaleString('id-ID')}
                                </Text>
                                <Tag color="red" className="m-0 border-none font-bold text-[10px] px-1.5 py-0.5 rounded-md">
                                  Hemat Rp {(packageData.original_price - packageData.price).toLocaleString('id-ID')}
                                </Tag>
                              </div>
                            ) : packageData && packageData.discount_type ? (
                              <Text className="text-xs text-surface-on/40 line-through">
                                Rp {Number(packageData.price).toLocaleString('id-ID')}
                              </Text>
                            ) : null}

                            <div className="flex items-baseline gap-2">
                              <Title level={2} className={`!m-0 ${packageData?.is_bundle ? '!text-purple-600' : '!text-primary'}`}>
                                {(() => {
                                  if (!packageData) return 'Gratis';
                                  if (packageData.is_bundle) {
                                    return `Rp ${Number(packageData.price).toLocaleString('id-ID')}`;
                                  }
                                  const finalPrice = packageData.discount_type === 'percent'
                                    ? packageData.price - (packageData.price * (packageData.discount_value || 0)) / 100
                                    : packageData.discount_type === 'harga'
                                      ? packageData.price - (packageData.discount_value || 0)
                                      : packageData.price;
                                  return finalPrice === 0 ? 'Gratis' : `Rp ${Number(finalPrice).toLocaleString('id-ID')}`;
                                })()}
                              </Title>
                              <Text className="text-xs text-surface-on/40">
                                {packageData?.is_bundle ? '/ paket bundle' : `/ ${packageData?.is_lifetime ? 'Selamanya (Lifetime)' : `${packageData?.validity_days} Hari`}`}
                              </Text>
                            </div>
                            <div className="mt-2 text-[10px] uppercase font-bold tracking-widest text-primary/60">
                              {packageData?.is_bundle ? `Termasuk ${packageData.bundled_packages?.length || 0} Paket Lengkap` : (packageData?.max_exam_attempts === 0 ? 'Bebas Ujian Berkali-kali' : `Maksimal ${packageData?.max_exam_attempts}x Ujian`)}
                            </div>
                          </div>

                          <Button
                            type={alreadyInCart ? "default" : "primary"}
                            block
                            size="large"
                            className={`h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl ${packageData?.is_bundle && !alreadyInCart ? '!bg-purple-600 hover:!bg-purple-700 !border-none !text-white shadow-purple-600/30' : (alreadyInCart ? 'border-primary text-primary' : 'shadow-primary/20')}`}
                            icon={<ShoppingOutlined />}
                            onClick={handleAddToCart}
                          >
                            {alreadyInCart ? 'Lihat Keranjang' : (packageData?.is_bundle ? 'Beli Paket Bundle Sekarang' : 'Beli Paket Sekarang')}
                          </Button>
                        </div>
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
