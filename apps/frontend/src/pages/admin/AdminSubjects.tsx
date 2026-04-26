import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Card, Typography, Modal, Form, Input, Space, Avatar, message, Breadcrumb, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReadOutlined } from '@ant-design/icons';
import AdminLayout from '../../layouts/AdminLayout';
import { getMapels, createMapel, updateMapel, deleteMapel, Mapel } from '../../services/mapelService';

const { Title, Text } = Typography;

const AdminSubjects: React.FC = () => {
  const [data, setData] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  // Color generator based on title string (for consistent UX color mapping)
  const getRandomColor = (title: string) => {
    const colors = ['#1890ff', '#f5222d', '#52c41a', '#722ed1', '#faad14'];
    let hash = 0;
    for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMapels(currentPage, perPage, searchQuery);
      setData(response.rows); // Membaca properti rows dari JSON
      setTotal(response.total); // Membaca properti total dari JSON
    } catch (error) {
      message.error('Gagal mengambil data mata pelajaran');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchQuery]);

  useEffect(() => {
    // Debounce search query effect
    const timeout = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timeout);
  }, [fetchData, searchQuery]);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: Mapel) => {
    setEditingId(record.id);
    form.setFieldsValue({
      title: record.title,
      description: record.deskripsi,
    });
    setIsModalOpen(true);
  };

  const onFinish = async (values: any) => {
    const payload = { title: values.title, deskripsi: values.description };
    try {
      if (editingId) {
        await updateMapel(editingId, payload);
        message.success('Mata pelajaran diperbarui');
      } else {
        await createMapel(payload);
        message.success('Mata pelajaran ditambahkan');
      }
      setIsModalOpen(false);
      fetchData(); // refresh list
    } catch (error) {
      message.error('Gagal menyimpan perubahan');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMapel(id);
      message.success('Mata pelajaran dihapus');
      // Jika hapus di page 2 dan data habis, table antd biasanya akan panggil onChange, tapi kita refresh saja.
      fetchData();
    } catch (error) {
      message.error('Gagal menghapus data');
    }
  };

  const columns = [
    {
      title: 'Mata Pelajaran',
      key: 'subject',
      render: (_: any, record: Mapel) => {
        const color = getRandomColor(record.title);
        return (
          <Space size="middle">
            <Avatar 
              shape="square" 
              size={40} 
              style={{ backgroundColor: color + '20', color: color }}
              className="rounded-xl font-black border-none"
            >
              {record.title ? record.title[0].toUpperCase() : '-'}
            </Avatar>
            <div>
              <Text className="font-bold block text-on-surface">{record.title}</Text>
              <Text className="text-[10px] text-on-surface/40 uppercase font-black tracking-widest">ID: {record.id}</Text>
            </div>
          </Space>
        )
      },
    },
    {
      title: 'Cakupan Materi',
      dataIndex: 'deskripsi',
      key: 'deskripsi',
      render: (text: string) => <Text className="text-on-surface/60 text-xs">{text || 'Tidak ada deskripsi'}</Text>,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: Mapel) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined className="text-primary" />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Hapus Mapel"
            description="Apakah Anda yakin ingin menghapus mapel ini secara permanen?"
            onConfirm={() => handleDelete(record.id)}
            okText="Hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true }}
            placement="bottomRight"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 min-h-full py-10 transition-colors">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <Breadcrumb items={[{ title: 'Master Data' }, { title: 'Mata Pelajaran' }]} className="mb-2 uppercase text-[10px] font-black tracking-widest opacity-40" />
              <Title level={2} className="!m-0 !font-manrope !font-black !text-2xl dark:text-zinc-100 flex items-center gap-3">
                <ReadOutlined className="text-primary" /> Kelola Mapel
              </Title>
            </div>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAdd} className="rounded-2xl h-12 px-6 font-black shadow-lg shadow-primary/20">
              Tambah Mapel
            </Button>
          </div>

          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between px-2">
               <Input 
                 placeholder="Filter mapel..." 
                 prefix={<SearchOutlined className="text-on-surface/20" />}
                 className="max-w-xs rounded-xl h-10 bg-surface-low border-none"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            
            <Table 
              columns={columns} 
              dataSource={data} 
              rowKey="id"
              loading={loading}
              pagination={{ 
                total: total,
                current: currentPage,
                pageSize: perPage,
                onChange: (page, pageSize) => {
                  setCurrentPage(page);
                  setPerPage(pageSize);
                },
                showSizeChanger: true
              }}
              className="kantan-table"
            />
          </Card>
        </div>
      </div>

      <Modal
        title={<Title level={4} className="!m-0 !font-manrope !font-black">Detail Mata Pelajaran</Title>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={450}
        centered
      >
        <Form form={form} layout="vertical" onFinish={onFinish} className="mt-6">
          <Form.Item name="title" label={<Text className="font-bold text-xs uppercase opacity-50">Nama Mata Pelajaran</Text>} rules={[{ required: true }]}>
            <Input placeholder="Cth: Matematika" className="h-11 rounded-xl" />
          </Form.Item>
          <Form.Item name="description" label={<Text className="font-bold text-xs uppercase opacity-50">Keterangan / Sillabus Singkat</Text>}>
            <Input.TextArea rows={4} placeholder="Topik apa saja yang dibahas..." className="rounded-xl" />
          </Form.Item>
          <div className="flex gap-3 mt-8">
            <Button block className="h-12 rounded-xl font-bold" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button block type="primary" htmlType="submit" className="h-12 rounded-xl font-bold">Simpan Mapel</Button>
          </div>
        </Form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminSubjects;
