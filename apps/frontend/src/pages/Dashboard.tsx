import React from 'react';
import AppLayout from '../layouts/AppLayout';
import UpcomingSchedules from '../components/organisms/UpcomingSchedules';
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
import { getUserDashboardStatsAPI, UserDashboardStats } from '../services/dashboardService';
import { getMyPackagesAPI, MyTransaction } from '../services/myPackageService';

const { Title, Text, Paragraph } = Typography;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { items: cartItems, removeFromCart } = useCart();
  const navigate = useNavigate();

  const [dashboardStats, setDashboardStats] = React.useState<UserDashboardStats | null>(null);
  const [myPackages, setMyPackages] = React.useState<MyTransaction[]>([]);

  React.useEffect(() => {
    if (user?.id) {
      getUserDashboardStatsAPI(user.id).then(setDashboardStats);
      getMyPackagesAPI(user.id).then(setMyPackages);
    }
  }, [user]);

  const stats = [
    { title: 'Total TO Dimiliki', value: dashboardStats?.total_packages || '0', icon: <HistoryOutlined />, color: 'blue' },
    { title: 'Total TO Dikerjakan', value: dashboardStats?.total_exams || '0', icon: <CheckCircleOutlined />, color: 'green' },
    { title: 'Rata-rata Skor', value: Math.round(dashboardStats?.avg_score || 0).toString(), icon: <RiseOutlined />, color: 'purple' },
    { title: 'Belajar Minggu Ini', value: `${(dashboardStats?.study_hours || 0).toFixed(1)} jam`, icon: <ClockCircleOutlined />, color: 'orange' },
  ];

  const accuracyData = dashboardStats?.accuracy_data || [
    { day: 'Mon', accuracy: 0, error: 0 },
    { day: 'Tue', accuracy: 0, error: 0 },
    { day: 'Wed', accuracy: 0, error: 0 },
    { day: 'Thu', accuracy: 0, error: 0 },
    { day: 'Fri', accuracy: 0, error: 0 },
    { day: 'Sat', accuracy: 0, error: 0 },
    { day: 'Sun', accuracy: 0, error: 0 },
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

                <Title level={2} className="!m-0 !font-black !text-4xl !font-manrope">
                  Halo, {user?.name.split(' ')[0]}
                </Title>
                <Paragraph className="text-on-surface/60 m-0 mt-1">
                  Pantau progres belajarmu hari ini
                </Paragraph>
              </div>
            </div>
          </div>

          {dashboardStats?.dream_description && (
            <Alert
              message="Dream Description (Apa Targetmu?)"
              description={dashboardStats.dream_description}
              type="info"
              showIcon
              closable
              icon={<BulbOutlined className="text-xl" />}
              className="mb-8 border-none bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl [&_.ant-alert-message]:font-bold [&_.ant-alert-message]:text-blue-700 [&_.ant-alert-description]:text-blue-900/80 shadow-sm"
            />
          )}

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
                              Acc: {Math.round(data.accuracy)}%
                            </div>
                          </div>
                          {/* Error Rate Bar */}
                          <div
                            className="w-full bg-primary/10 rounded-t-xl transition-all duration-500 relative group-hover:bg-primary/20"
                            style={{ height: `${data.error}%` }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Err: {Math.round(data.error)}%
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
                        {myPackages.slice(0, 4).map((tx, idx) => {
                          const dateObj = new Date(tx.created_at || Date.now());
                          const types = ['warning', 'success', 'error', 'info'];
                          const type = types[idx % types.length];

                          return (
                            <div key={tx.id} className="flex items-center gap-4 p-3 rounded-2xl bg-surface-low border border-on-surface/5 hover:border-primary/20 transition-all cursor-pointer" onClick={() => navigate('/latihan')}>
                              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold
                                ${type === 'warning' ? 'bg-orange-50 text-orange-600' : ''}
                                ${type === 'success' ? 'bg-green-50 text-green-600' : ''}
                                ${type === 'error' ? 'bg-red-50 text-red-600' : ''}
                                ${type === 'info' ? 'bg-blue-50 text-blue-600' : ''}
                              `}>
                                <span className="text-[10px] uppercase leading-none">{dateObj.getDate()}</span>
                                <span className="text-base">{dateObj.toLocaleString('id-ID', { month: 'short' })}</span>
                              </div>
                              <div className="flex-grow">
                                <Title level={5} className="!m-0 !text-sm !font-black">{tx.package.title}</Title>
                                <Text className="text-[10px] text-on-surface/40 uppercase tracking-widest font-bold">Progress: {Math.round(tx.progress)}%</Text>
                              </div>
                              <ArrowRightOutlined className="text-on-surface/20" />
                            </div>
                          );
                        })}
                        {myPackages.length === 0 && (
                          <div className="text-center p-4 text-on-surface/40 text-xs">Belum ada Tryout / Paket yang dimiliki.</div>
                        )}
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

                    <div className="text-center py-6">
                      <div className="relative mb-6 px-6">
                        <div className="absolute top-0 left-2 text-6xl text-primary/10 font-serif leading-none">"</div>
                        <div className="relative z-10 px-4 py-2">
                          <span className="text-xl md:text-2xl leading-tight font-black font-manrope text-on-surface italic">
                            {dashboardStats?.dream_description || 'Semangat mengejar impianmu!'}
                          </span>
                        </div>
                        <div className="absolute bottom-[-10px] right-2 text-6xl text-primary/10 font-serif leading-none rotate-180">"</div>
                      </div>
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <span className="text-xs uppercase font-bold text-primary tracking-[0.2em]">Vision Board Kamu</span>
                        <Button size="small" type="dashed" className="rounded-full text-[10px] uppercase font-bold text-on-surface/50 hover:text-primary hover:border-primary" onClick={() => navigate('/profile')}>
                          Edit
                        </Button>
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Tag color="blue" className="rounded-full border-none px-3 font-bold">
                          {(parseInt(dashboardStats?.target_point || '790', 10) - Math.round(dashboardStats?.avg_score || 0)) > 0
                            ? `+${parseInt(dashboardStats?.target_point || '790', 10) - Math.round(dashboardStats?.avg_score || 0)} menuju target`
                            : 'Target Tercapai!'}
                        </Tag>
                      </div>
                      <Paragraph className="text-xs text-on-surface/60 max-w-[200px] mx-auto">
                        {(parseInt(dashboardStats?.target_point || '790', 10) - Math.round(dashboardStats?.avg_score || 0)) > 0
                          ? `Hampir tercapai. Sedikit lagi menuju target ${dashboardStats?.target_campus || 'Universitas Indonesia'}!`
                          : `Selamat! Anda telah mencapai target skor untuk masuk ${dashboardStats?.target_campus || 'Universitas Indonesia'}!`}
                      </Paragraph>
                    </div>

                    <Alert
                      message={`Target: ${dashboardStats?.target_point || '790'} (${dashboardStats?.target_major || 'Kedokteran UI'})`}
                      type="info"
                      showIcon
                      icon={<BulbOutlined />}
                      className="border-none bg-primary/5 rounded-2xl"
                    />
                  </div>
                </Card>

                {/* Study Time Chart Moved Here for Better Layout */}
                {/* <Card className="weightless-card border-none p-2">
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
                </Card> */}

                <div className="flex-grow min-h-[300px]">
                  <UpcomingSchedules />
                </div>
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
                    Berdasarkan analisismu, fokuslah pada materi <Text className="text-white font-bold">{dashboardStats?.recommendation?.subject || 'Literasi Bahasa Inggris'}</Text> untuk meningkatkan skor totalmu sebesar <Text className="text-white font-bold">+{dashboardStats?.recommendation?.potential_points || 15} poin</Text>.
                  </Paragraph>
                  <Space size="large">
                    <Button
                      type="default"
                      size="large"
                      ghost
                      className="rounded-full h-14 px-10 border-white/20 text-white font-bold hover:bg-white/10"
                      onClick={() => {
                        const rec = dashboardStats?.recommendation;
                        if (rec && rec.package_slug && rec.material_id) {
                          navigate(`/paket/${rec.package_slug}/materi/${rec.material_id}`);
                        } else {
                          navigate('/latihan');
                        }
                      }}
                    >
                      Buka Pembahasan
                    </Button>
                    <Button
                      type="default"
                      size="large"
                      className="bg-white text-primary border-none rounded-full h-14 px-10 font-bold hover:scale-105 transition-all shadow-xl"
                      onClick={() => navigate('/latihan')}
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
            {!dashboardStats?.is_profile_complete ? (
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
            ) : (
              <Card className="weightless-card border-none flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                <Space size="large">
                  <div className="w-14 h-14 rounded-2xl bg-green-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-green-500/30">
                    <CheckCircleOutlined />
                  </div>
                  <div>
                    <Text className="text-[10px] uppercase font-bold text-green-600/70 tracking-widest">Profil Lengkap</Text>
                    <Title level={5} className="!m-0 !font-black text-green-800">Saatnya Memulai Targetmu!</Title>
                    <Paragraph className="m-0 text-xs text-green-700/80">Kamu sudah melengkapi profil. Fokus pada belajarmu dan kejar PTN impianmu!</Paragraph>
                  </div>
                </Space>
              </Card>
            )}

            <Card className="weightless-card border-none flex items-center p-4">
              <Space size="large">
                <div className="w-14 h-14 rounded-2xl bg-green-500 text-white flex items-center justify-center text-2xl">
                  <ThunderboltOutlined />
                </div>
                <div>
                  <Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Pencapaian Baru</Text>
                  <Title level={5} className="!m-0 !font-black">{dashboardStats?.is_top_5 ? 'Skor Tertinggi Mingguan!' : 'Ayo Tingkatkan Skormu!'}</Title>
                  <Paragraph className="m-0 text-xs text-on-surface/60">{dashboardStats?.is_top_5 ? 'Selamat! Kamu berada di jajaran Top 5 peserta Tryout dengan nilai terbesar.' : 'Tingkatkan terus nilaimu untuk bisa masuk ke Top 5 peserta Tryout.'}</Paragraph>
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
