import React, { useState } from 'react';
import { Table, Button, Card, Typography, Modal, Form, Input, Space, Tag, message, Breadcrumb } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, BankOutlined } from '@ant-design/icons';
import AdminLayout from '../../layouts/AdminLayout';

const { Title, Text } = Typography;

interface ClassData {
  key: string;
  title: string;
  description: string;
  packagesCount: number;
}

const AdminClasses: React.FC = () => {
  const [data, setData] = useState<ClassData[]>([
    { key: '1', title: 'Kelas 10', description: 'Materi kurikulum merdeka untuk siswa kelas 10 SMA', packagesCount: 15 },
    { key: '2', title: 'Kelas 11', description: 'Persiapan kenaikan kelas dan pemantapan materi', packagesCount: 22 },
    { key: '3', title: 'Kelas 12', description: 'Fokus persiapan kelulusan dan ujian masuk PTN', packagesCount: 45 },
    { key: '4', title: 'Alumni / Gap Year', description: 'Program intensif bagi lulusan SMA/SMK', packagesCount: 30 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: ClassData) => {
    setEditingKey(record.key);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (key: string) => {
    Modal.confirm({
      title: 'Hapus Tingkat Kelas?',
      content: 'Tindakan ini akan mempengaruhi filter pada paket soal terkait.',
      okText: 'Hapus',
      okType: 'danger',
      onOk: () => {
        setData(data.filter(item => item.key !== key));
        message.success('Kelas berhasil dihapus');
      }
    });
  };

  const onFinish = (values: any) => {
    if (editingKey) {
      setData(data.map(item => item.key === editingKey ? { ...item, ...values } : item));
      message.success('Data kelas diperbarui');
    } else {
      setData([...data, { key: Date.now().toString(), ...values, packagesCount: 0 }]);
      message.success('Tingkat kelas baru ditambahkan');
    }
    setIsModalOpen(false);
  };

  const columns = [
    {
      title: 'Tingkat Kelas',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text className="font-black text-on-surface text-base">{text}</Text>,
    },
    {
      title: 'Deskripsi Cakupan',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text className="text-on-surface/50 text-xs italic">{text}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'packagesCount',
      key: 'status',
      render: (count: number) => (
        <Space>
           <Tag color={count > 0 ? 'green' : 'default'} className="rounded-lg border-none font-bold">
              {count > 0 ? 'Aktif' : 'Draft'}
           </Tag>
           <Text className="text-[10px] uppercase font-black text-on-surface/20">{count} Konten</Text>
        </Space>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: ClassData) => (
        <Space size="small">
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
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 text-center sm:text-left">
            <div>
              <Breadcrumb 
                items={[{ title: 'Master Data' }, { title: 'Tingkat Kelas' }]}
                className="mb-2 uppercase text-[10px] font-black tracking-widest opacity-40 justify-center sm:justify-start"
              />
              <Title level={2} className="!m-0 !font-manrope !font-black !text-2xl dark:text-zinc-100 flex items-center gap-3 justify-center sm:justify-start">
                <BankOutlined className="text-primary" /> Management Kelas
              </Title>
            </div>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAdd} className="rounded-2xl h-12 px-8 font-black shadow-xl shadow-primary/20">
              Buat Kelas
            </Button>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-900 p-2 sm:p-6">
            <div className="mb-6 px-2 flex items-center justify-between">
               <Input 
                 placeholder="Cari..." 
                 prefix={<SearchOutlined className="text-on-surface/20" />}
                 className="max-w-xs rounded-xl h-11 bg-surface-low border-none shadow-none"
               />
               <Text className="hidden sm:block text-[10px] uppercase font-black tracking-widest text-on-surface/30">Master Record: {data.length}</Text>
            </div>
            
            <Table 
              columns={columns} 
              dataSource={data} 
              pagination={{ pageSize: 8 }}
              className="kantan-table-large"
            />
          </Card>
        </div>
      </div>

      <Modal
        title={<Title level={4} className="!m-0 !font-manrope !font-black">Pengaturan Kelas</Title>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={400}
        centered
      >
        <Form form={form} layout="vertical" onFinish={onFinish} className="mt-6">
          <Form.Item name="title" label={<Text className="font-bold text-xs uppercase opacity-50">Label Kelas</Text>} rules={[{ required: true }]}>
            <Input placeholder="Cth: Kelas 12 SMA" className="h-11 rounded-xl" />
          </Form.Item>
          <Form.Item name="description" label={<Text className="font-bold text-xs uppercase opacity-50">Keterangan</Text>}>
            <Input.TextArea rows={3} placeholder="Deskripsi singkat..." className="rounded-xl" />
          </Form.Item>
          <div className="flex gap-3 mt-8">
            <Button block className="h-11 rounded-xl font-bold" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button block type="primary" htmlType="submit" className="h-11 rounded-xl font-bold shadow-lg shadow-primary/20">Simpan</Button>
          </div>
        </Form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminClasses;
