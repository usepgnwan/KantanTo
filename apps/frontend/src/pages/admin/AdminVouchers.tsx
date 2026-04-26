import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Card, Table, Button, Tag, Typography, Space, Modal,
  Form, Input, InputNumber, DatePicker, Select, message,
  Row, Col, Progress
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  PlusOutlined,
  PercentageOutlined,
  DeleteOutlined,
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
  SafetyOutlined,
  SearchOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Voucher {
  key: string;
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  limit: number;
  used: number;
  expiryDate: string;
  status: 'active' | 'expired' | 'finished';
}

interface VoucherUsage {
  id: string;
  orderId: string;
  user: string;
  package: string;
  amount: number;
  date: string;
}

const initialVouchers: Voucher[] = [
  { key: '1', code: 'PROMOSI20', type: 'percentage', value: 20, limit: 100, used: 45, expiryDate: '2026-12-31', status: 'active' },
  { key: '2', code: 'DISKONMABA', type: 'fixed', value: 15000, limit: 50, used: 50, expiryDate: '2026-05-20', status: 'finished' },
  { key: '3', code: 'BOLOSBELAJAR', type: 'percentage', value: 15, limit: 200, used: 12, expiryDate: '2026-04-01', status: 'expired' },
];

const mockUsage: Record<string, VoucherUsage[]> = {
  '1': [
    { id: 'u1', orderId: 'KTN-1012', user: 'Arief Kurniawan', package: 'Saintek Pro', amount: 60000, date: '2026-04-22 10:15' },
    { id: 'u2', orderId: 'KTN-1025', user: 'Budi Santoso', package: 'Saintek Pro', amount: 60000, date: '2026-04-23 14:20' },
  ],
  '2': [
    { id: 'u3', orderId: 'KTN-1050', user: 'Diana Fitri', package: 'Tryout Akbar', amount: 10000, date: '2026-04-24 09:12' },
  ]
};

const AdminVouchers: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Voucher | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditTarget(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (v: Voucher) => {
    setEditTarget(v);
    form.setFieldsValue({
      ...v,
      expiryDate: dayjs(v.expiryDate),
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const vals = await form.validateFields();
    const formattedVals = {
      ...vals,
      expiryDate: vals.expiryDate.format('YYYY-MM-DD'),
    };

    if (editTarget) {
      setVouchers(vouchers.map(v => v.key === editTarget.key ? { ...v, ...formattedVals } : v));
      message.success('Voucher diperbarui');
    } else {
      const newV: Voucher = {
        key: String(Date.now()),
        used: 0,
        status: 'active',
        ...formattedVals,
      };
      setVouchers([...vouchers, newV]);
      message.success('Voucher baru berhasil dibuat');
    }
    setModalOpen(false);
  };

  const columns: TableColumnsType<Voucher> = [
    {
      title: 'Kode Voucher',
      dataIndex: 'code',
      key: 'code',
      render: (code) => (
        <Space>
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <PercentageOutlined className="text-orange-500" />
          </div>
          <Text className="font-black font-mono text-sm tracking-widest text-primary">{code}</Text>
        </Space>
      ),
    },
    {
      title: 'Potongan',
      key: 'value',
      render: (_, r) => (
        <span className="font-bold text-on-surface">
          {r.type === 'percentage' ? `${r.value}%` : `Rp ${r.value.toLocaleString('id-ID')}`}
        </span>
      )
    },
    {
      title: 'Penggunaan',
      key: 'usage',
      render: (_, r) => (
        <div className="w-40">
          <div className="flex justify-between mb-1">
            <Text className="text-[10px] font-bold text-on-surface/40 uppercase tracking-tighter">{r.used} / {r.limit} Terpakai</Text>
          </div>
          <Progress
            percent={Math.round((r.used / r.limit) * 100)}
            size="small"
            strokeColor={r.used >= r.limit ? '#ff4d4f' : '#3b82f6'}
            showInfo={false}
            className="m-0"
          />
        </div>
      )
    },
    {
      title: 'Berlaku Hingga',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date) => (
        <Space className="text-on-surface/60">
          <CalendarOutlined className="text-xs" />
          <span className="text-xs font-medium">{dayjs(date).format('DD MMM YYYY')}</span>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: Voucher['status']) => {
        const colors: Record<Voucher['status'], string> = { active: 'green', expired: 'red', finished: 'orange' };
        const labels: Record<Voucher['status'], string> = { active: 'Aktif', expired: 'Kadaluarsa', finished: 'Limit Habis' };
        return <Tag color={colors[status]} className="rounded-full font-bold px-3">{labels[status]}</Tag>;
      }
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<HistoryOutlined />} 
            onClick={() => { setSelectedVoucher(record); setHistoryOpen(true); }} 
            type="text" 
            className="text-orange-500"
          />
          <Button icon={<EditOutlined />} onClick={() => openEdit(record)} type="text" className="text-primary" />
          <Button icon={<DeleteOutlined />} danger type="text" onClick={() => setVouchers(vouchers.filter(v => v.key !== record.key))} />
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <Text className="text-[10px] uppercase font-black tracking-widest text-primary/60 block mb-1">Marketing Tools</Text>
              <Title level={1} className="!text-3xl !font-manrope !font-black !m-0">Voucher & Promo</Title>
              <Text className="text-on-surface/50 text-sm">Kelola kode kupon diskon untuk meningkatkan konversi penjualan</Text>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={openCreate}
              className="mt-4 sm:mt-0 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
            >
              Tambah Voucher
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <Card className="rounded-[2rem] border-none shadow-sm bg-white p-2">
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <SafetyOutlined className="text-blue-500 text-xl" />
                </div>
                <div>
                  <Title level={4} className="!m-0 !font-black">{vouchers.filter(v => v.status === 'active').length}</Title>
                  <Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Voucher Aktif</Text>
                </div>
              </div>
            </Card>
            <Card className="rounded-[2rem] border-none shadow-sm bg-white p-2">
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                  <UserOutlined className="text-orange-500 text-xl" />
                </div>
                <div>
                  <Title level={4} className="!m-0 !font-black">{vouchers.reduce((a, v) => a + v.used, 0)}</Title>
                  <Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Total Digunakan</Text>
                </div>
              </div>
            </Card>
            <Card className="rounded-[2rem] border-none shadow-sm bg-white p-2">
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                  <CalendarOutlined className="text-red-500 text-xl" />
                </div>
                <div>
                  <Title level={4} className="!m-0 !font-black">{vouchers.filter(v => v.status === 'expired').length}</Title>
                  <Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">Voucher Hangus</Text>
                </div>
              </div>
            </Card>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-md overflow-hidden bg-white p-0">
            <div className="p-4 border-b border-on-surface/5">
              <Input
                prefix={<SearchOutlined className="opacity-20" />}
                placeholder="Cari kode voucher..."
                className="max-w-xs rounded-xl"
              />
            </div>
            <Table
              columns={columns}
              dataSource={vouchers}
              pagination={{ pageSize: 10 }}
              className="weightless-table"
            />
          </Card>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        title={
          <div className="flex items-center gap-2 font-black py-2">
            <PercentageOutlined className="text-primary" />
            <span>{editTarget ? 'Edit Voucher' : 'Buat Voucher Baru'}</span>
          </div>
        }
        okText="Simpan Voucher"
        cancelText="Batal"
        width={500}
        centered
        okButtonProps={{ className: 'rounded-xl h-11 px-8 font-bold' }}
        cancelButtonProps={{ className: 'rounded-xl h-11 px-8' }}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="code" label={<span className="font-bold text-sm">Kode Voucher</span>} rules={[{ required: true }]}>
            <Input placeholder="Cth: MERDEKA78" className="h-12 rounded-xl text-lg font-black font-mono tracking-widest uppercase" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label={<span className="font-bold text-sm">Tipe Potongan</span>} rules={[{ required: true }]}>
                <Select className="h-12 w-full rounded-xl" options={[
                  { value: 'percentage', label: 'Persentase (%)' },
                  { value: 'fixed', label: 'Nilai Tetap (Rp)' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="value" label={<span className="font-bold text-sm">Besar Potongan</span>} rules={[{ required: true }]}>
                <InputNumber className="h-12 w-full rounded-xl flex items-center" min={0} placeholder="Cth: 20" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="limit" label={<span className="font-bold text-sm">Limit Penggunaan</span>} rules={[{ required: true }]}>
                <InputNumber className="h-12 w-full rounded-xl flex items-center" min={1} placeholder="Cth: 100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiryDate" label={<span className="font-bold text-sm">Tanggal Kadaluarsa</span>} rules={[{ required: true }]}>
                <DatePicker className="h-12 w-full rounded-xl" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Usage History Modal */}
      <Modal
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={null}
        width={700}
        title={
          <div className="flex items-center gap-2 py-2">
            <HistoryOutlined className="text-primary" />
            <span>Riwayat Penggunaan Voucher: <Text code>{selectedVoucher?.code}</Text></span>
          </div>
        }
      >
        <Table
          dataSource={selectedVoucher ? (mockUsage[selectedVoucher.key] || []) : []}
          pagination={{ pageSize: 5 }}
          className="weightless-table"
          columns={[
            { title: 'Order ID', dataIndex: 'orderId', key: 'orderID', render: (id) => <Text className="font-mono font-bold text-primary">{id}</Text> },
            { title: 'Pengguna', dataIndex: 'user', key: 'user', render: (u) => <Text className="font-bold">{u}</Text> },
            { title: 'Paket', dataIndex: 'package', key: 'package' },
            { title: 'Nominal Akhir', dataIndex: 'amount', key: 'amount', render: (a) => <Text className="font-black">Rp {a.toLocaleString('id-ID')}</Text> },
            { title: 'Waktu', dataIndex: 'date', key: 'date', render: (d) => <Text className="text-xs text-on-surface/40">{d}</Text> },
          ]}
        />
      </Modal>
    </AdminLayout>
  );
};

export default AdminVouchers;
