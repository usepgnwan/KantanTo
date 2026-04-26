import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Card, Typography, Modal, Form, Input, Space, message, Breadcrumb, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import AdminLayout from '../../layouts/AdminLayout';
import { getRoles, createRole, updateRole, deleteRole, Role } from '../../services/roleService';

const { Title, Text } = Typography;

const AdminRoles: React.FC = () => {
  const [data, setData] = useState<Role[]>([]);
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
      const response = await getRoles(currentPage, perPage, searchQuery);
      setData(response.rows);
      setTotal(response.total);
    } catch (error) {
      message.error('Gagal mengambil data role');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchQuery]);

  useEffect(() => {
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

  const handleEdit = (record: Role) => {
    setEditingId(record.id);
    form.setFieldsValue({
      title: record.title,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id);
      message.success('Role berhasil dihapus');
      fetchData();
    } catch (error) {
      message.error('Gagal menghapus role');
    }
  };

  const onFinish = async (values: any) => {
    const payload = { title: values.title };
    try {
      if (editingId) {
        await updateRole(editingId, payload);
        message.success('Data role diperbarui');
      } else {
        await createRole(payload);
        message.success('Role baru ditambahkan');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('Gagal menyimpan perubahan');
    }
  };

  const columns = [
    {
      title: 'Nama Role',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text className="font-black text-on-surface text-base">{text}</Text>,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: Role) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined className="text-primary" />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Hapus Role"
            description="Tindakan ini tidak dapat dibatalkan. Hapus role ini?"
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
        <div className="max-w-4xl mx-auto px-4 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 text-center sm:text-left">
            <div>
              <Breadcrumb 
                items={[{ title: 'Pengaturan Sistem' }, { title: 'Manajemen Role' }]}
                className="mb-2 uppercase text-[10px] font-black tracking-widest opacity-40 justify-center sm:justify-start"
              />
              <Title level={2} className="!m-0 !font-manrope !font-black !text-2xl dark:text-zinc-100 flex items-center gap-3 justify-center sm:justify-start">
                <SafetyCertificateOutlined className="text-primary" /> Manajemen Role
              </Title>
            </div>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAdd} className="rounded-2xl h-12 px-8 font-black shadow-xl shadow-primary/20">
              Buat Role Khusus
            </Button>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-900 p-2 sm:p-6">
            <div className="mb-6 px-2 flex items-center justify-between">
               <Input 
                 placeholder="Cari Role..." 
                 prefix={<SearchOutlined className="text-on-surface/20" />}
                 className="max-w-xs rounded-xl h-11 bg-surface-low border-none shadow-none"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
               <Text className="hidden sm:block text-[10px] uppercase font-black tracking-widest text-on-surface/30">Total: {total} Rekord</Text>
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
              className="kantan-table-large"
            />
          </Card>
        </div>
      </div>

      <Modal
        title={<Title level={4} className="!m-0 !font-manrope !font-black">{editingId ? 'Edit Akses Role' : 'Role Akses Baru'}</Title>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={400}
        centered
      >
        <Form form={form} layout="vertical" onFinish={onFinish} className="mt-6">
          <Form.Item name="title" label={<Text className="font-bold text-xs uppercase opacity-50">Nama Role</Text>} rules={[{ required: true }]}>
            <Input placeholder="Cth: Student, Staff, dll" className="h-11 rounded-xl" />
          </Form.Item>
          <div className="flex gap-3 mt-8">
            <Button block className="h-11 rounded-xl font-bold" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button block type="primary" htmlType="submit" className="h-11 rounded-xl font-bold shadow-lg shadow-primary/20">Simpan Detail</Button>
          </div>
        </Form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminRoles;
