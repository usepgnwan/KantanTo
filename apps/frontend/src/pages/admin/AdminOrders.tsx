import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Card, Table, Input, Button, Tag, Avatar,
  Typography, Space, Select, Dropdown, Steps,
} from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
import {
  SearchOutlined, MoreOutlined, FilterOutlined,
  UserOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, ShoppingOutlined, ExportOutlined,
  PercentageOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Order {
  key: string;
  orderId: string;
  user: string;
  email: string;
  package: string;
  amount: number;
  originalAmount: number;
  voucher?: string;
  status: 'sukses' | 'pending' | 'gagal';
  method: string;
  date: string;
}

const mockOrders: Order[] = [
  { key: '1', orderId: 'KTN-20260422-1012', user: 'Arief Kurniawan', email: 'arief@gmail.com', package: 'Saintek Pro', originalAmount: 75000, amount: 60000, voucher: 'PROMOSI20', status: 'sukses', method: 'QRIS', date: '22 Apr 2026' },
  { key: '2', orderId: 'KTN-20260422-1011', user: 'Diana Fitri', email: 'diana@gmail.com', package: 'Tryout Akbar', originalAmount: 25000, amount: 25000, status: 'sukses', method: 'Transfer Bank', date: '22 Apr 2026' },
  { key: '3', orderId: 'KTN-20260420-0998', user: 'Rini Wulandari', email: 'rini@outlook.com', package: 'Saintek Pro', originalAmount: 75000, amount: 75000, status: 'sukses', method: 'QRIS', date: '20 Apr 2026' },
  { key: '4', orderId: 'KTN-20260419-0989', user: 'Joko Prasetyo', email: 'joko@gmail.com', package: 'Intensif UTBK', originalAmount: 95000, amount: 80000, voucher: 'DISKONMABA', status: 'pending', method: 'Virtual Account', date: '19 Apr 2026' },
  { key: '5', orderId: 'KTN-20260418-0975', user: 'Ayu Lestari', email: 'ayu@gmail.com', package: 'Intensif UTBK', originalAmount: 95000, amount: 95000, status: 'sukses', method: 'QRIS', date: '18 Apr 2026' },
  { key: '6', orderId: 'KTN-20260415-0954', user: 'Budi Santoso', email: 'budi@gmail.com', package: 'Soshum Mastery', originalAmount: 85000, amount: 85000, status: 'gagal', method: 'Transfer Bank', date: '15 Apr 2026' },
  { key: '7', orderId: 'KTN-20260414-0940', user: 'Dani Permana', email: 'dani@yahoo.com', package: 'Soshum Mastery', originalAmount: 85000, amount: 68000, voucher: 'BOLOSBELAJAR', status: 'sukses', method: 'QRIS', date: '14 Apr 2026' },
];

const statusConfig = {
  sukses: { color: 'green', icon: <CheckCircleOutlined />, label: 'Sukses' },
  pending: { color: 'orange', icon: <ClockCircleOutlined />, label: 'Pending' },
  gagal: { color: 'red', icon: <CloseCircleOutlined />, label: 'Gagal' },
};

const AdminOrders: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = mockOrders.filter((o) => {
    const matchSearch =
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      o.user.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = mockOrders.filter(o => o.status === 'sukses').reduce((a, o) => a + o.amount, 0);
  const successCount = mockOrders.filter(o => o.status === 'sukses').length;
  const pendingCount = mockOrders.filter(o => o.status === 'pending').length;

  const rowActions = (): MenuProps['items'] => [
    { key: 'view', label: 'Lihat Detail' },
    { key: 'resend', label: 'Kirim Konfirmasi' },
    { type: 'divider' },
    { key: 'refund', label: 'Proses Refund', danger: true },
  ];

  const columns: TableColumnsType<Order> = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (id) => <Text className="font-mono text-xs font-bold text-primary">{id}</Text>,
    },
    {
      title: 'Pengguna',
      dataIndex: 'user',
      key: 'user',
      render: (name, record) => (
        <div className="flex items-center gap-3">
          <Avatar size="small" icon={<UserOutlined />} className="bg-primary/10 text-primary shrink-0" />
          <div>
            <Text className="font-bold text-sm block">{name}</Text>
            <Text className="text-xs text-on-surface/40">{record.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Paket',
      dataIndex: 'package',
      key: 'package',
      render: (pkg) => (
        <Tag className="rounded-full bg-primary/10 text-primary border-none font-bold px-3">{pkg}</Tag>
      ),
    },
    {
      title: 'Nominal',
      key: 'amount',
      align: 'right',
      render: (_, record) => (
        <div className="flex flex-col items-end">
           {record.amount < record.originalAmount && (
             <Text delete className="text-[10px] text-on-surface/30">Rp {record.originalAmount.toLocaleString('id-ID')}</Text>
           )}
           <Text className="font-black text-sm text-primary">Rp {record.amount.toLocaleString('id-ID')}</Text>
        </div>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Voucher',
      dataIndex: 'voucher',
      key: 'voucher',
      render: (v) => v ? (
        <Tag icon={<PercentageOutlined />} className="rounded-full bg-orange-50 text-orange-600 border-orange-100 font-black text-[10px] px-2">
          {v}
        </Tag>
      ) : <Text className="text-on-surface/20">—</Text>,
    },
    {
      title: 'Metode',
      dataIndex: 'method',
      key: 'method',
      render: (method) => <Text className="text-sm font-medium">{method}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: Order['status']) => (
        <Tag
          icon={statusConfig[status].icon}
          color={statusConfig[status].color}
          className="rounded-full font-bold"
        >
          {statusConfig[status].label}
        </Tag>
      ),
    },
    {
      title: 'Tanggal',
      dataIndex: 'date',
      key: 'date',
      render: (date) => <Text className="text-sm text-on-surface/60">{date}</Text>,
    },
    {
      title: '',
      key: 'action',
      width: 48,
      render: () => (
        <Dropdown menu={{ items: rowActions() }} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} className="text-on-surface/40 hover:text-primary" />
        </Dropdown>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <Text className="text-[10px] uppercase font-black tracking-widest text-primary/60 block mb-1">Manajemen</Text>
              <Title level={1} className="!text-3xl !font-manrope !font-black !m-0">Daftar Pesanan</Title>
            </div>
            <Button icon={<ExportOutlined />} className="rounded-xl font-bold border-on-surface/10 mt-4 sm:mt-0">
              Ekspor CSV
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
              <Text className="text-[10px] uppercase font-black tracking-widest text-on-surface/40 dark:text-zinc-500 block mb-1">
                Total Pendapatan
              </Text>
              <div className="text-2xl font-black font-manrope text-primary">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </div>
              <Tag color="green" className="mt-2 rounded-full font-bold">{successCount} transaksi sukses</Tag>
            </Card>

            <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
              <Text className="text-[10px] uppercase font-black tracking-widest text-on-surface/40 dark:text-zinc-500 block mb-1">
                Menunggu Konfirmasi
              </Text>
              <div className="text-2xl font-black font-manrope text-orange-500">{pendingCount}</div>
              <Text className="text-xs text-on-surface/40">pesanan perlu ditindak</Text>
            </Card>

            <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
              <Text className="text-[10px] uppercase font-black tracking-widest text-on-surface/40 dark:text-zinc-500 block mb-2">
                Alur Pesanan
              </Text>
              <Steps
                size="small"
                current={1}
                items={[
                  { title: 'Diterima', icon: <ShoppingOutlined /> },
                  { title: 'Verifikasi' },
                  { title: 'Aktif', icon: <CheckCircleOutlined /> },
                ]}
              />
            </Card>
          </div>

          {/* Table */}
          <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Input
                prefix={<SearchOutlined className="text-on-surface/30" />}
                placeholder="Cari order ID atau nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl flex-1"
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full sm:w-44"
                options={[
                  { value: 'all', label: 'Semua Status' },
                  { value: 'sukses', label: 'Sukses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'gagal', label: 'Gagal' },
                ]}
                suffixIcon={<FilterOutlined />}
              />
            </div>

            <Table
              columns={columns}
              dataSource={filtered}
              pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `Total ${total} pesanan` }}
              scroll={{ x: 800 }}
            />
          </Card>

        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
