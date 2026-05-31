import React, { useState, useEffect } from 'react';
import { Typography, Tabs, Table, Input, Button, Tag, Space, message } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { getAdminExamSessions } from '../../services/packageService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AdminLayout from '../../layouts/AdminLayout';

const { Title, Text } = Typography;

const AdminExamHistory: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('user');
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const limit = 10;

  const fetchSessions = async (isTesting: boolean, currentPage: number, searchQuery: string) => {
    setLoading(true);
    try {
      const res = await getAdminExamSessions(isTesting, currentPage, limit, searchQuery);
      setData(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      message.error('Gagal memuat data riwayat ujian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isTesting = activeTab === 'testing';
    fetchSessions(isTesting, page, search);
  }, [activeTab, page]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    const isTesting = activeTab === 'testing';
    fetchSessions(isTesting, 1, value);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
    setSearch('');
  };

  const columns = [
    {
      title: 'Nama Peserta',
      dataIndex: ['user', 'nama'],
      key: 'nama',
      render: (text: string, record: any) => (
        <div>
          <Text className="font-bold">{text || 'Unknown'}</Text>
          <br />
          <Text type="secondary" className="text-xs">{record.user?.email}</Text>
        </div>
      ),
    },
    {
      title: 'Paket / Ujian',
      dataIndex: ['package', 'title'],
      key: 'package',
      render: (text: string) => <Text className="font-medium">{text || '-'}</Text>,
    },
    {
      title: 'Skor Akhir',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Tag color="blue" className="font-bold rounded-full px-3">
          {score}
        </Tag>
      ),
    },
    {
      title: 'Selesai Pada',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <Text>{dayjs(date).format('DD MMM YYYY, HH:mm')}</Text>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="primary" 
          ghost 
          icon={<EyeOutlined />} 
          onClick={() => navigate(`/riwayat/${record.id}/review`)}
        >
          Detail
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <Title level={3} className="!mb-1 !font-black !font-manrope text-on-surface">Riwayat Ujian</Title>
              <Text className="text-on-surface/60">Daftar lengkap hasil pengerjaan simulasi ujian</Text>
            </div>
            <Input.Search
              placeholder="Cari nama atau email..."
              allowClear
              onSearch={handleSearch}
              style={{ width: 300 }}
              size="large"
              className="shadow-sm rounded-xl"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-surface-container p-6">
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              items={[
                { key: 'user', label: 'Riwayat Peserta (Real)' },
                { key: 'testing', label: 'Testing Admin' },
              ]}
            />

            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={loading}
              pagination={{
                current: page,
                pageSize: limit,
                total: total,
                onChange: (p) => setPage(p),
                showSizeChanger: false,
              }}
              className="mt-4"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminExamHistory;
