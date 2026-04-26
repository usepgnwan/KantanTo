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
  ContainerOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const Practice: React.FC = () => {
  const navigate = useNavigate();
  const ownedPackages = [
    {
      id: 1,
      title: 'Persiapan Intensif SNBT 2024',
      progress: 65,
      totalTopics: 12,
      completedTopics: 8,
      status: 'Active',
      image: 'https://placehold.co/400x250?text=SNBT+2024'
    },
    {
      id: 2,
      title: 'Mastering TPS: Penalaran Umum',
      progress: 30,
      totalTopics: 8,
      completedTopics: 2,
      status: 'Active',
      image: 'https://placehold.co/400x250?text=TPS+Mastery'
    }
  ];

  const practiceCategories = [
    {
      title: 'Penalaran Matematika',
      desc: 'Materi mendalam tentang Aljabar, Geometri, dan Kalkulus dasar.',
      count: '120 Soal',
      icon: <ContainerOutlined className="text-blue-500" />,
      color: 'blue'
    },
    {
      title: 'Literasi Bahasa Indonesia',
      desc: 'Analisis teks kompleks dan kaidah kebahasaan tingkat tinggi.',
      count: '340 Soal',
      icon: <BookOutlined className="text-green-500" />,
      color: 'green'
    },
    {
      title: 'Penalaran Kuantitatif',
      desc: 'Uji logika matematika dan pemecahan masalah dengan data.',
      count: '210 Soal',
      icon: <FileTextOutlined className="text-purple-500" />,
      color: 'purple'
    },
    {
      title: 'Literasi Bahasa Inggris',
      desc: 'Reading comprehension and advanced vocabulary patterns.',
      count: '150 Soal',
      icon: <BookOutlined className="text-orange-500" />,
      color: 'orange'
    }
  ];

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
                  <Button type="link" className="text-primary font-bold">Lihat Semua <RightOutlined /></Button>
                </div>
                <Row gutter={[24, 24]}>
                  {ownedPackages.map((pkg) => (
                    <Col xs={24} md={12} key={pkg.id}>
                      <Card 
                        hoverable
                        onClick={() => navigate('/paket/soshum-mastery')}
                        className="weightless-card border-none overflow-hidden group p-0"
                        cover={
                          <div className="relative h-48 overflow-hidden">
                            <img alt={pkg.title} src={pkg.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute top-4 right-4">
                              <Tag color="green" className="rounded-full border-none px-4 font-bold">Aktif</Tag>
                            </div>
                          </div>
                        }
                      >
                        <div className="p-6">
                          <Title level={4} className="!m-0 !font-black !font-manrope !text-lg mb-4">{pkg.title}</Title>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-2">
                                <Text className="text-xs text-on-surface/40">Progres Belajar</Text>
                                <Text className="text-xs font-bold text-primary">{pkg.progress}%</Text>
                              </div>
                              <Progress 
                                percent={pkg.progress} 
                                showInfo={false} 
                                strokeColor="#0060ad" 
                                trailColor="rgba(0, 96, 173, 0.05)"
                                strokeWidth={6}
                              />
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <Space size="large" className="text-xs text-on-surface/60">
                                <span className="flex items-center gap-1.5"><FileTextOutlined /> {pkg.totalTopics} Topik</span>
                                <span className="flex items-center gap-1.5"><CheckCircleOutlined /> {pkg.completedTopics} Selesai</span>
                              </Space>
                              <Button type="primary" shape="circle" icon={<RightOutlined />} />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* Practice Categories Section */}
              <div>
                <Title level={3} className="!mb-6 !font-black !font-manrope">Bank Soal Per Mapel</Title>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {practiceCategories.map((cat, idx) => (
                    <Card key={idx} className="weightless-card border-none hover:translate-x-2 transition-all duration-300">
                      <div className="flex gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0
                          ${cat.color === 'blue' ? 'bg-blue-50' : ''}
                          ${cat.color === 'green' ? 'bg-green-50' : ''}
                          ${cat.color === 'purple' ? 'bg-purple-50' : ''}
                          ${cat.color === 'orange' ? 'bg-orange-50' : ''}
                        `}>
                          {cat.icon}
                        </div>
                        <div className="flex-grow">
                          <Title level={4} className="!m-0 !font-black !font-manrope !text-lg">{cat.title}</Title>
                          <Paragraph className="text-xs text-on-surface/40 mt-1 mb-4">{cat.desc}</Paragraph>
                          <div className="flex items-center justify-between">
                            <Tag className="rounded-full border-none bg-surface-low px-4 font-bold text-[10px] uppercase tracking-widest text-on-surface/40">
                              {cat.count}
                            </Tag>
                            <Button 
                              type="text" 
                              className="text-primary font-bold text-xs uppercase tracking-widest p-0"
                              onClick={() => navigate('/materi/1')}
                            >
                              Mulai <RightOutlined />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
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
