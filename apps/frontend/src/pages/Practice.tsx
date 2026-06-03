import React from 'react';
import AppLayout from '../layouts/AppLayout';
import { Row, Col, Card, Typography, Button, Tag, Space, List, Avatar, Input, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  BookOutlined, 
  PlayCircleOutlined, 
  FileTextOutlined, 
  SearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RightOutlined,
  CloudDownloadOutlined,
  ContainerOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getMyPackagesAPI, MyTransaction } from '../services/myPackageService';

const { Title, Text, Paragraph } = Typography;

const Practice: React.FC = () => {
  const navigate = useNavigate();
  const [myTransactions, setMyTransactions] = React.useState<MyTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();
  const [expandedPackage, setExpandedPackage] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (user?.id) {
      setLoading(true);
      getMyPackagesAPI(user.id).then(data => {
        setMyTransactions(data || []);
      }).catch(() => {
        setMyTransactions([]);
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

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

  const relatedMaterials = [
    { title: 'E-Book: Aljabar Modern', type: 'E-Book', detail: 'Ringkasan Cepat & Rumus Sakti', icon: <FileTextOutlined /> },
    { title: 'Video: Trik Cepat Geometri', type: 'Video', detail: 'Durasi 12 Menit • HD', icon: <PlayCircleOutlined /> },
    { title: 'Flashcard: Rumus Turunan', type: 'Flashcard', detail: '24 Kartu Hafalan', icon: <ContainerOutlined /> },
  ];

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
              <div className="mb-10 flex flex-wrap gap-4 items-center">
                <Input 
                  placeholder="Cari materi atau topik..." 
                  prefix={<SearchOutlined />} 
                  className="max-w-md h-12 rounded-2xl border-none shadow-sm bg-white"
                />
                <Space>
                  <Tag className="rounded-full px-6 py-1 font-bold border-none bg-primary text-white cursor-pointer h-10 flex items-center">Semua</Tag>
                  <Tag className="rounded-full px-6 py-1 font-bold border-on-surface/5 bg-white text-on-surface/60 cursor-pointer h-10 flex items-center hover:bg-surface-low transition-colors">TPS</Tag>
                  <Tag className="rounded-full px-6 py-1 font-bold border-on-surface/5 bg-white text-on-surface/60 cursor-pointer h-10 flex items-center hover:bg-surface-low transition-colors">Literasi</Tag>
                </Space>
              </div>

              {/* Owned Packages Section */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <Title level={3} className="!m-0 !font-black !font-manrope">Paket Saya</Title>
                </div>
                {loading ? (
                  <div className="text-center py-10"><Text className="text-on-surface/40">Memuat paket...</Text></div>
                ) : myTransactions.length === 0 ? (
                  <Card className="weightless-card border-none p-10 text-center">
                    <Title level={4} className="!m-0 !font-black text-on-surface/40">Belum Ada Paket</Title>
                    <Paragraph className="text-on-surface/40 mt-2 mb-6">Kamu belum memiliki paket yang aktif. Yuk cari paket belajarmu sekarang!</Paragraph>
                    <Button type="primary" onClick={() => navigate('/paket')} className="rounded-xl h-10 font-bold">Cari Paket</Button>
                  </Card>
                ) : (
                  <Row gutter={[24, 24]}>
                    {myTransactions.map((tx) => {
                      const pkg = tx.package;
                      if (!pkg) return null;
                      const progress = calculateProgress(tx);
                      const isExpanded = expandedPackage === pkg.id;
                      
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
                              <Title level={4} className="!m-0 !font-black !font-manrope !text-lg mb-4">{pkg.title}</Title>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <Text className="text-xs text-on-surface/40">Progres Belajar (Simulasi)</Text>
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
                                <div className="flex items-center justify-between pt-2">
                                  <Space size="large" className="text-xs text-on-surface/60">
                                    <span className="flex items-center gap-1.5"><FileTextOutlined /> {(pkg.materials && pkg.materials.length) || 0} Materi</span>
                                  </Space>
                                  <Button 
                                    type="default" 
                                    shape="circle" 
                                    icon={isExpanded ? <DownOutlined /> : <RightOutlined />} 
                                    onClick={() => toggleExpand(pkg.id)}
                                  />
                                </div>
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
                                      <Button type="primary" block className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow" onClick={() => navigate(`/paket/${pkg.slug}/materi/${pkg.materials?.[0]?.client_id || 'm1'}`)}>Buka Modul Belajar</Button>
                                      <Button block className="rounded-xl font-bold h-11 border-primary text-primary hover:bg-primary/5 transition-colors" onClick={() => navigate(`/exam/${pkg.slug}`)}>Mulai Simulasi Ujian</Button>
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
                  <List
                    itemLayout="horizontal"
                    dataSource={relatedMaterials}
                    renderItem={(item) => (
                      <List.Item className="border-none px-0 py-4 group cursor-pointer">
                        <List.Item.Meta
                          avatar={
                            <div className="w-12 h-12 rounded-xl bg-surface-low flex items-center justify-center text-xl text-on-surface/40 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                              {item.icon}
                            </div>
                          }
                          title={<Text className="font-bold text-on-surface block mb-0.5 group-hover:text-primary transition-colors">{item.title}</Text>}
                          description={<Text className="text-[10px] text-on-surface/40 uppercase tracking-widest font-bold">{item.detail}</Text>}
                        />
                        <CloudDownloadOutlined className="text-on-surface/20 group-hover:text-primary transition-colors" />
                      </List.Item>
                    )}
                  />
                  <Button block size="large" className="rounded-2xl mt-4 font-bold border-primary/20 text-primary hover:bg-primary/5">
                    Lihat Semua Materi
                  </Button>
                </Card>

                {/* Study Time Reminder or Ad */}
                <Card className="bg-primary/5 border-primary/10 rounded-[2.5rem] p-8 text-center border overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-[-20%] -translate-y-[20%]" />
                  <div className="relative z-10">
                    <ClockCircleOutlined className="text-5xl text-primary mb-6" />
                    <Title level={4} className="!font-black !font-manrope mb-4">Konsistensi adalah Kunci</Title>
                    <Paragraph className="text-sm text-on-surface/60 mb-8">
                      Gunakan alarm belajar harian agar progresmu tetap terjaga dan target PTN impian tercapai!
                    </Paragraph>
                    <Button type="primary" block size="large" className="rounded-2xl h-14 font-bold shadow-xl shadow-primary/20">
                      Atur Jadwal Belajar
                    </Button>
                  </div>
                </Card>

              </div>
            </Col>
          </Row>

        </div>
      </div>
    </AppLayout>
  );
};

export default Practice;
