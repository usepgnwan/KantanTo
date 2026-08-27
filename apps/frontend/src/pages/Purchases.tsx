import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import {
  Typography, Card, Tag, Empty, Spin, Divider, Timeline, Button, Row, Col, Modal, message, Space, Pagination,
} from 'antd';
import {
  ShoppingOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  TagOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  WhatsAppOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getMyPackagesAPI, getMyPackagesPaginatedAPI, MyTransaction } from '../services/myPackageService';
import { getSetting, Setting } from '../services/settingService';
import { updateTransactionStatus } from '../services/transactionService';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; timelineColor: string }> = {
  active: {
    label: 'Aktif',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircleFilled className="text-green-500" />,
    timelineColor: 'green',
  },
  'pending payment': {
    label: 'Menunggu Pembayaran',
    color: 'bg-orange-100 text-orange-700',
    icon: <ClockCircleFilled className="text-orange-400" />,
    timelineColor: 'orange',
  },
  expired: {
    label: 'Kadaluarsa',
    color: 'bg-gray-100 text-gray-500',
    icon: <CloseCircleFilled className="text-gray-400" />,
    timelineColor: 'gray',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'bg-red-100 text-red-600',
    icon: <CloseCircleFilled className="text-red-500" />,
    timelineColor: 'red',
  },
  failed: {
    label: 'Dibatalkan',
    color: 'bg-red-100 text-red-600',
    icon: <CloseCircleFilled className="text-red-500" />,
    timelineColor: 'red',
  },
};

const getStatus = (s: string) =>
  statusConfig[s] ?? { label: s, color: 'bg-gray-100 text-gray-500', icon: null, timelineColor: 'gray' };

const PurchasesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<MyTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState<Setting | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchPurchases = (page: number = 1) => {
    if (user?.id) {
      setLoading(true);
      Promise.all([
        getMyPackagesPaginatedAPI(user.id, page, pageSize, 'all'),
        getSetting().catch(() => null)
      ])
        .then(([paginatedData, settingData]) => {
          setPurchases(paginatedData.rows || []);
          setTotal(paginatedData.total || 0);
          if (settingData) setSetting(settingData);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchPurchases(currentPage);
  }, [user, currentPage]);

  const handleConfirmWhatsApp = (tx: MyTransaction) => {
    const waNumber = setting?.no_wa || '';
    const formattedNumber = waNumber.startsWith('0') ? '62' + waNumber.substring(1) : waNumber;
    
    const message = `Halo Admin, saya ingin melakukan konfirmasi pembayaran untuk:\n\n` +
      `*Nama Paket:* ${tx.package?.title}\n` +
      `*Invoice:* ${tx.invoice_code}\n` +
      `*Total:* Rp ${Number(tx.amount).toLocaleString('id-ID')}\n` +
      `*Email Saya:* ${user?.email}\n\n` +
      `Mohon di cek ya admin. Terima kasih!`;
      
    const waLink = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };

  const handleCancelOrder = (tx: MyTransaction) => {
    Modal.confirm({
      title: 'Batalkan Pesanan?',
      content: `Apakah Anda yakin ingin membatalkan pesanan untuk paket "${tx.package?.title || tx.invoice_code}"?`,
      okText: 'Ya, Batalkan',
      cancelText: 'Batal',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await updateTransactionStatus(tx.id, 'cancelled');
          message.success('Pesanan berhasil dibatalkan');
          fetchPurchases();
        } catch {
          message.error('Gagal membatalkan pesanan');
        }
      },
    });
  };

  const totalSpent = purchases.reduce((acc, tx) => acc + (tx.status === 'active' ? Number(tx.amount) : 0), 0);
  const activeCount = purchases.filter(tx => tx.status === 'active').length;
  const pendingCount = purchases.filter(tx => tx.status === 'pending payment').length;

  return (
    <AppLayout>
      <div className="bg-surface-low/30 pt-32 pb-24 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-10">
            <Text className="text-[10px] uppercase font-black tracking-widest text-primary/60 block mb-1">
              Akun Saya
            </Text>
            <Title level={1} className="!text-3xl !font-manrope !font-black !m-0">
              History Pembelian
            </Title>
            <Text className="text-on-surface/50 text-sm">
              Semua transaksi dan paket yang pernah Anda beli
            </Text>
          </div>

          {/* Stats Row */}
          <Row gutter={[16, 16]} className="mb-10">
            {[
              { label: 'Total Transaksi', value: total, color: 'text-primary' },
              { label: 'Paket Aktif', value: activeCount, color: 'text-green-500' },
              { label: 'Pending', value: pendingCount, color: 'text-orange-500' },
              {
                label: 'Total Dibelanjakan',
                value: totalSpent === 0 ? 'Gratis' : `Rp ${totalSpent.toLocaleString('id-ID')}`,
                color: 'text-primary',
              },
            ].map(s => (
              <Col xs={12} sm={6} key={s.label}>
                <Card className="weightless-card border-none bg-white dark:bg-zinc-900 text-center shadow-sm py-2">
                  <div className={`text-xl font-black font-manrope ${s.color}`}>{s.value}</div>
                  <Text className="text-[10px] uppercase font-black text-on-surface/40 tracking-wider">
                    {s.label}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>

          {/* List */}
          <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md rounded-[2rem] p-2">
            <div className="flex items-center gap-3 px-4 pt-4 pb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <ShoppingOutlined className="text-primary" />
              </div>
              <div>
                <Title level={4} className="!font-manrope !m-0 !font-black">Riwayat Transaksi</Title>
                <Text className="text-[10px] uppercase font-bold text-on-surface/40 tracking-widest">
                  {total} transaksi ditemukan
                </Text>
              </div>
            </div>
            <Divider className="!my-0" />

            {loading ? (
              <div className="flex justify-center py-16">
                <Spin size="large" />
              </div>
            ) : purchases.length === 0 ? (
              <Empty
                className="py-16"
                description={
                  <div>
                    <Text className="block font-bold text-on-surface/60">Belum ada pembelian</Text>
                    <Text className="text-xs text-on-surface/40">Yuk mulai beli paket tryout pertamamu!</Text>
                  </div>
                }
              >
                <Button type="primary" className="rounded-full px-8 font-bold" onClick={() => navigate('/paket')}>
                  Lihat Katalog Paket
                </Button>
              </Empty>
            ) : (
              <div className="px-4 py-6">
                <Timeline
                  items={purchases.map(tx => {
                    const date = new Date(tx.created_at || '');
                    const activeUntil = tx.active_until ? new Date(tx.active_until) : null;
                    const s = getStatus(tx.status);
                    return {
                      color: s.timelineColor,
                      dot: s.icon,
                      children: (
                        <Card
                          className="border border-on-surface/5 rounded-2xl shadow-none hover:shadow-md hover:border-primary/20 transition-all duration-300 mb-2"
                          bodyStyle={{ padding: '16px 20px' }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <Text className="font-black text-base block text-on-surface mb-1 truncate">
                                {tx.package?.title || `Paket #${tx.package_id}`}
                              </Text>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface/50">
                                <span className="flex items-center gap-1">
                                  <TagOutlined />
                                  {tx.invoice_code}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CalendarOutlined />
                                  {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                              </div>

                              {activeUntil && (
                                <Text className="text-[11px] text-green-600 font-bold block mt-1">
                                  Aktif s/d: {activeUntil.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </Text>
                              )}

                              {/* Price Details */}
                              <div className="mt-3 bg-surface-low/50 rounded-lg p-3 text-xs border border-on-surface/5">
                                <div className="flex justify-between mb-1">
                                  <Text className="text-on-surface/60">Harga Paket</Text>
                                  <Text>Rp {Number(tx.package?.price || 0).toLocaleString('id-ID')}</Text>
                                </div>
                                {tx.voucher && (
                                  <div className="flex justify-between mb-1 text-green-600">
                                    <Text className="text-green-600">
                                      Diskon ({tx.voucher.code} - {tx.voucher.discount_percentage}%)
                                    </Text>
                                    <Text>- Rp {Number((tx.package?.price || 0) * (tx.voucher.discount_percentage / 100)).toLocaleString('id-ID')}</Text>
                                  </div>
                                )}
                                <div className="flex justify-between mb-1 border-b border-on-surface/10 pb-1">
                                  <Text className="text-on-surface/60">PPN / Pajak</Text>
                                  <Text>Rp {Number(tx.amount - Math.max(0, (tx.package?.price || 0) - ((tx.package?.price || 0) * ((tx.voucher?.discount_percentage || 0) / 100)))).toLocaleString('id-ID')}</Text>
                                </div>
                                <div className="flex justify-between mt-1 font-bold">
                                  <Text>Total Dibayar</Text>
                                  <Text className="text-primary">Rp {Number(tx.amount).toLocaleString('id-ID')}</Text>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <Text className="font-black text-primary block">
                                  {tx.amount === 0
                                    ? 'Gratis'
                                    : `Rp ${Number(tx.amount).toLocaleString('id-ID')}`}
                                </Text>
                                <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${s.color}`}>
                                  {s.label}
                                </span>
                              </div>
                              {tx.status === 'active' && (
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<ArrowRightOutlined />}
                                  className="rounded-xl font-bold h-8 px-3 shrink-0"
                                  onClick={() => navigate('/latihan')}
                                >
                                  Buka
                                </Button>
                              )}
                              {tx.status === 'pending payment' && (
                                <Space wrap>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<WhatsAppOutlined />}
                                    className="rounded-xl font-bold h-8 px-3 shrink-0 bg-green-500 hover:bg-green-600 border-none"
                                    onClick={() => handleConfirmWhatsApp(tx)}
                                  >
                                    Konfirmasi
                                  </Button>
                                  <Button
                                    type="default"
                                    danger
                                    size="small"
                                    icon={<CloseOutlined />}
                                    className="rounded-xl font-bold h-8 px-3 shrink-0"
                                    onClick={() => handleCancelOrder(tx)}
                                  >
                                    Batalkan
                                  </Button>
                                </Space>
                              )}
                            </div>
                          </div>
                        </Card>
                      ),
                    };
                  })}
                />
                
                {total > pageSize && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={total}
                      onChange={(page) => setCurrentPage(page)}
                      showSizeChanger={false}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>

        </div>
      </div>
    </AppLayout>
  );
};

export default PurchasesPage;
