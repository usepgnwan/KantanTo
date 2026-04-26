import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Row, Col, Typography, Card, Select, Statistic } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
  TeamOutlined,
  FireOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const { Title, Text } = Typography;

const AdminAnalytics: React.FC = () => {
  const [period, setPeriod] = useState('30d');

  // ─────────────────────────────────────────
  // 1. User Growth — Line + Bar combo
  // ─────────────────────────────────────────
  const userGrowthOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Pengguna Baru', 'Pengguna Aktif'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['1 Apr', '5 Apr', '10 Apr', '15 Apr', '20 Apr', '25 Apr', '30 Apr'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
      axisLabel: { color: '#9ca3af' },
    },
    series: [
      {
        name: 'Pengguna Baru',
        type: 'bar',
        barWidth: '30%',
        data: [180, 220, 195, 310, 275, 390, 420],
        itemStyle: { color: '#dde1f9', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Pengguna Aktif',
        type: 'line',
        smooth: true,
        data: [1200, 1380, 1250, 1600, 1780, 2100, 2340],
        itemStyle: { color: '#0053dd' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0,83,221,0.18)' },
              { offset: 1, color: 'rgba(0,83,221,0)' },
            ],
          },
        },
      },
    ],
  };

  // ─────────────────────────────────────────
  // 2. Revenue by package — horizontal bar
  // ─────────────────────────────────────────
  const revenueByPackageOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '10%', bottom: '5%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#9ca3af', formatter: (v: number) => `${v / 1000}K` } },
    yAxis: {
      type: 'category',
      data: ['Saintek Pro', 'Soshum Mastery', 'Tryout Akbar', 'Intensif UTBK', 'Gratis'],
      axisLabel: { color: '#9ca3af', fontWeight: 600, fontSize: 11 },
    },
    series: [
      {
        name: 'Pendapatan (Rp)',
        type: 'bar',
        barWidth: '55%',
        data: [
          { value: 42500000, itemStyle: { color: '#0053dd', borderRadius: [0, 6, 6, 0] } },
          { value: 31200000, itemStyle: { color: '#0762ff', borderRadius: [0, 6, 6, 0] } },
          { value: 19800000, itemStyle: { color: '#595e72', borderRadius: [0, 6, 6, 0] } },
          { value: 14300000, itemStyle: { color: '#6d567f', borderRadius: [0, 6, 6, 0] } },
          { value: 0, itemStyle: { color: '#adb3b7', borderRadius: [0, 6, 6, 0] } },
        ],
        label: {
          show: true,
          position: 'right',
          formatter: ({ value }: { value: number }) =>
            value === 0 ? '-' : `Rp ${(value / 1000000).toFixed(1)}M`,
          color: '#6b7280',
          fontSize: 11,
          fontWeight: 700,
        },
      },
    ],
  };

  // ─────────────────────────────────────────
  // 3. Tryout Completion Funnel
  // ─────────────────────────────────────────
  const funnelOption = {
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c}%' },
    series: [
      {
        name: 'Conversion',
        type: 'funnel',
        left: '10%',
        top: 40,
        bottom: 20,
        width: '80%',
        min: 0,
        max: 100,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 4,
        label: { show: true, position: 'inside', color: '#fff', fontSize: 12, fontWeight: 700 },
        emphasis: { label: { fontSize: 14 } },
        data: [
          { value: 100, name: 'Kunjungi Halaman', itemStyle: { color: '#dde1f9' }, label: { color: '#1e40af' } },
          { value: 68, name: 'Mulai Daftar', itemStyle: { color: '#93c5fd' } },
          { value: 52, name: 'Bayar Paket', itemStyle: { color: '#3b82f6' } },
          { value: 38, name: 'Mulai Tryout', itemStyle: { color: '#1d4ed8' } },
          { value: 24, name: 'Selesai Tryout', itemStyle: { color: '#0053dd' } },
        ],
      },
    ],
  };

  // ─────────────────────────────────────────
  // 4. Subject Performance — Radar
  // ─────────────────────────────────────────
  const radarOption = {
    tooltip: {},
    legend: { data: ['Rata-rata Skor', 'Target'], bottom: 0 },
    radar: {
      indicator: [
        { name: 'Literasi Bahasa', max: 100 },
        { name: 'Literasi Matematika', max: 100 },
        { name: 'Pengetahuan Umum', max: 100 },
        { name: 'Pengetahuan Sains', max: 100 },
        { name: 'Penalaran Umum', max: 100 },
        { name: 'Pengetahuan Sosial', max: 100 },
      ],
      shape: 'polygon',
      splitNumber: 4,
      splitLine: { lineStyle: { color: ['#f0f4ff', '#dde8ff', '#c7d9ff', '#a7c2ff'] } },
      axisLine: { lineStyle: { color: '#dde1f9' } },
      name: { color: '#6b7280', fontSize: 11, fontWeight: 700 },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [71, 64, 78, 59, 82, 74],
            name: 'Rata-rata Skor',
            areaStyle: { color: 'rgba(0,83,221,0.12)' },
            lineStyle: { color: '#0053dd', width: 2 },
            itemStyle: { color: '#0053dd' },
          },
          {
            value: [80, 75, 80, 75, 85, 80],
            name: 'Target',
            lineStyle: { color: '#e5e7eb', type: 'dashed', width: 2 },
            itemStyle: { color: '#d1d5db' },
            areaStyle: { color: 'rgba(209,213,219,0.1)' },
          },
        ],
      },
    ],
  };

  // ─────────────────────────────────────────
  // 5. Daily Tryout Attempts — stacked area
  // ─────────────────────────────────────────
  const dailyTriesOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Saintek', 'Soshum', 'Campuran'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
      axisLabel: { color: '#9ca3af' },
    },
    series: [
      {
        name: 'Saintek',
        type: 'line',
        stack: 'Total',
        smooth: true,
        data: [120, 145, 132, 180, 155, 90, 70],
        itemStyle: { color: '#0053dd' },
        areaStyle: { color: 'rgba(0,83,221,0.25)' },
      },
      {
        name: 'Soshum',
        type: 'line',
        stack: 'Total',
        smooth: true,
        data: [80, 95, 88, 110, 102, 60, 45],
        itemStyle: { color: '#6d567f' },
        areaStyle: { color: 'rgba(109,86,127,0.2)' },
      },
      {
        name: 'Campuran',
        type: 'line',
        stack: 'Total',
        smooth: true,
        data: [40, 55, 48, 65, 58, 30, 22],
        itemStyle: { color: '#595e72' },
        areaStyle: { color: 'rgba(89,94,114,0.15)' },
      },
    ],
  };

  const kpiCards = [
    { label: 'Total Pendapatan Bulan Ini', value: 'Rp 107.8M', delta: '+18.4%', up: true, icon: <RiseOutlined /> },
    { label: 'Pengguna Baru (30 Hari)', value: '1,592', delta: '+11.2%', up: true, icon: <TeamOutlined /> },
    { label: 'Rata-rata Skor Tryout', value: '71.4 / 100', delta: '+3.1%', up: true, icon: <TrophyOutlined /> },
    { label: 'Churn Rate', value: '4.8%', delta: '+0.6%', up: false, icon: <FallOutlined /> },
  ];

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <Text className="text-[10px] font-black uppercase tracking-widest text-primary/60 block mb-1">Admin Panel</Text>
              <Title level={1} className="!text-3xl md:!text-4xl !font-manrope !font-black !m-0 flex items-center gap-3">
                <FireOutlined className="text-orange-500 text-3xl" /> Analitik Platform
              </Title>
            </div>
            <Select
              value={period}
              onChange={setPeriod}
              className="mt-4 sm:mt-0 w-40 font-bold"
              options={[
                { value: '7d', label: '7 Hari Terakhir' },
                { value: '30d', label: '30 Hari Terakhir' },
                { value: '90d', label: '90 Hari Terakhir' },
              ]}
            />
          </div>

          {/* ── KPI Cards ── */}
          <Row gutter={[20, 20]} className="mb-8">
            {kpiCards.map((k, i) => (
              <Col xs={12} lg={6} key={i}>
                <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-lg shadow-primary/5 hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${k.up ? 'bg-primary/10 text-primary' : 'bg-red-50 dark:bg-red-900/30 text-red-500'}`}>
                      {k.icon}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${k.up ? 'bg-green-50 dark:bg-green-900/30 text-green-600' : 'bg-red-50 dark:bg-red-900/30 text-red-500'}`}>
                      {k.up ? <RiseOutlined /> : <FallOutlined />} {k.delta}
                    </span>
                  </div>
                  <Text className="block text-[10px] uppercase font-black tracking-widest text-on-surface/40 dark:text-zinc-500 mb-1">{k.label}</Text>
                  <div className="text-xl font-black font-manrope text-on-surface dark:text-zinc-100">{k.value}</div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* ── Row 1: User Growth + Revenue by Package ── */}
          <Row gutter={[20, 20]} className="mb-8">
            <Col xs={24} lg={14}>
              <Card className="weightless-card border-none bg-white dark:bg-zinc-900 h-full">
                <div className="flex items-center justify-between mb-2 px-2 pt-2">
                  <Title level={5} className="!m-0 !font-manrope !font-black">Tren Pertumbuhan Pengguna</Title>
                  <Text className="text-xs font-bold text-on-surface/40 dark:text-zinc-500">per {period === '7d' ? '7' : period === '30d' ? '30' : '90'} hari</Text>
                </div>
                <ReactECharts option={userGrowthOption} style={{ height: '300px' }} />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card className="weightless-card border-none bg-white dark:bg-zinc-900 h-full">
                <div className="px-2 pt-2 mb-2">
                  <Title level={5} className="!m-0 !font-manrope !font-black">Pendapatan per Paket</Title>
                </div>
                <ReactECharts option={revenueByPackageOption} style={{ height: '300px' }} />
              </Card>
            </Col>
          </Row>

          {/* ── Row 2: Funnel + Radar ── */}
          <Row gutter={[20, 20]} className="mb-8">
            <Col xs={24} lg={9}>
              <Card className="weightless-card border-none bg-white dark:bg-zinc-900 h-full">
                <div className="px-2 pt-2 mb-2">
                  <Title level={5} className="!m-0 !font-manrope !font-black">Corong Konversi Pengguna</Title>
                  <Text className="text-xs text-on-surface/40 dark:text-zinc-500">Dari Kunjungan → Penyelesaian Tryout</Text>
                </div>
                <ReactECharts option={funnelOption} style={{ height: '320px' }} />
              </Card>
            </Col>
            <Col xs={24} lg={15}>
              <Card className="weightless-card border-none bg-white dark:bg-zinc-900 h-full">
                <div className="px-2 pt-2 mb-2">
                  <Title level={5} className="!m-0 !font-manrope !font-black">Performa Per Mata Uji</Title>
                  <Text className="text-xs text-on-surface/40 dark:text-zinc-500">Rata-rata skor seluruh peserta vs target kelulusan</Text>
                </div>
                <ReactECharts option={radarOption} style={{ height: '320px' }} />
              </Card>
            </Col>
          </Row>

          {/* ── Row 3: Daily Attempts Stacked Area ── */}
          <Row gutter={[20, 20]}>
            <Col xs={24}>
              <Card className="weightless-card border-none bg-white dark:bg-zinc-900">
                <div className="px-2 pt-2 mb-2">
                  <Title level={5} className="!m-0 !font-manrope !font-black">Total Pengerjaan Tryout per Hari</Title>
                  <Text className="text-xs text-on-surface/40 dark:text-zinc-500">Dipecah berdasarkan program studi (Saintek, Soshum, Campuran)</Text>
                </div>
                <ReactECharts option={dailyTriesOption} style={{ height: '280px' }} />
              </Card>
            </Col>
          </Row>

        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
