import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Card, Typography, Modal, Input, Space, message, Breadcrumb, Popconfirm, Tag, Tooltip } from 'antd';
import { DeleteOutlined, SearchOutlined, MailOutlined, MailFilled, EyeOutlined } from '@ant-design/icons';
import AdminLayout from '../../layouts/AdminLayout';
import { getContactMessages, getContactMessageById, deleteContactMessage, ContactMessage } from '../../services/contactMessageService';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const AdminContactMessages: React.FC = () => {
  const [data, setData] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getContactMessages(currentPage, perPage, searchQuery);
      setData(response.rows);
      setTotal(response.total);
    } catch (error) {
      message.error('Gagal mengambil data pesan masuk');
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

  const handleRead = async (record: ContactMessage) => {
    try {
      // Fetch details which also marks as read in backend
      const detail = await getContactMessageById(record.id);
      setSelectedMessage(detail);
      setIsModalOpen(true);
      
      // Update local state to reflect as read without refetching all
      if (!record.is_read) {
        setData(prev => prev.map(item => item.id === record.id ? { ...item, is_read: true } : item));
      }
    } catch (error) {
      message.error('Gagal mengambil detail pesan');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteContactMessage(id);
      message.success('Pesan berhasil dihapus');
      fetchData();
    } catch (error) {
      message.error('Gagal menghapus pesan');
    }
  };

  const columns = [
    {
      title: 'Status',
      key: 'status',
      width: 80,
      render: (_: any, record: ContactMessage) => (
        record.is_read ? 
        <Tooltip title="Sudah Dibaca"><MailOutlined className="text-gray-400 text-lg" /></Tooltip> : 
        <Tooltip title="Belum Dibaca"><MailFilled className="text-primary text-lg" /></Tooltip>
      ),
    },
    {
      title: 'Pengirim',
      key: 'sender',
      render: (_: any, record: ContactMessage) => (
        <div>
          <Text className={`block text-sm ${!record.is_read ? 'font-black' : 'font-semibold'} text-on-surface`}>{record.name}</Text>
          <Text className="text-xs text-on-surface/60">{record.email}</Text>
        </div>
      ),
    },
    {
      title: 'Subjek',
      dataIndex: 'subject',
      key: 'subject',
      render: (text: string, record: ContactMessage) => (
        <Text className={`text-sm ${!record.is_read ? 'font-bold' : ''}`}>{text}</Text>
      ),
    },
    {
      title: 'Tanggal',
      key: 'date',
      render: (_: any, record: ContactMessage) => (
        <Text className="text-xs text-on-surface/60">{dayjs(record.created_at).format('DD MMM YYYY, HH:mm')}</Text>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: ContactMessage) => (
        <Space size="small">
          <Tooltip title="Baca Pesan">
            <Button type="text" icon={<EyeOutlined className="text-primary" />} onClick={() => handleRead(record)} />
          </Tooltip>
          <Popconfirm
            title="Hapus Pesan"
            description="Tindakan ini tidak dapat dibatalkan, ingin menghapus?"
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
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 text-center sm:text-left">
            <div>
              <Breadcrumb 
                items={[{ title: 'Komunikasi' }, { title: 'Pesan Masuk' }]}
                className="mb-2 uppercase text-[10px] font-black tracking-widest opacity-40 justify-center sm:justify-start"
              />
              <Title level={2} className="!m-0 !font-manrope !font-black !text-2xl dark:text-zinc-100 flex items-center gap-3 justify-center sm:justify-start">
                <MailOutlined className="text-primary" /> Pesan Masuk
              </Title>
            </div>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-900 p-2 sm:p-6">
            <div className="mb-6 px-2 flex items-center justify-between">
               <Input 
                 placeholder="Cari nama, email, atau subjek..." 
                 prefix={<SearchOutlined className="text-on-surface/20" />}
                 className="max-w-md rounded-xl h-11 bg-surface-low border-none shadow-none"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 allowClear
               />
               <Text className="hidden sm:block text-[10px] uppercase font-black tracking-widest text-on-surface/30">Total: {total} Pesan</Text>
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
              rowClassName={(record) => !record.is_read ? 'bg-primary/5' : ''}
            />
          </Card>
        </div>
      </div>

      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={
          <div className="flex justify-end pt-4">
            <Button type="primary" onClick={() => setIsModalOpen(false)} className="rounded-xl h-10 font-bold px-8">Tutup</Button>
          </div>
        }
        width={600}
        centered
        className="[&_.ant-modal-content]:rounded-[2rem] [&_.ant-modal-content]:p-8"
      >
        {selectedMessage && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl">
                <MailOutlined />
              </div>
              <div>
                <Title level={4} className="!m-0 !font-manrope !font-black">{selectedMessage.subject}</Title>
                <Text className="text-xs text-on-surface/60">{dayjs(selectedMessage.created_at).format('DD MMMM YYYY, HH:mm')}</Text>
              </div>
            </div>
            
            <div className="bg-surface-low/50 rounded-2xl p-4 mb-6">
              <div className="mb-2">
                <Text className="text-xs uppercase font-bold tracking-widest text-on-surface/40 block mb-1">Dari</Text>
                <Text className="font-semibold block">{selectedMessage.name}</Text>
                <Text className="text-primary">{selectedMessage.email}</Text>
              </div>
            </div>
            
            <div className="mb-2">
              <Text className="text-xs uppercase font-bold tracking-widest text-on-surface/40 block mb-2">Pesan</Text>
              <Paragraph className="text-on-surface/80 whitespace-pre-wrap leading-relaxed">
                {selectedMessage.message}
              </Paragraph>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default AdminContactMessages;
