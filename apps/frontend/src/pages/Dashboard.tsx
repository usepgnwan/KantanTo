import React from 'react';
import AppLayout from '../layouts/AppLayout';
import { Row, Col, Card, Typography, Avatar, Space, Progress, Tag, Button, Alert } from 'antd';
import { 
  HistoryOutlined, 
  ThunderboltOutlined, 
  BulbOutlined, 
  RiseOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { items: cartItems, removeFromCart } = useCart();
  const navigate = useNavigate();

  // Mock data based on Stitch design
  const stats = [
    { title: 'Total TO Dimiliki', value: '24', icon: <HistoryOutlined />, color: 'blue' },
    { title: 'Total TO Dikerjakan', value: '18', icon: <CheckCircleOutlined />, color: 'green' },
    { title: 'Rata-rata Skor', value: '685', icon: <RiseOutlined />, color: 'purple' },
    { title: 'Belajar Minggu Ini', value: '14.5 jam', icon: <ClockCircleOutlined />, color: 'orange' },
  ];

  const accuracyData = [
    { day: 'Mon', accuracy: 65, error: 35 },
    { day: 'Tue', accuracy: 72, error: 28 },
    { day: 'Wed', accuracy: 68, error: 32 },
    { day: 'Thu', accuracy: 85, error: 15 },
    { day: 'Fri', accuracy: 78, error: 22 },
    { day: 'Sat', accuracy: 90, error: 10 },
    { day: 'Sun', accuracy: 82, error: 18 },
  ];

  const studyTimeData = [
    { day: 'Mon', hours: 2.5, subject: 'Math' },
    { day: 'Tue', hours: 3.2, subject: 'English' },
    { day: 'Wed', hours: 1.8, subject: 'Logic' },
    { day: 'Thu', hours: 4.5, subject: 'Physics' },
    { day: 'Fri', hours: 2.8, subject: 'Biology' },
    { day: 'Sat', hours: 5.5, subject: 'Full TO' },
    { day: 'Sun', hours: 3.0, subject: 'Review' },
  ];



  const scheduleEvents = [
    { date: '2024-04-26', title: 'Tryout Mandiri 04', type: 'warning' },
    { date: '2024-04-28', title: 'Live Class: Literasi Inggris', type: 'success' },
    { date: '2024-05-01', title: 'Saintek Intensive 01', type: 'error' },
  ];

  return (
    <AppLayout>
      <div className="bg-surface-low/30 min-h-screen py-12 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
            <div className="flex items-center gap-6">
              <Avatar 
                size={84} 
                src={user?.avatar} 
                className="border-4 border-white shadow-xl shadow-primary/10"
              />
              <div>
                <Text className="text-sm font-heavy uppercase tracking-[0.2em] text-on-surface/40 leading-none mb-2 block">
                  ID: 2024-ANBK-0892
                </Text>
                <Title level={2} className="!m-0 !font-black !text-4xl !font-manrope">
                  Halo, {user?.name.split(' ')[0]}
                </Title>
                <Paragraph className="text-on-surface/60 m-0 mt-1">
                  Pantau progres belajarmu hari ini
                </Paragraph>
              </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-800 p-4 px-8 rounded-[2rem] shadow-sm border border-on-surface/5 flex items-center gap-4">
              <div className="text-right">
                <Text className="text-[10px] uppercase font-bold tracking-widest text-on-surface/40 block">Berlangganan Sampai</Text>
                <Text className="font-black text-primary">12 Des 2024</Text>
              </div>
              <div className="h-8 w-px bg-on-surface/5 mx-2" />
              <Button type="primary" className="rounded-full font-bold h-10 px-6 uppercase tracking-widest text-[10px]">Upgrade</Button>
            </div>
          </div>

          {/* Stats Grid */}
          <Row gutter={[24, 24]} className="mb-12">
            {stats.map((stat, index) => (
              <Col xs={12} lg={6} key={index}>
                <Card className="weightless-card border-none hover:translate-y-[-4px] transition-all duration-300 h-full">
                  <div className="flex flex-col h-full">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-xl
                      ${stat.color === 'blue' ? 'bg-blue-50 text-blue-500' : ''}
                      ${stat.color === 'green' ? 'bg-green-50 text-green-500' : ''}
                      ${stat.color === 'purple' ? 'bg-purple-50 text-purple-500' : ''}
                      ${stat.color === 'orange' ? 'bg-orange-50 text-orange-500' : ''}
                    `}>
                      {stat.icon}
                    </div>
                    <Text className="text-xs font-heavy uppercase tracking-widest text-on-surface/40 mb-1">{stat.title}</Text>
                    <Title level={2} className="!m-0 !font-black !font-manrope">{stat.value}</Title>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[24, 24]}>
            {/* Left Column: Stats & Recommendation */}
            <Col xs={24} lg={16}>
              <div className="flex flex-col gap-6">
                
                {/* Accuracy Bar Chart */}
                <Card className="weightless-card border-none p-2">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <Title level={4} className="!m-0 !font-black !font-manrope">Akurasi & Error Rate</Title>
                      <Text className="text-xs text-on-surface/40">Visualisasi performa 7 hari terakhir</Text>
                    </div>
                    <Space>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <Text className="text-[10px] uppercase font-bold text-on-surface/40">Akurasi (%)</Text>
                      </div>
                    </Space>
                  </div>

                  <div className="h-48 flex items-end justify-between px-4 gap-2">
                    {accuracyData.map((data, i) => (
                      <div key={i} className="flex-grow flex flex-col items-center group cursor-pointer h-full justify-end">
                        <div className="w-full max-w-[40px] flex flex-col-reverse h-full justify-end pt-8">
                          {/* Accuracy Bar */}
                          <div 
                            className="w-full bg-primary rounded-t-sm transition-all duration-700 relative group-hover:brightness-110"
                            style={{ height: `${data.accuracy}%` }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                              Acc: {data.accuracy}%
                            </div>
                          </div>
                          {/* Error Rate Bar */}
                          <div 
                            className="w-full bg-primary/10 rounded-t-xl transition-all duration-500 relative group-hover:bg-primary/20"
                            style={{ height: `${data.error}%` }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Err: {data.error}%
                            </div>
                          </div>
                        </div>
                        <Text className="text-[10px] uppercase font-bold text-on-surface/30 mt-4 tracking-tighter">{data.day}</Text>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Calendar & Cart Row */}
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={14}>
                    <Card className="weightless-card border-none h-full p-2">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <Title level={4} className="!m-0 !font-black !font-manrope">Jadwal Belajar</Title>
                          <Text className="text-xs text-on-surface/40">Simulasi & Kelas Mendatang</Text>
                        </div>
                        <Button type="text" className="text-primary font-bold text-xs uppercase tracking-widest">Detail</Button>
                      </div>
                      
                      <div className="space-y-4">
                        {scheduleEvents.map((event, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl bg-surface-low border border-on-surface/5 hover:border-primary/20 transition-all cursor-pointer">
                            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold
                              ${event.type === 'warning' ? 'bg-orange-50 text-orange-600' : ''}
                              ${event.type === 'success' ? 'bg-green-50 text-green-600' : ''}
                              ${event.type === 'error' ? 'bg-red-50 text-red-600' : ''}
                            `}>
                              <span className="text-[10px] uppercase leading-none">{event.date.split('-')[2]}</span>
                              <span className="text-base">Apr</span>
                            </div>
                            <div className="flex-grow">
                              <Title level={5} className="!m-0 !text-sm !font-black">{event.title}</Title>
                              <Text className="text-[10px] text-on-surface/40 uppercase tracking-widest font-bold">08:00 - 10:00 WIB</Text>
                            </div>
                            <ArrowRightOutlined className="text-on-surface/20" />
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={10}>
                    <Card className="weightless-card border-none h-full p-2">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <Title level={4} className="!m-0 !font-black !font-manrope">Keranjang</Title>
                          <Text className="text-xs text-on-surface/40">{cartItems.length} Item Menunggu</Text>
                        </div>
                        <HistoryOutlined className="text-on-surface/20 text-xl" />
                      </div>

                      <div className="space-y-4 mb-6">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <Avatar shape="square" size={48} src={item.image} className="rounded-xl border border-on-surface/5" />
                            <div className="flex-grow">
                              <Text className="text-xs font-black block leading-tight">{item.title}</Text>
                              <Text className="text-[10px] text-primary font-bold">Rp {item.price.toLocaleString('id-ID')}</Text>
                            </div>
                            <Button size="small" type="text" className="text-xs font-bold text-red-400" onClick={() => removeFromCart(item.id)}>Hapus</Button>
                          </div>
                        ))}
                      </div>
                      
                      <Button type="primary" block className="rounded-xl h-10 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20" onClick={() => navigate('/keranjang')}>
                        Checkout Sekarang
                      </Button>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Right Column: Target Progress */}
            <Col xs={24} lg={8}>
              <div className="flex flex-col gap-6 h-full">
                <Card className="weightless-card border-none p-2">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Title level={4} className="!m-0 !font-black !font-manrope">Target Skor</Title>
                        <Text className="text-xs text-on-surface/40">Progres Menuju Target</Text>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center">
                        <RiseOutlined className="text-primary text-xl" />
                      </div>
                    </div>

                    <div className="text-center py-4">
                      <div className="relative inline-flex mb-4">
                        <Progress 
                          type="dashboard" 
                          percent={85} 
                          strokeWidth={8}
                          strokeColor="#0060ad"
                          trailColor="rgba(0, 96, 173, 0.05)"
                          width={180}
                          format={() => (
                            <div className="flex flex-col">
                              <span className="text-4xl font-black font-manrope">720</span>
                              <span className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Prediksi Skor</span>
                            </div>
                          )}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Tag color="blue" className="rounded-full border-none px-3 font-bold">+70 menuju target</Tag>
                      </div>
                      <Paragraph className="text-xs text-on-surface/60 max-w-[200px] mx-auto">
                        Hampir tercapai. Sedikit lagi menuju target Universitas Indonesia!
                      </Paragraph>
                    </div>

                    <Alert 
                      message="Target: 790 (Kedokteran UI)" 
                      type="info" 
                      showIcon 
                      icon={<BulbOutlined />}
                      className="border-none bg-primary/5 rounded-2xl"
                    />
                  </div>
                </Card>

                {/* Study Time Chart Moved Here for Better Layout */}
                <Card className="weightless-card border-none p-2 flex-grow">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <Title level={4} className="!m-0 !font-black !font-manrope">Study Time</Title>
                      <Text className="text-xs text-on-surface/40">Minggu Ini</Text>
                    </div>
                  </div>

                  <div className="h-40 flex items-end justify-between px-4 gap-2">
                    {studyTimeData.map((data, i) => (
                      <div key={i} className="flex-grow flex flex-col items-center group cursor-pointer h-full justify-end">
                        <div 
                          className="w-full bg-orange-100 group-hover:bg-orange-200 rounded-lg transition-all duration-500 relative"
                          style={{ height: `${(data.hours / 6) * 100}%` }}
                        >
                          <div 
                            className="absolute bottom-0 left-0 w-full bg-orange-400 opacity-80 rounded-lg"
                            style={{ height: '100%' }}
                          />
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                            {data.subject}: {data.hours}h
                          </div>
                        </div>
                        <Text className="text-[10px] font-bold text-on-surface/30 mt-2">{data.day[0]}</Text>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </Col>
          </Row>

          {/* CTA Section */}
          <div className="mt-12">
            <Card className="bg-gradient-to-r from-primary to-primary-container border-none rounded-[3rem] overflow-hidden relative p-4">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-10 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-x-1/2 translate-y-1/2" />
              
              <Row gutter={[48, 48]} align="middle" className="relative z-10 p-4 md:p-8">
                <Col xs={24} md={16}>
                  <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md">
                    <ThunderboltOutlined className="text-yellow-300" />
                    <Text className="text-white text-[10px] font-heavy uppercase tracking-widest">Rekomendasi Belajar</Text>
                  </div>
                  <Title level={2} className="!text-white !font-black !text-3xl md:!text-5xl !font-manrope mb-6">
                    Siap untuk Simulasi Berikutnya?
                  </Title>
                  <Paragraph className="text-white/80 text-lg mb-8 max-w-xl">
                    Berdasarkan analisismu, fokuslah pada materi <Text className="text-white font-bold">Literasi Bahasa Inggris</Text> untuk meningkatkan skor totalmu sebesar <Text className="text-white font-bold">+15 poin</Text>.
                  </Paragraph>
                  <Space size="large">
                    <Button 
                      type="default" 
                      size="large" 
                      ghost 
                      className="rounded-full h-14 px-10 border-white/20 text-white font-bold hover:bg-white/10"
                    >
                      Buka Pembahasan
                    </Button>
                    <Button 
                      type="default" 
                      size="large" 
                      className="bg-white text-primary border-none rounded-full h-14 px-10 font-bold hover:scale-105 transition-all shadow-xl"
                    >
                      Mulai Tryout Baru <ArrowRightOutlined />
                    </Button>
                  </Space>
                </Col>
                <Col xs={0} md={8} className="text-center">
                  <div className="relative inline-block scale-110">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl animate-pulse" />
                    <BulbOutlined className="text-[12rem] text-white/10 relative z-10" />
                  </div>
                </Col>
              </Row>
            </Card>
          </div>

          {/* Recent History / Notification Footer */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="weightless-card border-none flex items-center p-4">
              <Space size="large">
                <div className="w-14 h-14 rounded-2xl bg-on-surface text-white flex items-center justify-center text-2xl">
                  <WarningOutlined className="text-yellow-400" />
                </div>
                <div>
                  <Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Peringatan</Text>
                  <Title level={5} className="!m-0 !font-black">Lengkapi Profilmu</Title>
                  <Paragraph className="m-0 text-xs text-on-surface/60">Tambahkan target PTN cadangan untuk analisis yang lebih akurat.</Paragraph>
                </div>
              </Space>
            </Card>
            
            <Card className="weightless-card border-none flex items-center p-4">
              <Space size="large">
                <div className="w-14 h-14 rounded-2xl bg-green-500 text-white flex items-center justify-center text-2xl">
                  <ThunderboltOutlined />
                </div>
                <div>
                  <Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Pencapaian Baru</Text>
                  <Title level={5} className="!m-0 !font-black">Skor Tertinggi Mingguan!</Title>
                  <Paragraph className="m-0 text-xs text-on-surface/60">Kamu berada di Top 5% peserta Tryout Minggu ini.</Paragraph>
                </div>
              </Space>
            </Card>
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
