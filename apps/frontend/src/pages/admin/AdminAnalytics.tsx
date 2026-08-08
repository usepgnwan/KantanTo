import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Row, Col, Typography, Card, Select, Statistic, Table, Tag } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
  TeamOutlined,
  FireOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getMenuLogsAPI, MenuLogResponse } from '../../services/logService';
import { getAdminTransactions } from '../../services/transactionService';
import { getUsers, User } from '../../services/userService';

const { Title, Text } = Typography;

const AdminAnalytics: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  const [logs, setLogs] = useState<MenuLogResponse[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    getMenuLogsAPI()
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoadingLogs(false));
      
    getAdminTransactions()
      .then(res => {
        if (res.status && res.data) {
          setTransactions(res.data);
        }
      })
      .catch(console.error);

    getUsers(1, 10000)
      .then(res => {
        if (res.rows) setUsers(res.rows);
      })
      .catch(console.error);
  }, []);

  const getChartData = () => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const dates: string[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(`${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`);
    }

    const packageStats: Record<string, number[]> = {};
    const legendData: Set<string> = new Set();

    logs.forEach(log => {
      // Hanya menghitung klik yang mengarah ke detail paket
      if (log.path.includes('/paket/')) {
        const d = new Date(log.created_at);
        const logDate = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;
        const index = dates.indexOf(logDate);
        if (index !== -1) {
          const pkgName = log.label;
          legendData.add(pkgName);
          if (!packageStats[pkgName]) {
            packageStats[pkgName] = new Array(days).fill(0);
          }
          packageStats[pkgName][index]++;
        }
      }
    });

    const colors = ['#0053dd', '#6d567f', '#595e72', '#0762ff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    const series = Array.from(legendData).map((pkgName, i) => {
      const color = colors[i % colors.length];
      return {
        name: pkgName,
        type: 'line',
        stack: 'Total',
        smooth: true,
        data: packageStats[pkgName],
        itemStyle: { color },
        areaStyle: {}, // Let ECharts handle opacity automatically
      };
    });

    return { dates, series, legend: Array.from(legendData) };
  };

  const getFunnelData = () => {
    // Menghitung jumlah berdasarkan kategori URL di menu logs
    const totalCount = logs.length;
    const catalogCount = logs.filter(l => l.path.includes('/paket')).length;
    const authCount = logs.filter(l => l.path === '/register' || l.path === '/login').length;
    const dashboardCount = logs.filter(l => l.path === '/dashboard' || l.path === '/latihan' || l.path === '/riwayat').length;

    // Untuk funnel, idealnya data harus menurun (descending). 
    // Kita pastikan nilainya tidak lebih besar dari step sebelumnya secara logis jika ingin visualisasi kerucut yang sempurna, 
    // tapi ECharts funnel akan mengurutkan jika di set 'descending', atau kita bisa biarkan berantakan tapi bentuknya tak beraturan.
    // Echarts sort: 'descending' akan mengurutkan value secara otomatis.
    return [
      { value: totalCount, name: 'Total Interaksi', itemStyle: { color: '#dde1f9' }, label: { color: '#1e40af' } },
      { value: catalogCount, name: 'Lihat Paket', itemStyle: { color: '#93c5fd' } },
      { value: authCount, name: 'Klik Masuk/Daftar', itemStyle: { color: '#3b82f6' } },
      { value: dashboardCount, name: 'Akses Dashboard/Belajar', itemStyle: { color: '#1d4ed8' } },
    ];
  };

  const chartData = getChartData();
  const funnelData = getFunnelData();

  const getUserGrowthData = () => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const dates: string[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(`${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`);
    }

    const dataNewUsers = new Array(days).fill(0);
    const dataActiveUsers = new Array(days).fill(0);

    users.forEach(user => {
      // Calculate Pengguna Baru
      if (user.created_at) {
        const d = new Date(user.created_at);
        const uDate = `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}`;
        const idx = dates.indexOf(uDate);
        if (idx !== -1) dataNewUsers[idx]++;
      }
      
      // Calculate Pengguna Aktif
      if (user.last_login) {
        const d2 = new Date(user.last_login);
        const lDate = `${d2.getDate()} ${d2.toLocaleString('id-ID', { month: 'short' })}`;
        const idx2 = dates.indexOf(lDate);
        if (idx2 !== -1) dataActiveUsers[idx2]++;
      }
    });

    return { dates, dataNewUsers, dataActiveUsers };
  };

  const growthData = getUserGrowthData();

  // ─────────────────────────────────────────
  // 1. User Growth — Line + Bar combo
  // ─────────────────────────────────────────
  const userGrowthOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross', crossStyle: { color: '#999' } } },
    legend: { data: ['Pengguna Aktif', 'Pendaftar Baru'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: growthData.dates,
      axisPointer: { type: 'shadow' },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af' },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Pengguna Aktif',
        nameTextStyle: { color: '#9ca3af', padding: [0, 0, 0, 20] },
        splitLine: { lineStyle: { type: 'dashed', color: '#ebeef1' } },
        axisLabel: { color: '#9ca3af' },
      },
      {
        type: 'value',
        name: 'Pendaftar Baru',
        nameTextStyle: { color: '#9ca3af', padding: [0, 20, 0, 0] },
        splitLine: { show: false },
        axisLabel: { color: '#9ca3af' },
      },
    ],
    series: [
      {
        name: 'Pengguna Aktif',
        type: 'line',
        smooth: true,
        data: growthData.dataActiveUsers,
        itemStyle: { color: '#0053dd', shadowColor: 'rgba(0, 83, 221, 0.4)', shadowBlur: 10 },
        lineStyle: { width: 4 },
      },
      {
        name: 'Pendaftar Baru',
        type: 'bar',
        yAxisIndex: 1,
        barWidth: '30%',
        data: growthData.dataNewUsers,
        itemStyle: { color: '#dbeafe', borderRadius: [4, 4, 0, 0] },
      },
    ],
  };

  // ─────────────────────────────────────────
  // 2. Revenue by package — horizontal bar
  // ─────────────────────────────────────────
  const getRevenueData = () => {
    const revenueMap: Record<string, number> = {};
    transactions.forEach(t => {
       if (t.status === 'active') {
          const pkgName = t.package?.title || 'Lainnya';
          revenueMap[pkgName] = (revenueMap[pkgName] || 0) + t.amount;
       }
    });
    
    // Sort by revenue ascending for horizontal bar (largest at top)
    const sorted = Object.entries(revenueMap).sort((a, b) => a[1] - b[1]); 
    // If empty, provide placeholder
    if (sorted.length === 0) {
      return { categories: ['Belum Ada Transaksi'], data: [{ value: 0, itemStyle: { color: '#adb3b7' } }] };
    }

    return {
      categories: sorted.map(s => s[0]),
      data: sorted.map((s, i) => {
         const colors = ['#adb3b7', '#6d567f', '#595e72', '#0762ff', '#0053dd'];
         const color = colors[Math.min(i, colors.length - 1)];
         return { value: s[1], itemStyle: { color, borderRadius: [0, 6, 6, 0] } };
      })
    };
  };

  const revData = getRevenueData();

  const revenueByPackageOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '10%', bottom: '5%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#9ca3af', formatter: (v: number) => `${v / 1000}K` } },
    yAxis: {
      type: 'category',
      data: revData.categories,
      axisLabel: { color: '#9ca3af', fontWeight: 600, fontSize: 11, width: 90, overflow: 'truncate' },
    },
    series: [
      {
        name: 'Pendapatan (Rp)',
        type: 'bar',
        barWidth: '55%',
        data: revData.data,
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
        data: funnelData,
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
    legend: { data: chartData.legend, bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '25%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.dates,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } },
      axisLabel: { color: '#9ca3af' },
    },
    series: chartData.series,
  };

  const kpiCards = [
    { label: 'Total Pendapatan Bulan Ini', value: 'Rp 107.8M', delta: '+18.4%', up: true, icon: <RiseOutlined /> },
    { label: 'Pengguna Baru (30 Hari)', value: '1,592', delta: '+11.2%', up: true, icon: <TeamOutlined /> },
    { label: 'Rata-rata Skor Tryout', value: '71.4 / 100', delta: '+3.1%', up: true, icon: <TrophyOutlined /> },
    { label: 'Churn Rate', value: '4.8%', delta: '+0.6%', up: false, icon: <FallOutlined /> },
  ];

  const logColumns = [
    {
      title: 'Waktu',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => <Text className="text-xs font-semibold">{new Date(text).toLocaleString('id-ID')}</Text>,
    },
    {
      title: 'Label Menu / Paket',
      dataIndex: 'label',
      key: 'label',
      render: (text: string) => <Text className="font-bold text-primary">{text}</Text>,
    },
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
      render: (text: string) => <Text className="text-xs text-on-surface/60">{text}</Text>,
    },
    {
      title: 'Perangkat',
      dataIndex: 'device',
      key: 'device',
      render: (text: string) => (
        <Tag color={text === 'web' ? 'blue' : 'purple'} className="rounded-md font-bold uppercase text-[10px] border-none">
          {text}
        </Tag>
      ),
    },
    {
      title: 'Pengguna',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => user ? (
        <div className="flex flex-col">
          <Text className="text-xs font-bold">{user.name}</Text>
          <Text className="text-[10px] text-on-surface/40">{user.email}</Text>
        </div>
      ) : (
        <Text className="text-xs text-on-surface/40 italic">Guest</Text>
      ),
    },
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
                  <Title level={5} className="!m-0 !font-manrope !font-black">Corong Navigasi Pengguna</Title>
                  <Text className="text-xs text-on-surface/40 dark:text-zinc-500">Dari Interaksi Kunjungan → Akses Area Belajar</Text>
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
                  <Title level={5} className="!m-0 !font-manrope !font-black">Total Klik Paket per Hari</Title>
                  <Text className="text-xs text-on-surface/40 dark:text-zinc-500">Dipecah berdasarkan paket spesifik</Text>
                </div>
                <ReactECharts option={dailyTriesOption} style={{ height: '280px' }} />
              </Card>
            </Col>
          </Row>

          {/* ── Row 4: Menu Logs Table ── */}
          <Row gutter={[20, 20]} className="mt-8">
            <Col xs={24}>
              <Card className="weightless-card border-none bg-white dark:bg-zinc-900">
                <div className="px-2 pt-2 mb-6">
                  <Title level={5} className="!m-0 !font-manrope !font-black">Riwayat Aktivitas Navigasi (Menu Logs)</Title>
                  <Text className="text-xs text-on-surface/40 dark:text-zinc-500">Daftar lengkap log klik menu dan halaman paket terbaru</Text>
                </div>
                <Table
                  dataSource={logs}
                  columns={logColumns}
                  rowKey="id"
                  loading={loadingLogs}
                  pagination={{ pageSize: 10, className: 'weightless-pagination' }}
                  className="font-sans"
                  size="middle"
                />
              </Card>
            </Col>
          </Row>

        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
