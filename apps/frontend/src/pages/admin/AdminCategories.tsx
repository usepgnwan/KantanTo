import React, { useState } from 'react';
import { Table, Button, Card, Typography, Modal, Form, Input, Space, Tag, message, Breadcrumb } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import AdminLayout from '../../layouts/AdminLayout';

const { Title, Text } = Typography;

interface CategoryData {
  key: string;
  title: string;
  description: string;
  count: number; // e.g. how many packages use this
}

const AdminCategories: React.FC = () => {
  const [data, setData] = useState<CategoryData[]>([
    { key: '1', title: 'Kedinasan', description: 'Persiapan ujian masuk sekolah kedinasan (IPDN, STIS, dll)', count: 12 },
    { key: '2', title: 'UTBK-SNBT', description: 'Seleksi Nasional Berdasarkan Tes untuk PTN', count: 25 },
    { key: '3', title: 'CPNS', description: 'Seleksi Calon Pegawai Negeri Sipil', count: 8 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: CategoryData) => {
    setEditingKey(record.key);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (key: string) => {
    Modal.confirm({
      title: 'Hapus Kategori?',
      content: 'Tindakan ini tidak dapat dibatalkan.',
      okText: 'Hapus',
      okType: 'danger',
      onOk: () => {
        setData(data.filter(item => item.key !== key));
        message.success('Kategori berhasil dihapus');
      }
    });
  };

  const onFinish = (values: any) => {
    if (editingKey) {
      setData(data.map(item => item.key === editingKey ? { ...item, ...values } : item));
      message.success('Kategori diperbarui');
    } else {
      const newEntry = {
        key: Date.now().toString(),
        ...values,
        count: 0
      };
      setData([...data, newEntry]);
      message.success('Kategori baru ditambahkan');
    }
    setIsModalOpen(false);
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
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => <Text className="text-on-surface/60 text-xs">{text}</Text>,
    },
    {
      title: 'Total Paket',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => <Tag color="blue" className="rounded-lg font-bold border-none">{count} Paket</Tag>,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      render: (_: any, record: CategoryData) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined className="text-primary" />} onClick={() => handleEdit(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.key)} />
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
              />
              <Text className="text-[10px] uppercase font-black tracking-widest text-on-surface/30">Total {data.length} Kategori</Text>
            </div>

            <Table
              columns={columns}
              dataSource={data}
              pagination={{ pageSize: 8, hideOnSinglePage: true }}
              className="kantan-table"
            />
          </Card>
        </div>
      </div>

      {/* Modal Add/Edit */}
      <Modal
        title={<Title level={4} className="!m-0 !font-manrope !font-black">{editingKey ? 'Edit Kategori' : 'Kategori Baru'}</Title>}
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
                {editingKey ? 'Simpan Perubahan' : 'Tambah Kategori'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </AdminLayout >
  );
};

export default AdminCategories;
