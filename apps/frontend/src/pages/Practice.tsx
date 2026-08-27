import React from 'react';
import AppLayout from '../layouts/AppLayout';
import { Row, Col, Card, Typography, Button, Tag, Space, List, Avatar, Input, Progress, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  BookOutlined, 
  PlayCircleOutlined, 
  FileTextOutlined, 
  SearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RightOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getMyPackagesAPI, getUserMapelsAPI, MyTransaction } from '../services/myPackageService';
import type { PackageListItem } from '../services/packageService';
import dayjs from 'dayjs';
import UpcomingSchedules from '../components/organisms/UpcomingSchedules';
import { Mapel } from '../services/mapelService';

const { Title, Text, Paragraph } = Typography;

const Practice: React.FC = () => {
  const navigate = useNavigate();
  const [myTransactions, setMyTransactions] = React.useState<MyTransaction[]>([]);
  const [userMapels, setUserMapels] = React.useState<Mapel[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();
  const [expandedPackage, setExpandedPackage] = React.useState<number | null>(null);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedMapelId, setSelectedMapelId] = React.useState<string | number>('all');

  // Load distinct mapels owned by user
  React.useEffect(() => {
    if (user?.id) {
      getUserMapelsAPI(user.id).then(data => {
        setUserMapels(data || []);
      }).catch(() => setUserMapels([]));
    }
  }, [user]);

  // Load packages based on search & mapel_id filter
  React.useEffect(() => {
    if (user?.id) {
      setLoading(true);
      getMyPackagesAPI(user.id, 'active', searchTerm, selectedMapelId).then(data => {
        setMyTransactions(data || []);
      }).catch(() => {
        setMyTransactions([]);
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user, searchTerm, selectedMapelId]);

  const toggleExpand = (pkgId: number) => {
    if (expandedPackage === pkgId) {
      setExpandedPackage(null);
    } else {
      setExpandedPackage(pkgId);
    }
  };

  const calculateProgress = (tx: MyTransaction) => {
    return Math.floor(tx.progress || 0);
  };

  const ownedMaterials = React.useMemo(() => {
    const list: {
      id: number;
      title: string;
      category: string;
      packageTitle: string;
      packageSlug: string;
      clientId: string;
    }[] = [];

    myTransactions.forEach((tx) => {
      if (tx.package && tx.package.materials) {
        tx.package.materials.forEach((mat) => {
          list.push({
            id: mat.id,
            title: mat.title,
            category: mat.category || 'Materi',
            packageTitle: tx.package.title,
            packageSlug: tx.package.slug,
            clientId: mat.client_id,
          });
        });
      }
    });

    return list;
  }, [myTransactions]);

  const groupedTransactions = React.useMemo(() => {
    const map = new Map<number, MyTransaction>();
    
    myTransactions.forEach(tx => {
      if (!tx.package) return;
      const pkgId = tx.package.id;
      
      if (!map.has(pkgId)) {
        map.set(pkgId, JSON.parse(JSON.stringify(tx)));
      } else {
        const existing = map.get(pkgId)!;
        
        // Combine limits
        if (existing.max_exam_attempts === 0 || tx.max_exam_attempts === 0) {
          existing.max_exam_attempts = 0; // unlimited
        } else {
          existing.max_exam_attempts += tx.max_exam_attempts;
        }
        
        existing.used_exam_attempts = (existing.used_exam_attempts || 0) + (tx.used_exam_attempts || 0);
        
        // Override is_lifetime with package truth, as old transactions might have wrong default true in DB
        tx.is_lifetime = tx.package.is_lifetime;
        existing.is_lifetime = existing.package.is_lifetime;

        // Combine expiry (active_until)
        if (tx.is_lifetime || existing.is_lifetime) {
          existing.is_lifetime = true;
          existing.active_until = ''; // unlimited
        } else {
          let existingActiveUntil = existing.active_until ? new Date(existing.active_until) : null;
          if (!existingActiveUntil && existing.package.validity_days > 0 && existing.created_at) {
              const createdAt = new Date(existing.created_at);
              existingActiveUntil = new Date(createdAt.getTime() + existing.package.validity_days * 24 * 60 * 60 * 1000);
          }
          
          let txActiveUntil = tx.active_until ? new Date(tx.active_until) : null;
          if (!txActiveUntil && tx.package.validity_days > 0 && tx.created_at) {
              const createdAt = new Date(tx.created_at);
              txActiveUntil = new Date(createdAt.getTime() + tx.package.validity_days * 24 * 60 * 60 * 1000);
          }
          
          if (txActiveUntil && existingActiveUntil) {
             if (txActiveUntil > existingActiveUntil) {
                 existing.active_until = txActiveUntil.toISOString();
                 existing.created_at = tx.created_at; // keep created_at in sync
             }
          } else if (txActiveUntil) {
             existing.active_until = txActiveUntil.toISOString();
             existing.created_at = tx.created_at;
          }
        }
        
        // Progress: take max
        if ((tx.progress || 0) > (existing.progress || 0)) {
          existing.progress = tx.progress;
        }
      }
    });
    
    return Array.from(map.values());
  }, [myTransactions]);

  return (
    <AppLayout>
      <div className="bg-surface-low/30 min-h-screen py-12 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="mb-12">
            <Text className="text-sm font-heavy uppercase tracking-[0.2em] text-on-surface/40 leading-none mb-2 block">
              Pusat Pelatihan
            </Text>
            <Title level={1} className="!m-0 !font-black !text-5xl !font-manrope">Latihan Soal</Title>
            <Paragraph className="text-on-surface/60 text-lg mt-4 max-w-2xl">
              Asah kemampuanmu dengan ribuan bank soal SNBT berkualitas yang disusun oleh para ahli editorial pendidikan.
            </Paragraph>
          </div>

          <Row gutter={[32, 48]}>
            {/* Main Content */}
            <Col xs={24} lg={16}>
              
              {/* Search & Filter */}
              <div className="mb-10 flex flex-wrap sm:flex-nowrap gap-4 items-center">
                <Input 
                  placeholder="Cari materi atau topik..." 
                  prefix={<SearchOutlined className="text-on-surface/30" />} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  className="flex-1 h-12 rounded-2xl border-none shadow-sm bg-white font-medium"
                />
                <Select
                  showSearch
                  placeholder="Pilih Mata Pelajaran..."
                  value={selectedMapelId}
                  onChange={(val) => setSelectedMapelId(val)}
                  className="w-full sm:w-64 h-12 shadow-sm rounded-2xl [&_.ant-select-selector]:!rounded-2xl [&_.ant-select-selector]:!border-none [&_.ant-select-selector]:!h-12 [&_.ant-select-selection-item]:!leading-[44px] [&_.ant-select-selection-placeholder]:!leading-[44px] font-bold"
                  options={[
                    { value: 'all', label: '📚 Semua Mata Pelajaran' },
                    ...userMapels.map((m) => ({
                      value: m.id,
                      label: `📖 ${m.title}`,
                    })),
                  ]}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                />
              </div>

              {/* Owned Packages Section */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <Title level={3} className="!m-0 !font-black !font-manrope">Paket Saya</Title>
                </div>
                {loading ? (
                  <div className="text-center py-10"><Text className="text-on-surface/40">Memuat paket...</Text></div>
                ) : groupedTransactions.length === 0 ? (
                  <Card className="weightless-card border-none p-10 text-center">
                    <Title level={4} className="!m-0 !font-black text-on-surface/40">
                      {searchTerm || selectedMapelId !== 'all' ? 'Paket Tidak Ditemukan' : 'Belum Ada Paket'}
                    </Title>
                    <Paragraph className="text-on-surface/40 mt-2 mb-6">
                      {searchTerm || selectedMapelId !== 'all'
                        ? 'Tidak ada paket yang sesuai dengan pencarian / filter Anda.'
                        : 'Kamu belum memiliki paket yang aktif. Yuk cari paket belajarmu sekarang!'}
                    </Paragraph>
                    {searchTerm || selectedMapelId !== 'all' ? (
                      <Button type="default" onClick={() => { setSearchTerm(''); setSelectedMapelId('all'); }} className="rounded-xl h-10 font-bold">Reset Filter</Button>
                    ) : (
                      <Button type="primary" onClick={() => navigate('/paket')} className="rounded-xl h-10 font-bold">Cari Paket</Button>
                    )}
                  </Card>
                ) : (
                  <Row gutter={[24, 24]}>
                    {groupedTransactions.map((tx) => {
                      const pkg = tx.package;
                      if (!pkg) return null;
                      const progress = calculateProgress(tx);
                      const isExpanded = expandedPackage === pkg.id;
                      
                      const isLifetime = tx.is_lifetime;
                      const maxAttempts = tx.max_exam_attempts || 0;
                      const usedAttempts = tx.used_exam_attempts || 0;
                      
                      let activeUntilDate: Date | null = null;
                      if (!isLifetime) {
                        if (tx.active_until) {
                          activeUntilDate = new Date(tx.active_until);
                        } else if (pkg.validity_days > 0 && tx.created_at) {
                          const createdAt = new Date(tx.created_at);
                          activeUntilDate = new Date(createdAt.getTime() + pkg.validity_days * 24 * 60 * 60 * 1000);
                        }
                      }
                      
                      const isExpired = !isLifetime && activeUntilDate && activeUntilDate < new Date();
                      const isAttemptsExhausted = maxAttempts > 0 && usedAttempts >= maxAttempts;
                      
                      return (
                        <Col xs={24} md={12} key={tx.id}>
                          <Card 
                            hoverable
                            className="weightless-card border-none overflow-hidden group p-0"
                            cover={
                              <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => navigate(`/paket/${pkg.slug}`)}>
                                <img alt={pkg.title} src={pkg.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute top-4 right-4">
                                  <Tag color="green" className="rounded-full border-none px-4 font-bold uppercase tracking-widest">{tx.status}</Tag>
                                </div>
                              </div>
                            }
                          >
                            <div className="p-6">
                              <Title level={4} className="!m-0 !font-black !font-manrope !text-lg mb-2">{pkg.title}</Title>
                              
                              <div className="flex flex-wrap gap-2 mb-4">
                                {isLifetime ? (
                                  <Tag color="purple" className="border-none font-bold uppercase text-[10px] m-0">Akses Selamanya (Lifetime)</Tag>
                                ) : (
                                  <Tag color={isExpired ? 'red' : 'blue'} className="border-none font-bold uppercase text-[10px] m-0">
                                    Aktif S/D: {activeUntilDate ? activeUntilDate.toLocaleDateString('id-ID') : '-'}
                                  </Tag>
                                )}
                                <Tag color={maxAttempts === 0 ? 'cyan' : (isAttemptsExhausted ? 'red' : 'orange')} className="border-none font-bold uppercase text-[10px] m-0">
                                  {maxAttempts === 0 ? 'Bebas Ujian Berkali-kali' : `Terpakai: ${usedAttempts} | Sisa Ujian: ${Math.max(0, maxAttempts - usedAttempts)} / ${maxAttempts}`}
                                </Tag>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <Text className="text-xs text-on-surface/40">Progres Belajar (Materi)</Text>
                                    <Text className="text-xs font-bold text-primary">{progress}%</Text>
                                  </div>
                                  <Progress 
                                    percent={progress} 
                                    showInfo={false} 
                                    strokeColor="#0060ad" 
                                    trailColor="rgba(0, 96, 173, 0.05)"
                                    strokeWidth={6}
                                  />
                                </div>
                                {pkg.materials && pkg.materials.length > 0 && (
                                  <div className="flex items-center justify-between pt-2">
                                    <Space size="large" className="text-xs text-on-surface/60">
                                      <span className="flex items-center gap-1.5"><FileTextOutlined /> {pkg.materials.length} Materi</span>
                                    </Space>
                                    <Button 
                                      type="default" 
                                      shape="circle" 
                                      icon={isExpanded ? <DownOutlined /> : <RightOutlined />} 
                                      onClick={() => toggleExpand(pkg.id)}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Materials Dropdown */}
                              {isExpanded && (
                                <div className="mt-6 pt-4 border-t border-dashed border-on-surface/10">
                                  <Text className="text-xs font-bold uppercase tracking-widest text-on-surface/40 mb-3 block">Daftar Materi</Text>
                                  {pkg.materials && pkg.materials.length > 0 ? (
                                    <List
                                      size="small"
                                      dataSource={pkg.materials}
                                      renderItem={mat => (
                                        <List.Item className="px-0 py-2 border-b border-on-surface/5 last:border-0 cursor-pointer hover:bg-surface-low rounded-lg transition-colors group">
                                          <div className="flex items-start gap-3 px-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mt-0.5 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                              {mat.category?.toLowerCase() === 'video' ? <PlayCircleOutlined /> : <FileTextOutlined />}
                                            </div>
                                            <div>
                                              <Text className="text-sm font-bold block leading-tight">{mat.title}</Text>
                                              <Text className="text-[10px] uppercase text-on-surface/40 tracking-widest">{mat.category}</Text>
                                            </div>
                                          </div>
                                        </List.Item>
                                      )}
                                    />
                                  ) : (
                                    <Text className="text-xs text-on-surface/40 italic block text-center py-2">Belum ada materi untuk paket ini.</Text>
                                  )}
                                </div>
                              )}
                                  <div className="mt-6 pt-6 border-t border-surface-low">
                                    <Space className="w-full" direction="vertical" size="middle">
                                      {pkg.materials && pkg.materials.length > 0 && (
                                        <Button type="primary" block className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow" onClick={() => navigate(`/paket/${pkg.slug}/materi/${pkg.materials[0].client_id}`)}>Buka Modul Belajar</Button>
                                      )}
                                      <Button 
                                        block 
                                        type={pkg.materials && pkg.materials.length > 0 ? "default" : "primary"}
                                        className={`rounded-xl font-bold h-11 transition-colors ${pkg.materials && pkg.materials.length > 0 ? 'border-primary text-primary hover:bg-primary/5' : 'shadow-lg shadow-primary/20 hover:shadow-primary/40'}`} 
                                        disabled={isExpired || isAttemptsExhausted}
                                        onClick={() => navigate(`/exam/${pkg.slug}`)}
                                      >
                                        Mulai Simulasi Ujian
                                      </Button>
                                      <Button block type="text" className="rounded-xl font-bold h-11 text-on-surface/60 hover:text-primary transition-colors" onClick={() => navigate(`/paket/${pkg.slug}`)}>Lihat Detail Paket</Button>
                                    </Space>
                                  </div>
                            </div>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                )}
              </div>

            </Col>

            {/* Sidebar */}
            <Col xs={24} lg={8}>
              <div className="space-y-8">
                
                {/* Related Materials */}
                <Card className="weightless-card border-none p-2">
                  <div className="mb-6 flex items-center justify-between">
                    <Title level={4} className="!m-0 !font-black !font-manrope">Materi Terkait</Title>
                    <BookOutlined className="text-primary text-xl" />
                  </div>
                  {ownedMaterials.length === 0 ? (
                    <Text className="text-xs text-on-surface/40 italic block text-center py-6">
                      Belum ada materi dari paket yang Anda miliki.
                    </Text>
                  ) : (
                    <List
                      itemLayout="horizontal"
                      dataSource={ownedMaterials.slice(0, 5)}
                      renderItem={(item) => (
                        <List.Item 
                          className="border-none px-0 py-3 group cursor-pointer"
                          onClick={() => navigate(`/paket/${item.packageSlug}/materi/${item.clientId}`)}
                        >
                          <List.Item.Meta
                            avatar={
                              <div className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center text-lg text-on-surface/40 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                {item.category?.toLowerCase() === 'video' ? <PlayCircleOutlined /> : <FileTextOutlined />}
                              </div>
                            }
                            title={
                              <Text className="font-bold text-sm text-on-surface block mb-0.5 group-hover:text-primary transition-colors truncate max-w-[200px]">
                                {item.title}
                              </Text>
                            }
                            description={
                              <Text className="text-[10px] text-on-surface/40 uppercase tracking-widest font-bold truncate block max-w-[200px]">
                                {item.packageTitle} &bull; {item.category}
                              </Text>
                            }
                          />
                          <RightOutlined className="text-on-surface/20 text-xs group-hover:text-primary transition-colors" />
                        </List.Item>
                      )}
                    />
                  )}
                </Card>

                {/* Upcoming Schedules */}
                <UpcomingSchedules />

              </div>
            </Col>
          </Row>

        </div>
      </div>
    </AppLayout>
  );
};

export default Practice;
