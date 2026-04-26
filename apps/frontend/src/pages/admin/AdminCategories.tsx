import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Card, Typography, Modal, Form, Input, Space, Tag, message, Breadcrumb, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import AdminLayout from '../../layouts/AdminLayout';
import { getCategories, createCategory, updateCategory, deleteCategory, Category } from '../../services/categoryService';

const { Title, Text } = Typography;

const AdminCategories: React.FC = () => {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCategories(currentPage, perPage, searchQuery);
      setData(response.rows); 
      setTotal(response.total); 
    } catch (error) {
      message.error('Gagal mengambil data kategori');
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

  const handleEdit = (record: Category) => {
    setEditingId(record.id);
    form.setFieldsValue({
      title: record.title,
      description: record.deskripsi,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      message.success('Kategori berhasil dihapus');
      fetchData();
    } catch (error) {
      message.error('Gagal menghapus kategori');
    }
  };

  const onFinish = async (values: any) => {
    const payload = { title: values.title, deskripsi: values.description };
    try {
      if (editingId) {
        await updateCategory(editingId, payload);
        message.success('Kategori diperbarui');
      } else {
        await createCategory(payload);
        message.success('Kategori baru ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('Gagal menyimpan perubahan');
    }
  };

  const columns = [
    {
      title: 'Nama Kategori',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text className="font-bold text-on-surface">{text}</Text>,
    },
    {
      title: 'Deskripsi',
      dataIndex: 'deskripsi',
      key: 'deskripsi',
      ellipsis: true,
      render: (text: string) => <Text className="text-on-surface/60 text-xs">{text || 'Tidak ada deskripsi'}</Text>,
    },
    {
      title: 'Total Paket',
      key: 'count',
      render: () => <Tag color="blue" className="rounded-lg font-bold border-none">0 Paket</Tag>,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      render: (_: any, record: Category) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined className="text-primary" />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Hapus Kategori"
            description="Apakah Anda yakin ingin menghapus kategori ini secara permanen?"
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

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <Breadcrumb
                items={[
                  { title: 'Master Data' },
                  { title: 'Kategori' },
                ]}
                className="mb-2 uppercase text-[10px] font-black tracking-widest opacity-40"
              />
              <Title level={2} className="!m-0 !font-manrope !font-black !text-2xl dark:text-zinc-100 flex items-center gap-3">
                <AppstoreOutlined className="text-primary" /> Kelola Kategori
              </Title>
            </div>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAdd} className="rounded-2xl h-12 px-6 font-black shadow-lg shadow-primary/20">
              Tambah Kategori
            </Button>
          </div>

          {/* Table Card */}
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <Input
                placeholder="Cari kategori..."
                prefix={<SearchOutlined className="text-on-surface/20" />}
                className="max-w-xs rounded-xl h-10 bg-surface-low border-none shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Text className="text-[10px] uppercase font-black tracking-widest text-on-surface/30">Total {total} Kategori</Text>
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

      {/* Modal Add/Edit */}
      <Modal
        title={<Title level={4} className="!m-0 !font-manrope !font-black">{editingId ? 'Edit Kategori' : 'Kategori Baru'}</Title>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={480}
        centered
        className="rounded-3xl overflow-hidden"
      >
        <Form form={form} layout="vertical" onFinish={onFinish} className="mt-6">
          <Form.Item
            name="title"
            label={<Text className="font-bold text-xs uppercase tracking-widest opacity-50">Nama Kategori</Text>}
            rules={[{ required: true, message: 'Harap isi nama kategori' }]}
          >
            <Input placeholder="Cth: Kedinasan" className="h-11 rounded-xl" />
          </Form.Item>
          <Form.Item
            name="description"
            label={<Text className="font-bold text-xs uppercase tracking-widest opacity-50">Deskripsi</Text>}
          >
            <Input.TextArea rows={4} placeholder="Jelaskan kategori ini..." className="rounded-xl p-3" />
          </Form.Item>
          <Form.Item className="mb-0 mt-8">
            <div className="flex gap-3">
              <Button block className="h-12 rounded-xl font-bold" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button block type="primary" htmlType="submit" className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                {editingId ? 'Simpan Perubahan' : 'Tambah Kategori'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout >
  );
};

export default AdminCategories;
