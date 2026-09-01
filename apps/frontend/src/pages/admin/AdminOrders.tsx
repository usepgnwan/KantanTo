import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { getAdminTransactions, updateTransactionStatus } from '../../services/transactionService';
import {
  Card, Table, Input, Button, Tag, Avatar,
  Typography, Select, Dropdown, Steps, message, Space, Tooltip,
} from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
import {
  SearchOutlined, MoreOutlined, FilterOutlined,
  UserOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, ShoppingOutlined, ExportOutlined,
  PercentageOutlined, TagOutlined, EyeOutlined, GiftOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface OrderItem {
  id: number;
  key: string;
  invoiceCode: string;
  packageTitle: string;
  amount: number;
  originalAmount: number;
  voucher?: string;
  voucherDiscount?: number;
  status: 'sukses' | 'pending' | 'gagal' | 'batal';
  rawStatus: string;
  isLifetime: boolean;
  activeUntil?: string | null;
  isBundle: boolean;
  isBundleSubItem: boolean;
  bundleDiscount: number;
}

interface GroupedOrder {
  key: string;
  invoiceGroup: string;
  orderId: string;
  user: string;
  email: string;
  totalAmount: number;
  totalOriginalAmount: number;
  totalDiscount: number;
  totalBundleDiscount: number;
  status: 'sukses' | 'pending' | 'gagal' | 'batal';
  rawStatus: string;
  method: string;
  date: string;
  rawDate: Date;
  items: OrderItem[];
  itemCount: number;
  hasBundle: boolean;
}

const statusConfig = {
  sukses: { color: 'green', icon: <CheckCircleOutlined />, label: 'Sukses' },
  pending: { color: 'orange', icon: <ClockCircleOutlined />, label: 'Pending' },
  batal: { color: 'volcano', icon: <CloseCircleOutlined />, label: 'Dibatalkan' },
  gagal: { color: 'red', icon: <CloseCircleOutlined />, label: 'Gagal' },
};

const AdminOrders: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<GroupedOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getAdminTransactions();
      if (res.status && res.data) {
        const groups: Record<string, GroupedOrder> = {};

        res.data.forEach((t: any) => {
          const hasInvGroup = t.invoice_group && typeof t.invoice_group === 'string' && t.invoice_group.trim() !== '';
          const grpKey = hasInvGroup ? t.invoice_group : (t.order_id || t.invoice_code || String(t.id));
          const invGroup = hasInvGroup ? t.invoice_group : (t.invoice_code || t.order_id || String(t.id));

          let mappedStatus: 'sukses' | 'pending' | 'gagal' | 'batal' = 'pending';
          if (t.status === 'active') mappedStatus = 'sukses';
          else if (t.status === 'cancelled' || t.status === 'batal') mappedStatus = 'batal';
          else if (t.status === 'expired' || t.status === 'inactive' || t.status === 'failed') mappedStatus = 'gagal';

          const isBundle = Boolean(t.package?.is_bundle);
          const bundleOrig = Number(t.package?.original_price || 0);
          const bundlePrice = Number(t.package?.price || t.amount || 0);
          const bundleDiscount = (isBundle && bundleOrig > bundlePrice) ? (bundleOrig - bundlePrice) : 0;
          const isBundleSubItem = !isBundle && (String(t.invoice_code).includes('-b') || Number(t.amount) === 0);

          const originalPrice = isBundle && bundleOrig > 0 ? bundleOrig : Number(t.package?.price || t.amount || 0);
          let voucherDiscount = 0;
          if (t.voucher) {
            const vType = t.voucher.type || (t.voucher.discount_percentage ? 'percentage' : 'fixed');
            const vVal = Number(t.voucher.value ?? t.voucher.discount_percentage ?? 0);
            if (vType === 'percentage') {
              voucherDiscount = (originalPrice * vVal) / 100;
            } else {
              voucherDiscount = Math.min(originalPrice, vVal);
            }
          }

          const item: OrderItem = {
            id: t.id,
            key: t.id.toString(),
            invoiceCode: t.invoice_code || grpKey,
            packageTitle: t.package?.title || `Paket #${t.package_id}`,
            amount: Number(t.amount) || 0,
            originalAmount: originalPrice,
            voucher: t.voucher?.code,
            voucherDiscount: voucherDiscount,
            status: mappedStatus,
            rawStatus: t.status || 'pending payment',
            isLifetime: t.is_lifetime,
            activeUntil: t.active_until,
            isBundle,
            isBundleSubItem,
            bundleDiscount,
          };

          if (!groups[grpKey]) {
            groups[grpKey] = {
              key: grpKey,
              invoiceGroup: invGroup,
              orderId: t.order_id,
              user: t.user?.name || '-',
              email: t.user?.email || '-',
              totalAmount: Number(t.amount) || 0,
              totalOriginalAmount: originalPrice,
              totalDiscount: voucherDiscount,
              totalBundleDiscount: bundleDiscount,
              status: mappedStatus,
              rawStatus: t.status || 'pending payment',
              method: t.payment_method?.toUpperCase() || 'QRIS',
              date: new Date(t.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              rawDate: new Date(t.created_at || Date.now()),
              items: [item],
              itemCount: 1,
              hasBundle: isBundle,
            };
          } else {
            groups[grpKey].items.push(item);
            groups[grpKey].totalAmount += Number(t.amount) || 0;
            groups[grpKey].totalOriginalAmount += originalPrice;
            groups[grpKey].totalDiscount += voucherDiscount;
            groups[grpKey].totalBundleDiscount += bundleDiscount;
            groups[grpKey].itemCount += 1;
            if (isBundle) groups[grpKey].hasBundle = true;
          }
        });

        const formatted = Object.values(groups).sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
        setOrders(formatted);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (record: GroupedOrder, newStatus: string) => {
    try {
      await Promise.all(record.items.map((item) => updateTransactionStatus(item.id.toString(), newStatus)));
      message.success(`Status pembayaran invoice ${record.invoiceGroup} berhasil diperbarui!`);
      setOrders((prev) =>
        prev.map((o) => {
          if (o.key === record.key) {
            let mappedStatus: 'sukses' | 'pending' | 'gagal' | 'batal' = 'pending';
            if (newStatus === 'active') mappedStatus = 'sukses';
            else if (newStatus === 'cancelled' || newStatus === 'batal') mappedStatus = 'batal';
            else if (newStatus === 'expired' || newStatus === 'inactive' || newStatus === 'failed') mappedStatus = 'gagal';
            return {
              ...o,
              rawStatus: newStatus,
              status: mappedStatus,
              items: o.items.map((it) => ({ ...it, status: mappedStatus, rawStatus: newStatus })),
            };
          }
          return o;
        })
      );
    } catch (error) {
      message.error('Gagal memperbarui status pembayaran');
    }
  };

  const handleExportCSV = () => {
    const headers = ['No Invoice', 'Order ID', 'Pengguna', 'Email', 'Paket', 'Harga Asli', 'Diskon', 'Total Bayar', 'Status', 'Tanggal'];
    const rows = orders.map((o) => [
      `"${o.invoiceGroup}"`,
      `"${o.orderId}"`,
      `"${o.user}"`,
      `"${o.email}"`,
      `"${o.items.map((it) => it.packageTitle).join('; ')}"`,
      o.totalOriginalAmount,
      o.totalDiscount + o.totalBundleDiscount,
      o.totalAmount,
      `"${o.status}"`,
      `"${o.date}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_invoice_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      o.orderId.toLowerCase().includes(q) ||
      o.invoiceGroup.toLowerCase().includes(q) ||
      o.user.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      o.items.some((it) => it.packageTitle.toLowerCase().includes(q) || it.invoiceCode.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = orders.filter((o) => o.status === 'sukses').reduce((a, o) => a + o.totalAmount, 0);
  const successCount = orders.filter((o) => o.status === 'sukses').length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  const rowActions = (record: GroupedOrder): MenuProps['items'] => [
    {
      key: 'active',
      label: <span className="text-green-600 font-bold">Ubah ke Sukses (Aktifkan Semua Paket)</span>,
      disabled: record.status === 'sukses',
      onClick: () => handleStatusChange(record, 'active'),
    },
    {
      key: 'cancelled',
      label: <span className="text-orange-600 font-bold">Ubah ke Dibatalkan</span>,
      disabled: record.status === 'batal',
      onClick: () => handleStatusChange(record, 'cancelled'),
    },
    {
      key: 'expired',
      label: <span className="text-red-500 font-bold">Ubah ke Gagal</span>,
      disabled: record.status === 'gagal',
      onClick: () => handleStatusChange(record, 'expired'),
    },
  ];

  const columns: TableColumnsType<GroupedOrder> = [
    {
      title: 'Invoice / Order ID',
      dataIndex: 'invoiceGroup',
      key: 'invoiceGroup',
      render: (grp, record) => (
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Text className="font-mono text-xs font-black text-primary">{grp}</Text>
            {record.hasBundle ? (
              <Tag color="purple" className="!text-[10px] !m-0 font-bold rounded-md px-1.5 py-0">
                🎁 Bundle ({record.itemCount} Paket)
              </Tag>
            ) : record.itemCount > 1 ? (
              <Tag color="purple" className="!text-[10px] !m-0 font-bold rounded-md px-1.5 py-0">
                🛒 Cart ({record.itemCount} Paket)
              </Tag>
            ) : (
              <Tag color="blue" className="!text-[10px] !m-0 font-medium rounded-md px-1.5 py-0">
                📦 Satuan
              </Tag>
            )}
          </div>
          <Text className="text-[10px] text-on-surface/40 font-mono block mt-0.5">
            {record.orderId}
          </Text>
        </div>
      ),
    },
    {
      title: 'Pengguna',
      dataIndex: 'user',
      key: 'user',
      render: (name, record) => (
        <div className="flex items-center gap-2.5">
          <Avatar size="small" icon={<UserOutlined />} className="bg-primary/10 text-primary shrink-0" />
          <div>
            <Text className="font-bold text-sm block">{name}</Text>
            <Text className="text-xs text-on-surface/40">{record.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Paket Dipesan',
      key: 'packages',
      render: (_, record) => (
        <div className="space-y-1 max-w-[280px]">
          {record.items.map((it) => (
            <div key={it.id} className="flex items-center gap-1.5 flex-wrap">
              {it.isBundle ? (
                <Tag color="purple" className="rounded-full font-bold px-2.5 py-0.5 text-xs m-0">
                  🎁 {it.packageTitle}
                </Tag>
              ) : it.isBundleSubItem ? (
                <Tag color="cyan" className="rounded-full font-medium px-2 py-0 text-[11px] m-0">
                  ↳ {it.packageTitle}
                </Tag>
              ) : (
                <Tag className="rounded-full bg-primary/10 text-primary border-none font-bold px-2.5 py-0.5 text-xs m-0">
                  {it.packageTitle}
                </Tag>
              )}
              {it.voucher && (
                <Tag color="green" className="!text-[10px] !m-0 font-bold rounded-full border-none bg-green-50 text-green-700">
                  {it.voucher}
                </Tag>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Total Tagihan',
      key: 'amount',
      align: 'right',
      render: (_, record) => (
        <div className="flex flex-col items-end">
          {(record.totalDiscount > 0 || record.totalBundleDiscount > 0) && (
            <Text delete className="text-[10px] text-on-surface/30">
              Rp {record.totalOriginalAmount.toLocaleString('id-ID')}
            </Text>
          )}
          <Text className="font-black text-sm text-primary">
            Rp {record.totalAmount.toLocaleString('id-ID')}
          </Text>
          {record.totalBundleDiscount > 0 && (
            <span className="text-[10px] text-purple-600 font-bold">
              Hemat Bundle Rp {record.totalBundleDiscount.toLocaleString('id-ID')}
            </span>
          )}
          {record.totalDiscount > 0 && (
            <span className="text-[10px] text-green-600 font-bold">
              Diskon Voucher Rp {record.totalDiscount.toLocaleString('id-ID')}
            </span>
          )}
        </div>
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Metode',
      dataIndex: 'method',
      key: 'method',
      render: (method) => <Text className="text-xs font-semibold">{method}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: GroupedOrder['status']) => (
        <Tag
          icon={statusConfig[status]?.icon}
          color={statusConfig[status]?.color}
          className="rounded-full font-bold text-xs"
        >
          {statusConfig[status]?.label || status}
        </Tag>
      ),
    },
    {
      title: 'Tanggal',
      dataIndex: 'date',
      key: 'date',
      render: (date) => <Text className="text-xs text-on-surface/60">{date}</Text>,
    },
    {
      title: '',
      key: 'action',
      width: 48,
      render: (_, record) => (
        <Dropdown menu={{ items: rowActions(record) }} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} className="text-on-surface/40 hover:text-primary" />
        </Dropdown>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <Text className="text-[10px] uppercase font-black tracking-widest text-primary/60 block mb-1">Manajemen</Text>
              <Title level={1} className="!text-3xl !font-manrope !font-black !m-0">Daftar Pesanan</Title>
              <Text className="text-xs text-on-surface/40">Dikelompokkan berdasarkan Invoice Group / Keranjang</Text>
            </div>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExportCSV}
              className="rounded-xl font-bold border-on-surface/10 mt-4 sm:mt-0"
            >
              Ekspor CSV
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
              <Text className="text-[10px] uppercase font-black tracking-widest text-on-surface/40 dark:text-zinc-500 block mb-1">
                Total Pendapatan
              </Text>
              <div className="text-2xl font-black font-manrope text-primary">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </div>
              <Tag color="green" className="mt-2 rounded-full font-bold">{successCount} invoice sukses</Tag>
            </Card>

            <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
              <Text className="text-[10px] uppercase font-black tracking-widest text-on-surface/40 dark:text-zinc-500 block mb-1">
                Menunggu Konfirmasi
              </Text>
              <div className="text-2xl font-black font-manrope text-orange-500">{pendingCount}</div>
              <Text className="text-xs text-on-surface/40">invoice pesanan perlu ditindak</Text>
            </Card>

            <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
              <Text className="text-[10px] uppercase font-black tracking-widest text-on-surface/40 dark:text-zinc-500 block mb-2">
                Alur Validasi Pesanan
              </Text>
              <Steps
                size="small"
                current={1}
                items={[
                  { title: 'Diterima', icon: <ShoppingOutlined /> },
                  { title: 'Verifikasi' },
                  { title: 'Aktif', icon: <CheckCircleOutlined /> },
                ]}
              />
            </Card>
          </div>

          {/* Table Card */}
          <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Input
                prefix={<SearchOutlined className="text-on-surface/30" />}
                placeholder="Cari nomor invoice, paket, pengguna, atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl flex-1"
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full sm:w-44"
                options={[
                  { value: 'all', label: 'Semua Status' },
                  { value: 'sukses', label: 'Sukses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'batal', label: 'Dibatalkan' },
                  { value: 'gagal', label: 'Gagal' },
                ]}
                suffixIcon={<FilterOutlined />}
              />
            </div>

            <Table
              loading={loading}
              columns={columns}
              dataSource={filtered}
              pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `Total ${total} invoice pesanan` }}
              scroll={{ x: 900 }}
              expandable={{
                expandedRowRender: (record) => (
                  <div className="bg-surface-low/40 p-4 rounded-xl border border-on-surface/10 m-2">
                    <div className="text-xs font-bold text-on-surface/70 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                      <ShoppingOutlined className="text-primary" />
                      Rincian Item dalam Invoice {record.invoiceGroup} ({record.items.length} Item)
                    </div>
                    <table className="w-full text-xs text-left border-collapse bg-white dark:bg-zinc-900 rounded-lg overflow-hidden border border-on-surface/5">
                      <thead>
                        <tr className="border-b border-on-surface/10 bg-surface-low/50 text-on-surface/60 font-bold">
                          <th className="py-2 px-3 text-center w-10">No</th>
                          <th className="py-2 px-3">Sub-Invoice</th>
                          <th className="py-2 px-3">Nama Paket</th>
                          <th className="py-2 px-3 text-right">Harga Asli</th>
                          <th className="py-2 px-3 text-right">Potongan / Diskon</th>
                          <th className="py-2 px-3 text-right">Subtotal Bayar</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.items.map((it, idx) => (
                          <tr
                            key={it.id}
                            className={`border-b border-on-surface/5 hover:bg-surface-low/30 ${
                              it.isBundle ? 'bg-purple-50/50 dark:bg-purple-950/20 font-medium' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center text-on-surface/50">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-primary">{it.invoiceCode}</td>
                            <td className="py-2.5 px-3 font-bold text-on-surface">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{it.packageTitle}</span>
                                {it.isBundle && (
                                  <Tag color="purple" className="border-none font-bold text-[9px] m-0">🎁 Paket Bundle</Tag>
                                )}
                                {it.isBundleSubItem && (
                                  <Tag color="cyan" className="border-none font-bold text-[9px] m-0">Sub-Paket</Tag>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right text-on-surface/70">
                              Rp {it.originalAmount.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {it.isBundle && it.bundleDiscount > 0 ? (
                                <span className="text-purple-700 dark:text-purple-300 font-bold">
                                  Potongan Bundle -Rp {it.bundleDiscount.toLocaleString('id-ID')}
                                </span>
                              ) : it.isBundleSubItem ? (
                                <span className="text-cyan-700 dark:text-cyan-400 font-medium">
                                  (Termasuk Bundle)
                                </span>
                              ) : it.voucher ? (
                                <span className="text-green-600 font-semibold">
                                  -Rp {(it.voucherDiscount || 0).toLocaleString('id-ID')} ({it.voucher})
                                </span>
                              ) : (
                                <span className="text-on-surface/30">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-on-surface">
                              Rp {it.amount.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <Tag
                                color={it.isBundle && it.status === 'sukses' ? 'purple' : statusConfig[it.status]?.color}
                                className="rounded-full font-bold text-[10px] m-0"
                              >
                                {it.isBundle && it.status === 'sukses' ? 'Bundle Aktif' : (statusConfig[it.status]?.label || it.status)}
                              </Tag>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ),
                rowExpandable: (record) => record.items.length > 0,
              }}
            />
          </Card>

        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
