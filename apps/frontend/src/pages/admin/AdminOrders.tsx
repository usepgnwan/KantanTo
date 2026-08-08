import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { getAdminTransactions, updateTransactionStatus } from '../../services/transactionService';
import {
  Card, Table, Input, Button, Tag, Avatar,
  Typography, Select, Dropdown, Steps, message,
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
  status: 'sukses' | 'pending' | 'gagal' | 'batal';
  rawStatus: string;
  method: string;
  date: string;
}

const AdminOrders: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getAdminTransactions();
      if (res.status && res.data) {
        const formatted: Order[] = res.data.map((t: any) => {
          let mappedStatus: 'sukses' | 'pending' | 'gagal' | 'batal' = 'pending';
          if (t.status === 'active') mappedStatus = 'sukses';
          else if (t.status === 'cancelled' || t.status === 'batal') mappedStatus = 'batal';
          else if (t.status === 'expired' || t.status === 'inactive' || t.status === 'failed') mappedStatus = 'gagal';

          return {
            key: t.id.toString(),
            orderId: t.order_id,
            user: t.user?.name || '-',
            email: t.user?.email || '-',
            package: t.package?.title || '-',
            amount: t.amount,
            originalAmount: t.package?.price || t.amount,
            voucher: t.voucher?.code,
            status: mappedStatus,
            rawStatus: t.status || 'pending payment',
            method: t.payment_method?.toUpperCase() || '-',
            date: new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
          };
        });
        setOrders(formatted);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateTransactionStatus(id, newStatus);
      message.success('Status pembayaran berhasil diperbarui!');
      setOrders((prev) =>
        prev.map((o) => {
          if (o.key === id) {
            let mappedStatus: 'sukses' | 'pending' | 'gagal' | 'batal' = 'pending';
            if (newStatus === 'active') mappedStatus = 'sukses';
            else if (newStatus === 'cancelled' || newStatus === 'batal') mappedStatus = 'batal';
            else if (newStatus === 'expired' || newStatus === 'inactive' || newStatus === 'failed') mappedStatus = 'gagal';
            return { ...o, rawStatus: newStatus, status: mappedStatus };
          }
          return o;
        })
      );
    } catch (error) {
      message.error('Gagal memperbarui status pembayaran');
    }
  };

  const statusConfig = {
    sukses: { color: 'green', icon: <CheckCircleOutlined />, label: 'Sukses' },
    pending: { color: 'orange', icon: <ClockCircleOutlined />, label: 'Pending' },
    batal: { color: 'volcano', icon: <CloseCircleOutlined />, label: 'Dibatalkan (Customer)' },
    gagal: { color: 'red', icon: <CloseCircleOutlined />, label: 'Gagal' },
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      o.user.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = orders.filter(o => o.status === 'sukses').reduce((a, o) => a + o.amount, 0);
  const successCount = orders.filter(o => o.status === 'sukses').length;
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const cancelledCount = orders.filter(o => o.status === 'batal').length;

  const rowActions = (record: Order): MenuProps['items'] => [
    { key: 'view', label: 'Lihat Detail' },
    { type: 'divider' },
    {
      key: 'active',
      label: <span className="text-green-600 font-bold">Ubah ke Sukses</span>,
      disabled: record.status === 'sukses',
      onClick: () => handleStatusChange(record.key, 'active'),
    },
    {
      key: 'cancelled',
      label: <span className="text-orange-600 font-bold">Ubah ke Dibatalkan</span>,
      disabled: record.status === 'batal',
      onClick: () => handleStatusChange(record.key, 'cancelled'),
    },
    {
      key: 'expired',
      label: <span className="text-red-500 font-bold">Ubah ke Gagal</span>,
      disabled: record.status === 'gagal',
      onClick: () => handleStatusChange(record.key, 'expired'),
    },
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
      render: (_, record) => (
        <Dropdown menu={{ items: rowActions(record) }} trigger={['click']} placement="bottomRight">
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
                  { value: 'batal', label: 'Dibatalkan (Customer)' },
                  { value: 'gagal', label: 'Gagal' },
                ]}
                suffixIcon={<FilterOutlined />}
              />
            </div>

            <Table
              loading={loading}
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
