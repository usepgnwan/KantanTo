import React, { useState, useEffect } from 'react';
import { getVouchers, createVoucher, updateVoucher, deleteVoucher, Voucher, VoucherUsage, getVoucherUsageHistoryAPI } from '../../services/voucherService';
import { getPackages, PackageListItem } from '../../services/packageService';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Card, Table, Button, Tag, Typography, Space, Modal,
  Form, Input, InputNumber, DatePicker, Select, message,
  Row, Col, Progress, Radio, Tooltip
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
  AppstoreOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;



const AdminVouchers: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [packages, setPackages] = useState<PackageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [usageHistory, setUsageHistory] = useState<VoucherUsage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<Voucher | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [packageScope, setPackageScope] = useState<'all' | 'specific'>('all');
  const [form] = Form.useForm();

  const getVoucherStatus = (v: Voucher): 'active' | 'expired' | 'finished' => {
    if (v.used >= v.limit) return 'finished';
    if (dayjs(v.expiryDate).isBefore(dayjs(), 'day')) return 'expired';
    return 'active';
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const data = await getVouchers();
      setVouchers(data);
    } catch (error) {
      message.error('Gagal memuat data voucher');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const pkgs = await getPackages();
      setPackages(pkgs);
    } catch (error) {
      console.error('Gagal memuat daftar paket', error);
    }
  };

  React.useEffect(() => {
    fetchVouchers();
    fetchPackages();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setPackageScope('all');
    form.resetFields();
    form.setFieldsValue({
      packageScope: 'all',
      applicable_package_ids: [],
    });
    setModalOpen(true);
  };

  const openHistory = async (v: Voucher) => {
    setSelectedVoucher(v);
    setHistoryOpen(true);
    if (!v.id) return;
    
    setHistoryLoading(true);
    try {
      const data = await getVoucherUsageHistoryAPI(v.id);
      setUsageHistory(data);
    } catch (error) {
      message.error('Gagal memuat riwayat voucher');
    } finally {
      setHistoryLoading(false);
    }
  };

  const openEdit = (v: Voucher) => {
    setEditTarget(v);
    const hasSpecificPackages = Array.isArray(v.applicable_package_ids) && v.applicable_package_ids.length > 0;
    const scope = hasSpecificPackages ? 'specific' : 'all';
    setPackageScope(scope);
    form.setFieldsValue({
      ...v,
      expiryDate: dayjs(v.expiryDate),
      packageScope: scope,
      applicable_package_ids: hasSpecificPackages ? v.applicable_package_ids : [],
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const vals = await form.validateFields();
      const targetPackageIDs = vals.packageScope === 'specific' ? (vals.applicable_package_ids || []) : [];
      
      if (vals.packageScope === 'specific' && targetPackageIDs.length === 0) {
        message.warning('Pilih minimal satu paket yang berlaku');
        return;
      }

      const formattedVals = {
        code: vals.code,
        type: vals.type,
        value: vals.value,
        limit: vals.limit,
        expiryDate: vals.expiryDate.format('YYYY-MM-DD'),
        applicable_package_ids: targetPackageIDs,
      };

      if (editTarget && editTarget.id) {
        await updateVoucher(editTarget.id, formattedVals);
        message.success('Voucher diperbarui');
      } else {
        await createVoucher(formattedVals);
        message.success('Voucher baru berhasil dibuat');
      }
      setModalOpen(false);
      fetchVouchers();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Terjadi kesalahan';
      message.error(errorMsg);
    }
  };

  const handleDelete = async (id: number | string | undefined) => {
    if (!id) return;
    try {
      await deleteVoucher(id);
      message.success('Voucher berhasil dihapus');
      fetchVouchers();
    } catch (error) {
      message.error('Gagal menghapus voucher');
    }
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
      title: 'Paket Berlaku',
      key: 'applicable_packages',
      render: (_, r) => {
        const pkgIds = r.applicable_package_ids || [];
        if (pkgIds.length === 0) {
          return (
            <Tag color="blue" className="rounded-full font-bold px-3">
              Semua Paket
            </Tag>
          );
        }

        const matchedPkgs = packages.filter((p) => pkgIds.includes(p.id));
        if (matchedPkgs.length === 0) {
          return (
            <Tag color="orange" className="rounded-full font-bold px-3">
              {pkgIds.length} Paket Spesifik
            </Tag>
          );
        }

        return (
          <Tooltip title={matchedPkgs.map((p) => p.title).join(', ')}>
            <Space wrap size={[0, 4]}>
              {matchedPkgs.slice(0, 2).map((p) => (
                <Tag key={p.id} color="purple" className="rounded-lg font-medium text-xs">
                  {p.title.length > 18 ? `${p.title.substring(0, 18)}...` : p.title}
                </Tag>
              ))}
              {matchedPkgs.length > 2 && (
                <Tag color="default" className="rounded-lg font-bold text-xs">
                  +{matchedPkgs.length - 2} lagi
                </Tag>
              )}
            </Space>
          </Tooltip>
        );
      },
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
      key: 'status',
      render: (_, record) => {
        const status = getVoucherStatus(record);
        const colors: Record<string, string> = { active: 'green', expired: 'red', finished: 'orange' };
        const labels: Record<string, string> = { active: 'Aktif', expired: 'Kadaluarsa', finished: 'Limit Habis' };
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
            onClick={() => openHistory(record)} 
            type="text" 
            className="text-orange-500"
          />
          <Button icon={<EditOutlined />} onClick={() => openEdit(record)} type="text" className="text-primary" />
          <Button icon={<DeleteOutlined />} danger type="text" onClick={() => handleDelete(record.id)} />
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
                  <Title level={4} className="!m-0 !font-black">{vouchers.filter(v => getVoucherStatus(v) === 'active').length}</Title>
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
                  <Title level={4} className="!m-0 !font-black">{vouchers.filter(v => getVoucherStatus(v) === 'expired').length}</Title>
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
              loading={loading}
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

          <Form.Item
            name="packageScope"
            label={<span className="font-bold text-sm">Cakupan Paket</span>}
            initialValue="all"
          >
            <Radio.Group
              onChange={(e) => setPackageScope(e.target.value)}
              className="w-full grid grid-cols-2 gap-3"
            >
              <Radio.Button
                value="all"
                className="h-12 flex items-center justify-center rounded-xl font-bold text-center border"
              >
                Semua Paket
              </Radio.Button>
              <Radio.Button
                value="specific"
                className="h-12 flex items-center justify-center rounded-xl font-bold text-center border"
              >
                Paket Tertentu (1 - N)
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {packageScope === 'specific' && (
            <Form.Item
              name="applicable_package_ids"
              label={
                <span className="font-bold text-sm">
                  Pilih Paket yang Berlaku{' '}
                  <span className="text-primary text-xs font-normal">
                    (bisa pilih 1 atau lebih paket)
                  </span>
                </span>
              }
              rules={[
                {
                  required: true,
                  message: 'Pilih minimal satu paket yang berlaku',
                },
              ]}
            >
              <Select
                mode="multiple"
                allowClear
                placeholder="Pilih paket yang mendapatkan potongan..."
                className="w-full min-h-[48px] rounded-xl"
                options={packages.map((pkg) => ({
                  value: pkg.id,
                  label: `${pkg.title} (${pkg.category || 'Paket'})`,
                }))}
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          )}
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
          loading={historyLoading}
          dataSource={usageHistory}
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
