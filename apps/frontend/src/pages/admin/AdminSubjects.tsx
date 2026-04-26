import React, { useState } from 'react';
import { Table, Button, Card, Typography, Modal, Form, Input, Space, Avatar, message, Breadcrumb } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReadOutlined } from '@ant-design/icons';
import AdminLayout from '../../layouts/AdminLayout';

const { Title, Text } = Typography;

interface SubjectData {
  key: string;
  title: string;
  description: string;
  color: string;
}

const AdminSubjects: React.FC = () => {
  const [data, setData] = useState<SubjectData[]>([
    { key: '1', title: 'Matematika', description: 'Logika matematika, kalkulus, dan statistika', color: '#1890ff' },
    { key: '2', title: 'Bahasa Indonesia', description: 'Pemahaman bacaan dan menulis', color: '#f5222d' },
    { key: '3', title: 'Bahasa Inggris', description: 'Literacy and structure', color: '#52c41a' },
    { key: '4', title: 'Fisika', description: 'Mekanika, termodinamika, dan optik', color: '#722ed1' },
    { key: '5', title: 'Penalaran Umum', description: 'Logika deduktif dan induktif', color: '#faad14' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: SubjectData) => {
    setEditingKey(record.key);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const onFinish = (values: any) => {
    if (editingKey) {
      setData(data.map(item => item.key === editingKey ? { ...item, ...values } : item));
      message.success('Mata pelajaran diperbarui');
    } else {
      setData([...data, { key: Date.now().toString(), ...values, color: '#1677ff' }]);
      message.success('Mata pelajaran ditambahkan');
    }
    setIsModalOpen(false);
  };

  const columns = [
    {
      title: 'Mata Pelajaran',
      key: 'subject',
      render: (_: any, record: SubjectData) => (
        <Space size="middle">
          <Avatar 
            shape="square" 
            size={40} 
            style={{ backgroundColor: record.color + '20', color: record.color }}
            className="rounded-xl font-black border-none"
          >
            {record.title[0]}
          </Avatar>
          <div>
            <Text className="font-bold block text-on-surface">{record.title}</Text>
            <Text className="text-[10px] text-on-surface/40 uppercase font-black tracking-widest">{record.key.length > 5 ? 'Custom' : 'Core System'}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Cakupan Materi',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text className="text-on-surface/60 text-xs">{text}</Text>,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: SubjectData) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined className="text-primary" />} onClick={() => handleEdit(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => {
            setData(data.filter(i => i.key !== record.key));
            message.success('Mata pelajaran dihapus');
          }} />
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
               />
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            
            <Table 
              columns={columns} 
              dataSource={data} 
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
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
