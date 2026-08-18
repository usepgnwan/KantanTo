import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Typography, Breadcrumb, Button, Card, Divider, Row, Col, Spin, Tag, Empty } from 'antd';
import {
  ArrowLeftOutlined,
  BookOutlined,
  LeftOutlined,
  RightOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  LockOutlined,
} from '@ant-design/icons';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';
import { getPackageMaterials, getPackages, PackageListItem, PackageMaterialPayload } from '../services/packageService';
import { getMyPackagesAPI, markMaterialAsReadAPI } from '../services/myPackageService';
import { renderContent } from '../utils/renderContent';

const { Title, Text } = Typography;

declare global { interface Window { katex?: any; renderMathInElement?: any; } }

const PackageMaterialDetailPage: React.FC = () => {
  const { slug, materialSlug } = useParams<{ slug: string; materialSlug: string }>();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState<PackageListItem | null>(null);
  const [materials, setMaterials] = useState<PackageMaterialPayload[]>([]);
  const [loading, setLoading] = useState(true);

  const { isAdmin, user } = useAuth();
  const [ownsPackage, setOwnsPackage] = useState(false);
  const hasAccess = isAdmin() || ownsPackage; 

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

  // Check if user owns package
  useEffect(() => {
    if (!slug || !user?.id) return;
    getMyPackagesAPI(user.id).then((myPackages) => {
      const owned = myPackages.some(tx => tx.package?.slug === slug && tx.status === 'active');
      setOwnsPackage(owned);
    }).catch(console.error);
  }, [slug, user]);

  const materialIndex = materials.findIndex((m) => String(m.id) === String(materialSlug) || String(m.client_id) === String(materialSlug));
  const material = materialIndex >= 0 ? materials[materialIndex] : null;

  useEffect(() => {
    if (material && ownsPackage && packageData && user?.id) {
      markMaterialAsReadAPI(user.id, packageData.id, Number(material.id));
    }
  }, [material?.id, ownsPackage, packageData?.id, user?.id]);

  // Trigger KaTeX re-render on content change
  useEffect(() => {
    if (!loading && window.renderMathInElement) {
      const el = document.getElementById('materi-content');
      if (el) {
        window.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
          ],
          throwOnError: false,
        });
      }
    }
  }, [loading, materialSlug]);

  const isLocked = Boolean(material) && !hasAccess && materialIndex > 0;
  const isPublicPreview = Boolean(material) && !hasAccess && materialIndex === 0;

  const handleNext = () => {
    if (materialIndex < materials.length - 1) {
      const nextMaterial = materials[materialIndex + 1];
      navigate(`/paket/${slug}/materi/${nextMaterial.client_id || nextMaterial.id}`);
    }
  };

  const handlePrev = () => {
    if (materialIndex > 0) {
      const prevMaterial = materials[materialIndex - 1];
      navigate(`/paket/${slug}/materi/${prevMaterial.client_id || prevMaterial.id}`);
    }
  };

  return (
    <AppLayout>
      <Spin spinning={loading}>
        <div className="min-h-screen bg-surface-low/30 dark:bg-zinc-950 transition-colors duration-500">
          <div className="py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              {/* Back bar */}
              <div className="flex items-center gap-4 mb-8">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate(slug ? `/paket/${slug}` : '/paket')}
                  className="text-on-surface/60 hover:text-primary h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 hover:bg-primary/10 shadow-sm"
                />
                <div>
                  <Breadcrumb className="text-[10px] uppercase tracking-widest font-bold text-on-surface/40 mb-1">
                    <Breadcrumb.Item className="cursor-pointer hover:text-primary" onClick={() => navigate('/paket')}>Katalog Paket</Breadcrumb.Item>
                    <Breadcrumb.Item className="cursor-pointer hover:text-primary" onClick={() => navigate(slug ? `/paket/${slug}` : '/paket')}>Detail Paket</Breadcrumb.Item>
                  </Breadcrumb>
                  <Title level={4} className="!m-0 !font-black !font-manrope">
                    {packageData?.title || 'Ruang Belajar'}
                  </Title>
                </div>
                {isPublicPreview && (
                  <Tag color="green" className="ml-auto rounded-full border-none font-bold">
                    Preview Publik
                  </Tag>
                )}
              </div>

              <Row gutter={[32, 32]}>
                {/* ── Sidebar ── */}
                <Col xs={24} lg={7} xl={6}>
                  <Card className="weightless-card border-none rounded-[2rem] p-2 sticky top-8 shadow-xl shadow-primary/5 bg-white dark:bg-zinc-900">
                    <div className="px-4 py-3 mb-2 border-b border-on-surface/5 dark:border-white/5">
                      <Text className="text-xs uppercase tracking-widest font-black text-on-surface/40">Daftar Materi</Text>
                    </div>
                    <div className="space-y-1 p-1">
                      {materials.map((item, idx) => {
                        const isActive = String(item.id) === String(materialSlug) || String(item.client_id) === String(materialSlug);
                        const isItemLocked = !hasAccess && idx > 0;
                        return (
                          <div
                            key={item.id}
                            onClick={() => !isItemLocked && navigate(`/paket/${slug}/materi/${item.client_id || item.id}`)}
                            className={`
                              flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                              ${isItemLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                              ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-surface-low dark:hover:bg-zinc-800 text-on-surface/70 dark:text-zinc-400'}
                            `}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-primary/20' : 'bg-surface-low dark:bg-zinc-700'}`}>
                              {isItemLocked ? (
                                <LockOutlined className={isActive ? 'text-primary' : 'text-on-surface/40'} />
                              ) : (
                                <FileTextOutlined className={isActive ? 'text-primary' : 'text-on-surface/40'} />
                              )}
                            </div>
                            <span className={`text-sm line-clamp-2 leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                              {item.title}
                            </span>
                          </div>
                        );
                      })}
                      {materials.length === 0 && !loading && (
                        <div className="text-center py-4 text-on-surface/50 text-sm">Belum ada materi</div>
                      )}
                    </div>
                  </Card>
                </Col>

                {/* ── Main Content ── */}
                <Col xs={24} lg={17} xl={18}>
                  <Card className="weightless-card border-none rounded-[2.5rem] shadow-2xl shadow-primary/5 bg-white dark:bg-zinc-900">
                    <div className="p-6 sm:p-10">
                      {!material && !loading ? (
                        <Empty description="Materi tidak ditemukan" className="my-12" />
                      ) : isLocked ? (
                        <div className="py-20 text-center">
                          <LockOutlined className="text-5xl text-primary mb-4" />
                          <Title level={3} className="!mb-2">
                            Materi Terkunci
                          </Title>
                          <Text className="text-surface-on/60 text-lg">
                            Materi ini hanya bisa diakses setelah membeli paket.
                          </Text>
                        </div>
                      ) : material ? (
                        <>
                          {/* Header */}
                          <div className="flex items-center gap-3 text-primary mb-6">
                            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-xl">
                              <BookOutlined className="text-xl" />
                            </div>
                            <span className="text-xs uppercase tracking-widest font-bold">{material.category || 'Materi'}</span>
                          </div>

                          <Title level={1} className="!font-black !font-manrope !text-3xl md:!text-4xl !mb-2 leading-tight">
                            {material.title}
                          </Title>

                          <Divider className="border-on-surface/10 dark:border-white/5 mb-8" />

                          {/* Rendered Body */}
                          <div
                            id="materi-content"
                            className="prose prose-lg dark:prose-invert max-w-none font-sans text-on-surface/80 dark:text-zinc-300"
                            dangerouslySetInnerHTML={{ __html: renderContent(material.content) }}
                          />

                          {/* PDF attachments */}
                          {material.attachments && material.attachments.length > 0 && (
                            <>
                              <Divider className="border-on-surface/10 dark:border-white/5 mt-10 mb-6" />
                              <Text className="block text-xs uppercase font-black tracking-widest text-on-surface/40 dark:text-zinc-500 mb-3">
                                Berkas Lampiran
                              </Text>
                              <div className="space-y-2">
                                {material.attachments.map((pdf) => (
                                  <div key={pdf} className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 cursor-pointer hover:shadow-md transition-all group">
                                    <FilePdfOutlined className="text-red-500 text-2xl shrink-0" />
                                    <div>
                                      <Text className="font-bold text-sm block">{pdf}</Text>
                                      <Text className="text-xs text-on-surface/40">Klik untuk mengunduh</Text>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          <Divider className="border-on-surface/10 dark:border-white/5 mt-12 mb-8" />

                          {/* Navigation */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <Button
                              size="large"
                              type="text"
                              icon={<LeftOutlined />}
                              disabled={materialIndex <= 0}
                              onClick={handlePrev}
                              className="w-full sm:w-auto h-14 rounded-2xl font-bold bg-surface-low dark:bg-zinc-800 hover:bg-primary/5"
                            >
                              Materi Sebelumnya
                            </Button>
                            <Button
                              size="large"
                              type="primary"
                              disabled={materialIndex >= materials.length - 1}
                              onClick={handleNext}
                              className="w-full sm:w-auto h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                            >
                              Materi Selanjutnya <RightOutlined />
                            </Button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </Card>
                </Col>
              </Row>

            </div>
          </div>
        </div>
      </Spin>
    </AppLayout>
  );
};

export default PackageMaterialDetailPage;
