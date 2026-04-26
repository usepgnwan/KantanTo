import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Row, Col, Typography, Card, Avatar } from 'antd';
import { UserOutlined, RiseOutlined, FireOutlined, FallOutlined, BarChartOutlined, EllipsisOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const { Title, Text } = Typography;

const AdminDashboard: React.FC = () => {
  const [activeRange, setActiveRange] = useState<'7d' | '30d'>('7d');

  // Placeholder Data
  const metrics = [
    { title: 'Pengguna Aktif', value: '4,102', growth: '+12%', isPositive: true, icon: <UserOutlined />, color: 'primary' },
    { title: 'Pendapatan (Harian)', value: 'Rp 14.5M', growth: '+5.4%', isPositive: true, icon: <RiseOutlined />, color: 'green-500' },
    { title: 'Tingkat Penyelesaian Tryout', value: '68%', growth: '-2.1%', isPositive: false, icon: <FallOutlined />, color: 'red-500' },
  ];

  const recentUsers = [
    { name: 'Arief Kurniawan', package: 'SNBT Intensive Pro', time: '12 menit lalu' },
    { name: 'Siti Aminah', package: 'Gratis Akses', time: '1 jam lalu' },
    { name: 'Diana Fitri', package: 'Tryout Akbar Plus', time: '3 jam lalu' },
  ];

  // ECharts Configurations
  const revenueChartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#ebeef1' } },
    },
    series: [
      {
        name: 'Pendapatan (Juta)',
        type: 'line',
        smooth: true,
        data: [12, 14, 11, 15, 18, 22, 28],
        itemStyle: { color: '#0053dd' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(0, 83, 221, 0.3)' }, { offset: 1, color: 'rgba(0, 83, 221, 0)' }]
          }
        }
      }
    ]
  };

  const distributionChartOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center' },
    series: [
      {
        name: 'Tipe Paket Pengguna',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false },
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        data: [
          { value: 1048, name: 'Saintek Pro', itemStyle: { color: '#0053dd' } },
          { value: 735, name: 'Soshum Mastery', itemStyle: { color: '#0762ff' } },
          { value: 580, name: 'Akses Gratis', itemStyle: { color: '#adb3b7' } },
          { value: 484, name: 'Tryout Akbar', itemStyle: { color: '#fca5a5' } }
        ]
      }
    ]
  };

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <Text className="text-[10px] font-heavy uppercase tracking-widest text-primary/60 block mb-1">
                Kantan Admin Panel
              </Text>
              <Title level={1} className="!text-3xl md:!text-4xl !font-manrope !font-black !m-0">
                Dashboard Overview
              </Title>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-full p-1 mt-4 sm:mt-0 shadow-sm border border-on-surface/5 dark:border-white/5 flex gap-1">
              <button 
                onClick={() => setActiveRange('7d')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeRange === '7d' ? 'bg-primary text-white shadow-md' : 'text-on-surface/60 dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100'}`}
              >
                7 Hari
              </button>
              <button 
                onClick={() => setActiveRange('30d')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeRange === '30d' ? 'bg-primary text-white shadow-md' : 'text-on-surface/60 dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100'}`}
              >
                30 Hari
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <Row gutter={[24, 24]} className="mb-8">
            {metrics.map((metric, i) => (
              <Col xs={24} sm={8} key={i}>
                <Card className="weightless-card border-none bg-white dark:bg-zinc-900 p-6 shadow-xl shadow-primary/5 group hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-${metric.color}/10 text-${metric.color} flex items-center justify-center text-xl`}>
                      {metric.icon}
                    </div>
                    <div className={`flex items-center gap-1 font-bold text-xs px-2 py-1 rounded-full ${metric.isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {metric.isPositive ? <RiseOutlined /> : <FallOutlined />} {metric.growth}
                    </div>
                  </div>
                  <Text className="text-on-surface/60 uppercase tracking-widest text-[10px] font-bold block mb-1">
                    {metric.title}
                  </Text>
                  <Title level={2} className="!font-manrope !font-black !m-0">
                    {metric.value}
                  </Title>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Charts Row */}
          <Row gutter={[24, 24]}>
            {/* Main Chart */}
            <Col xs={24} lg={16}>
              <Card className="weightless-card border-none bg-white dark:bg-zinc-900 p-2 h-full">
                <div className="flex justify-between items-center px-4 pt-4 mb-6">
                  <Title level={4} className="!mb-0 !font-manrope !font-black flex items-center gap-2">
                    <BarChartOutlined className="text-primary" /> Analisis Pendapatan Mingguan
                  </Title>
                  <EllipsisOutlined className="text-xl text-on-surface/40 cursor-pointer hover:text-primary transition-colors" />
                </div>
                <ReactECharts option={revenueChartOption} style={{ height: '350px' }} />
              </Card>
            </Col>

            {/* Distribution Sub-Chart */}
            <Col xs={24} lg={8}>
              <Card className="weightless-card border-none border-on-surface/5 bg-white dark:bg-zinc-900 p-2 h-full">
                <Title level={5} className="!mb-8 !font-manrope !font-black px-4 pt-4">Distribusi Pengguna</Title>
                <ReactECharts option={distributionChartOption} style={{ height: '280px' }} />
              </Card>
            </Col>
          </Row>

          {/* Table / Lists Row */}
          <Row gutter={[24, 24]} className="mt-8">
            <Col xs={24} lg={12}>
               <Card className="weightless-card border border-on-surface/5 bg-surface-lowest p-0 overflow-hidden">
                 <div className="p-6 border-b border-on-surface/5 flex justify-between items-center bg-surface-low/30">
                    <Title level={5} className="!m-0 !font-manrope !font-black">Pendaftar Terbaru</Title>
                    <span className="text-xs text-primary font-bold cursor-pointer">Lihat Semua</span>
                 </div>
                 <div className="divide-y divide-on-surface/5">
                   {recentUsers.map((u, i) => (
                     <div key={i} className="p-4 sm:p-6 flex items-center justify-between hover:bg-surface-low/50 dark:hover:bg-zinc-800/50 transition-colors">
                       <div className="flex items-center gap-4">
                         <Avatar icon={<UserOutlined />} className="bg-primary/10 text-primary border-none" size="large" />
                         <div>
                           <Text className="font-bold block text-sm">{u.name}</Text>
                           <Text className="text-xs font-bold text-primary/80 bg-primary/5 px-2 py-0.5 rounded border border-primary/10 mt-1">{u.package}</Text>
                         </div>
                       </div>
                       <Text className="text-xs font-medium text-on-surface/40">{u.time}</Text>
                     </div>
                   ))}
                 </div>
               </Card>
            </Col>

            <Col xs={24} lg={12}>
               {/* Quick Actions Card */}
               <Card className="weightless-card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 p-6 h-full relative overflow-hidden">
                 <div className="absolute right-0 top-0 w-40 h-40 bg-primary/10 rounded-full translate-x-10 -translate-y-10 blur-xl" />
                 <Title level={4} className="!font-manrope !font-black !mb-2 flex items-center gap-2">
                    <FireOutlined className="text-orange-500" /> Aksi Cepat
                 </Title>
                 <Text className="text-on-surface/60 block mb-8">Pilih tindakan cepat untuk mengelola platform SNBT Tryout Anda hari ini.</Text>
                 
                 <div className="grid grid-cols-2 gap-4 relative z-10">
                   <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-sm border border-on-surface/5 dark:border-white/5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                         <BarChartOutlined />
                      </div>
                      <Text className="font-bold text-sm block">Buat Laporan Baru</Text>
                   </div>
                   <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-sm border border-on-surface/5 dark:border-white/5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 text-green-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                         <RiseOutlined />
                      </div>
                      <Text className="font-bold text-sm block">Ubah Harga Paket</Text>
                   </div>
                 </div>
               </Card>
            </Col>
          </Row>

        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
