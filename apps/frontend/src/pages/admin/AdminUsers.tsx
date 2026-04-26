import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Row, Col, Card, Table, Input, Button, Tag, Avatar,
  Typography, Space, Select, Dropdown, Badge,
} from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
import {
  SearchOutlined, UserAddOutlined, MoreOutlined, FilterOutlined,
  UserOutlined, MailOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExportOutlined, TeamOutlined, RiseOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface User {
  key: string;
  name: string;
  email: string;
  package: string;
  status: 'aktif' | 'tidak aktif' | 'pending';
  joinDate: string;
  score: number | null;
}

const mockUsers: User[] = [
  { key: '1', name: 'Arief Kurniawan', email: 'arief@gmail.com', package: 'Saintek Pro', status: 'aktif', joinDate: '12 Apr 2026', score: 712 },
  { key: '2', name: 'Siti Aminah', email: 'siti@yahoo.com', package: 'Gratis', status: 'aktif', joinDate: '18 Apr 2026', score: 634 },
  { key: '3', name: 'Diana Fitri', email: 'diana@gmail.com', package: 'Tryout Akbar', status: 'aktif', joinDate: '20 Apr 2026', score: 688 },
  { key: '4', name: 'Budi Santoso', email: 'budi@gmail.com', package: 'Soshum Mastery', status: 'tidak aktif', joinDate: '5 Apr 2026', score: null },
  { key: '5', name: 'Rini Wulandari', email: 'rini@outlook.com', package: 'Saintek Pro', status: 'aktif', joinDate: '22 Apr 2026', score: 745 },
  { key: '6', name: 'Joko Prasetyo', email: 'joko@gmail.com', package: 'Gratis', status: 'pending', joinDate: '24 Apr 2026', score: null },
  { key: '7', name: 'Ayu Lestari', email: 'ayu@gmail.com', package: 'Intensif UTBK', status: 'aktif', joinDate: '10 Apr 2026', score: 728 },
  { key: '8', name: 'Dani Permana', email: 'dani@yahoo.com', package: 'Soshum Mastery', status: 'aktif', joinDate: '15 Apr 2026', score: 661 },
];

const statusConfig = {
  aktif: { color: 'green', icon: <CheckCircleOutlined /> },
  'tidak aktif': { color: 'default', icon: <CloseCircleOutlined /> },
  pending: { color: 'orange', icon: null },
};

const AdminUsers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const filtered = mockUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const rowActions = (record: User): MenuProps['items'] => [
    { key: 'view', label: 'Lihat Detail', icon: <UserOutlined /> },
    { key: 'edit', label: 'Edit Data', icon: <MailOutlined /> },
    { type: 'divider' },
    { key: 'suspend', label: record.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan', danger: record.status === 'aktif' },
  ];

  const columns: TableColumnsType<User> = [
    {
      title: 'Pengguna',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} className="bg-primary/10 text-primary shrink-0" />
          <div>
            <Text className="font-bold block text-sm">{name}</Text>
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
        <Tag className={`rounded-full font-bold border-none px-3 ${pkg === 'Gratis' ? 'bg-surface-low text-on-surface/60' : 'bg-primary/10 text-primary'}`}>
          {pkg}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: User['status']) => (
        <Tag
          icon={statusConfig[status].icon}
          color={statusConfig[status].color}
          className="rounded-full font-bold capitalize"
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'Skor Terakhir',
      dataIndex: 'score',
      key: 'score',
      align: 'center',
      render: (score) => score
        ? <Text className="font-black text-primary">{score}</Text>
        : <Text className="text-on-surface/30">—</Text>,
      sorter: (a, b) => (a.score ?? 0) - (b.score ?? 0),
    },
    {
      title: 'Bergabung',
      dataIndex: 'joinDate',
      key: 'joinDate',
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

  const stats = [
    { label: 'Total Pengguna', value: mockUsers.length, icon: <TeamOutlined />, color: 'primary' },
    { label: 'Pengguna Aktif', value: mockUsers.filter(u => u.status === 'aktif').length, icon: <CheckCircleOutlined />, color: 'green-500' },
    { label: 'Rata-rata Skor', value: Math.round(mockUsers.filter(u => u.score).reduce((a, u) => a + (u.score ?? 0), 0) / mockUsers.filter(u => u.score).length), icon: <RiseOutlined />, color: 'blue-500' },
  ];

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <Text className="text-[10px] uppercase font-black tracking-widest text-primary/60 block mb-1">Manajemen</Text>
              <Title level={1} className="!text-3xl !font-manrope !font-black !m-0">Daftar Pengguna</Title>
            </div>
            <Space className="mt-4 sm:mt-0">
              <Button icon={<ExportOutlined />} className="rounded-xl font-bold border-on-surface/10">Ekspor</Button>
              <Button type="primary" icon={<UserAddOutlined />} className="rounded-xl font-bold shadow-lg shadow-primary/20 h-10">
                Tambah Pengguna
              </Button>
            </Space>
          </div>

          {/* Stats */}
          <Row gutter={[16, 16]} className="mb-8">
            {stats.map((s, i) => (
              <Col xs={8} key={i}>
                <Card className="weightless-card border-none bg-white dark:bg-zinc-900 text-center shadow-md">
                  <div className={`w-10 h-10 rounded-2xl bg-${s.color}/10 text-${s.color} flex items-center justify-center text-lg mx-auto mb-2`}>{s.icon}</div>
                  <div className="text-2xl font-black font-manrope text-on-surface dark:text-zinc-100">{s.value}</div>
                  <Text className="text-[10px] uppercase font-bold text-on-surface/40 dark:text-zinc-500">{s.label}</Text>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Filters + Table */}
          <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Input
                prefix={<SearchOutlined className="text-on-surface/30" />}
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl flex-1"
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="rounded-xl w-full sm:w-44"
                options={[
                  { value: 'all', label: 'Semua Status' },
                  { value: 'aktif', label: 'Aktif' },
                  { value: 'tidak aktif', label: 'Tidak Aktif' },
                  { value: 'pending', label: 'Pending' },
                ]}
                suffixIcon={<FilterOutlined />}
              />
            </div>

            {selectedRows.length > 0 && (
              <div className="mb-4 px-4 py-3 bg-primary/5 dark:bg-primary/10 rounded-2xl flex items-center justify-between">
                <Text className="font-bold text-sm text-primary">{selectedRows.length} pengguna dipilih</Text>
                <Space>
                  <Button size="small" className="rounded-lg font-bold">Nonaktifkan</Button>
                  <Button size="small" danger className="rounded-lg font-bold">Hapus</Button>
                </Space>
              </div>
            )}

            <Table
              columns={columns}
              dataSource={filtered}
              rowSelection={{
                type: 'checkbox',
                onChange: (keys) => setSelectedRows(keys as string[]),
              }}
              pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `Total ${total} pengguna` }}
              className="weightless-table"
              scroll={{ x: 600 }}
            />
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
