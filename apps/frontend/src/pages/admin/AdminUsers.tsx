import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Row, Col, Card, Table, Input, Button, Tag, Avatar,
  Typography, Space, Select, Dropdown, Badge, message,
} from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
import {
  SearchOutlined, UserAddOutlined, MoreOutlined, FilterOutlined,
  UserOutlined, MailOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExportOutlined, TeamOutlined, RiseOutlined, PhoneOutlined,
} from '@ant-design/icons';
import { getUsers, User } from '../../services/userService';

const { Title, Text } = Typography;

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  aktif: { color: 'green', icon: <CheckCircleOutlined /> },
  'non-aktif': { color: 'default', icon: <CloseCircleOutlined /> },
  pending: { color: 'orange', icon: null },
};

const AdminUsers: React.FC = () => {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Note: Local frontend-only status filtering since API doesn't support status query yet, 
  // but for massive scale you'd pass it back to API.
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUsers(currentPage, perPage, searchQuery);
      setData(result.rows || []);
      setTotal(result.total || 0);
    } catch (err) {
      message.error('Gagal mengambil data pengguna');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchUsers, searchQuery]);

  const filtered = data.filter((u) => {
    if (statusFilter === 'all') return true;
    return u.status === statusFilter;
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
          <div className="flex flex-col">
            <Text className="font-bold block text-sm">{name}</Text>
            <Text className="text-[10px] text-on-surface/40 flex items-center gap-1">
              <MailOutlined className="text-[10px]" /> {record.email}
            </Text>
            <Text className="text-[10px] text-on-surface/40 flex items-center gap-1">
              <PhoneOutlined className="text-[10px]" /> {record.nohp || '-'}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Roles',
      key: 'role',
      render: (_, record) => {
        const roleTitle = record.role?.title || 'User';
        return (
          <Tag className={`rounded-full font-bold border-none px-3 bg-primary/10 text-primary`}>
            {roleTitle}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const conf = statusConfig[status] || { color: 'default', icon: null };
        return (
          <Tag
            icon={conf.icon}
            color={conf.color}
            className="rounded-full font-bold capitalize"
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Skor Terakhir',
      key: 'score',
      align: 'center',
      render: () => <Text className="font-black text-primary">0</Text>,
    },
    {
      title: 'Bergabung',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => <Text className="text-sm text-on-surface/60">{new Date(date).toLocaleDateString()}</Text>,
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

  // We keep some static stats based on total
  const stats = [
    { label: 'Total Pengguna', value: total, icon: <TeamOutlined />, color: 'primary' },
    { label: 'Pengguna Aktif', value: '-', icon: <CheckCircleOutlined />, color: 'green-500' },
    { label: 'Rata-rata Skor', value: 0, icon: <RiseOutlined />, color: 'blue-500' },
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl flex-1 max-w-sm"
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="rounded-xl w-full sm:w-44"
                options={[
                  { value: 'all', label: 'Semua Status' },
                  { value: 'aktif', label: 'Aktif' },
                  { value: 'non-aktif', label: 'Non Aktif' },
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
              rowKey="id"
              loading={loading}
              rowSelection={{
                type: 'checkbox',
                onChange: (keys) => setSelectedRows(keys),
              }}
              pagination={{
                total: total,
                current: currentPage,
                pageSize: perPage,
                showSizeChanger: true,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPerPage(size);
                },
                showTotal: (t) => `Total ${t} pengguna`
              }}
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
