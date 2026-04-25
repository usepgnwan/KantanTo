import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { Typography, Row, Col, Card, Tag, Table, Button, Badge, Space } from 'antd';
import {
  HistoryOutlined,
  BarChartOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageLoader from '../components/atoms/PageLoader';
import Paragraph from 'antd/es/typography/Paragraph';
// import Paragraph from 'antd/es/skeleton/Paragraph';

const { Title, Text } = Typography;

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const data = [
    {
      key: '1',
      date: '2024-03-15',
      title: 'Tryout Akbar Nasional #1',
      score: 725,
      status: 'Selesai',
      category: 'Saintek',
    },
    {
      key: '2',
      date: '2024-03-10',
      title: 'Latihan Mandiri - Penalaran Umum',
      score: 680,
      status: 'Selesai',
      category: 'TPS',
    },
    {
      key: '3',
      date: '2024-03-05',
      title: 'Tryout Intensif Mingguan',
      score: 650,
      status: 'Selesai',
      category: 'Saintek',
    },
    {
      key: '4',
      date: '2024-02-28',
      title: 'Simulasi UTBK Mandiri',
      score: 710,
      status: 'Selesai',
      category: 'Soshum',
    },
  ];

  const columns = [
    {
      title: 'Tryout',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
            <FileTextOutlined className="text-primary" />
          </div>
          <div>
            <div className="font-bold text-on-surface">{text}</div>
            <div className="text-[10px] text-on-surface/40 uppercase tracking-widest font-heavy">{record.category}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Tanggal',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => <Text className="font-medium text-on-surface/60">{new Date(text).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>,
    },
    {
      title: 'Skor Akhir',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-primary">{score}</span>
          <span className="text-[10px] text-on-surface/40">/ 1000</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge
          count={status}
          style={{ backgroundColor: '#10b981', fontWeight: 'bold', fontSize: '10px' }}
          className="rounded-full"
        />
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      render: () => (
        <Button
          type="text"
          icon={<ArrowRightOutlined />}
          className="hover:text-primary font-bold flex items-center gap-2"
        >
          Lihat Detail
        </Button>
      ),
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <AppLayout>
      <div className="bg-surface-low/30 pt-32 pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <HistoryOutlined />
                <span className="text-[10px] uppercase font-heavy tracking-widest">Aktivitas Belajar</span>
              </div>
              <Title level={1} className="!font-manrope !m-0 !font-black tracking-tight !text-4xl md:!text-5xl">Riwayat Tryout</Title>
              <Paragraph className="text-on-surface/60 max-w-lg m-0">Lacak perkembangan skormu dan tinjau kembali hasil pengerjaan tryout sebelumnya untuk evaluasi yang lebih baik.</Paragraph>
            </div>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              size="large"
              className="rounded-2xl h-14 px-8 font-bold shadow-lg shadow-primary/20"
            >
              Analisis Progress
            </Button>
          </header>

          <Row gutter={[32, 32]}>
            <Col xs={24} lg={18}>
              <Card className="border-none bg-white rounded-[40px] shadow-2xl shadow-primary/5 p-4 md:p-8 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                <Table
                  columns={columns}
                  dataSource={data}
                  pagination={{ pageSize: 5 }}
                  className="weightless-table"
                />
              </Card>
            </Col>

            <Col xs={24} lg={6}>
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                <Card className="border-none bg-primary text-white rounded-[32px] p-6 shadow-xl shadow-primary/20 overflow-hidden relative">
                  <div className="relative z-10 space-y-6">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <TrophyOutlined className="text-2xl" />
                    </div>
                    <div className="space-y-1">
                      <Text className="text-white/60 text-xs font-bold uppercase tracking-widest">Skor Tertinggi</Text>
                      <div className="text-4xl font-black">725</div>
                    </div>
                    <div className="pt-2">
                      <Button ghost className="rounded-xl border-white/30 text-white font-bold h-10">Bandingkan</Button>
                    </div>
                  </div>
                  {/* Decorative element */}
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                </Card>

                <Card className="border-none bg-white rounded-[32px] p-6 shadow-xl shadow-primary/5">
                  <Title level={5} className="mb-6 !font-manrope">Ringkasan Statistik</Title>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <Space align="center" size="middle">
                        <CheckCircleOutlined className="text-green-500" />
                        <Text className="font-bold">Selesai</Text>
                      </Space>
                      <Text className="font-black">12</Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Space align="center" size="middle">
                        <ClockCircleOutlined className="text-yellow-500" />
                        <Text className="font-bold">Berjalan</Text>
                      </Space>
                      <Text className="font-black">1</Text>
                    </div>
                    <div className="h-px bg-on-surface/5" />
                    <div className="pt-2">
                      <Text className="text-xs text-on-surface/40 leading-relaxed block">
                        Kamu telah menyelesaikan <b>85%</b> dari total paket yang kamu miliki. Tetap semangat!
                      </Text>
                    </div>
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

export default HistoryPage;
