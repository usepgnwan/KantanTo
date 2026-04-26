import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Layout, Row, Col, Card, Button, Typography, Space, Empty } from 'antd';
import { 
  ExperimentOutlined, 
  FileSearchOutlined, 
  VideoCameraOutlined,
  ShoppingOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import AppLayout from '../layouts/AppLayout';
import PackageDetailHeader from '../components/organisms/PackageDetailHeader';
import QuestionGrid from '../components/molecules/QuestionGrid';
import ResourceCard from '../components/molecules/ResourceCard';

const { Title, Text, Paragraph } = Typography;

// Mock data generator for different slugs
const getPackageData = (slug: string) => {
  return {
    title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: 'Tingkatkan peluang kelulusanmu dengan simulasi ujian yang dirancang khusus mengikuti standar IRT terbaru. Dilengkapi dengan ribuan soal latihan dan pembahasan mendalam.',
    joinedCount: 1250,
    duration: '45 Menit / Sesi',
    category: 'Intensive Bootcamp',
    classes: ['Kelas 12', 'Alumni'],
    subjects: ['Matematika IPA', 'Fisika', 'Kimia'],
    isPurchased: true // Mock status as true for Latihan flow
  };
};

const discussions = [
  { id: 1, title: 'Pembahasan Soal Matematika Dasar - Bagian 1' },
  { id: 2, title: 'Tips Trik Penalaran Logis - Edisi 2024' },
  { id: 3, title: 'Analisis Kesalahan Umum di Tes Literasi' },
  { id: 4, title: 'Strategi Manajemen Waktu saat Ujian' },
  { id: 5, title: 'Pembahasan Soal Bahasa Indonesia - Paragraf' },
];

const videos = [
  { id: 1, title: 'Video: Kupas Tuntas SNBT 2024', duration: '12:45', thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800' },
  { id: 2, title: 'Video: Trick Hitung Cepat Kuantitatif', duration: '08:20', thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd482180c?q=80&w=800' },
  { id: 3, title: 'Video: Analisis Soal Literasi Inggris', duration: '15:10', thumbnail: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?q=80&w=800' },
  { id: 4, title: 'Video: Rahasia Skor 700+ di PU', duration: '20:00', thumbnail: 'https://images.unsplash.com/photo-1434031211128-095490e7e7e9?q=80&w=800' },
];

const PackageDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const packageData = getPackageData(slug || 'premium-packet');

  const tabItems = [
    {
      key: 'soal',
      label: (
        <span className="flex items-center gap-2 px-2">
          <ExperimentOutlined /> Soal
        </span>
      ),
      children: <QuestionGrid />,
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
          {discussions.map((item) => (
            <ResourceCard 
              key={item.id}
              title={item.title}
              type="discussion"
              isLocked={!packageData.isPurchased}
              onClick={() => navigate(`/materi/${item.id}`)}
            />
          ))}
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
          <Row gutter={[24, 24]}>
            {videos.map((video) => (
              <Col xs={24} sm={12} key={video.id}>
                <ResourceCard 
                  title={video.title}
                  duration={video.duration}
                  thumbnail={video.thumbnail}
                  type="video"
                  isLocked={!packageData.isPurchased}
                  onClick={() => navigate(`/video/${video.id}`)}
                />
              </Col>
            ))}
          </Row>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <PackageDetailHeader {...packageData} />

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
                {packageData.isPurchased ? (
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
                        Dapatkan akses penuh ke seluruh soal, pembahasan eksklusif, dan video tutorial premium.
                      </Paragraph>
                    </div>

                    <div className="bg-surface-low p-6 rounded-2xl border border-surface-container">
                      <Text className="text-xs text-surface-on/40 line-through">Rp 150.000</Text>
                      <div className="flex items-baseline gap-2">
                        <Title level={2} className="!m-0 !text-primary">Rp 75.000</Title>
                        <Text className="text-xs text-surface-on/40">/ Lifetime</Text>
                      </div>
                    </div>

                    <Button 
                      type="primary" 
                      block 
                      size="large" 
                      className="h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                      icon={<ShoppingOutlined />}
                    >
                      Beli Paket Sekarang
                    </Button>

                    <div className="text-center pt-4 border-t border-surface-container">
                      <Text className="text-[10px] text-surface-on/40 uppercase font-bold tracking-tight">
                        Jaminan 100% Kualitas Materi Terbaik
                      </Text>
                    </div>
                  </Space>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </section>
    </AppLayout>
  );
};

export default PackageDetailPage;
