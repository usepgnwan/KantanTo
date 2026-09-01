import React, { useEffect, useState } from 'react';
import { Typography, Card, Button, Spin, Tag, Empty, Divider, Row, Col, Timeline, Modal, message, Pagination, Space } from 'antd';
import {
  ShoppingOutlined,
  CalendarOutlined,
  TagOutlined,
  ArrowRightOutlined,
  CloseCircleFilled,
  ClockCircleFilled,
  CheckCircleFilled,
  WhatsAppOutlined,
  CloseOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';
import { getMyPackagesPaginatedAPI, MyTransaction } from '../services/myPackageService';
import { updateTransactionStatus } from '../services/transactionService';
import { getSetting, Setting } from '../services/settingService';

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
    icon: <ClockCircleFilled className="text-orange-500" />,
    timelineColor: 'orange',
  },
  pending: {
    label: 'Menunggu Pembayaran',
    color: 'bg-orange-100 text-orange-700',
    icon: <ClockCircleFilled className="text-orange-500" />,
    timelineColor: 'orange',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'bg-red-100 text-red-600',
    icon: <CloseCircleFilled className="text-red-500" />,
    timelineColor: 'red',
  },
  expired: {
    label: 'Kedaluwarsa',
    color: 'bg-gray-100 text-gray-500',
    icon: <CloseCircleFilled className="text-gray-400" />,
    timelineColor: 'gray',
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

interface PurchaseGroup {
  groupKey: string;
  invoiceGroup: string;
  orderId: string;
  date: Date;
  status: string;
  items: MyTransaction[];
  totalAmount: number;
  totalOriginalPrice: number;
  totalDiscount: number;
  totalBundleDiscount: number;
  totalTax: number;
  isMultiPackage: boolean;
  hasBundle: boolean;
}

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

  const groupedPurchases: PurchaseGroup[] = React.useMemo(() => {
    const groups: Record<string, PurchaseGroup> = {};

    purchases.forEach((tx) => {
      const hasInvGroup = Boolean(tx.invoice_group && typeof tx.invoice_group === 'string' && tx.invoice_group.trim() !== '');
      const groupKey: string = (hasInvGroup ? tx.invoice_group : (tx.order_id || tx.invoice_code || String(tx.id))) || String(tx.id);
      const invGroup: string = (hasInvGroup ? tx.invoice_group : (tx.invoice_code || tx.order_id || String(tx.id))) || String(tx.id);
      const pkgPrice = Number(tx.package?.price || 0);

      let discountAmount = 0;
      if (tx.voucher) {
        const vType = tx.voucher.type || (tx.voucher.discount_percentage !== undefined ? 'percentage' : 'fixed');
        const vVal = Number(tx.voucher.value ?? tx.voucher.discount_percentage ?? 0);
        if (vType === 'percentage') {
          discountAmount = (pkgPrice * vVal) / 100;
        } else {
          discountAmount = Math.min(pkgPrice, vVal);
        }
      }

      const isBundle = Boolean(tx.package?.is_bundle);
      const origPrice = Number(tx.package?.original_price || 0);
      const bundlePrice = Number(tx.package?.price || tx.amount || 0);
      const bundleDiscount = (isBundle && origPrice > bundlePrice) ? (origPrice - bundlePrice) : 0;

      const netAmount = Math.max(0, pkgPrice - discountAmount);
      const taxAmount = Math.max(0, Number(tx.amount) - netAmount);

      if (!groups[groupKey]) {
        groups[groupKey] = {
          groupKey,
          invoiceGroup: invGroup,
          orderId: tx.order_id,
          date: new Date(tx.created_at || ''),
          status: tx.status,
          items: [tx],
          totalAmount: Number(tx.amount),
          totalOriginalPrice: isBundle && origPrice > 0 ? origPrice : pkgPrice,
          totalDiscount: discountAmount,
          totalBundleDiscount: bundleDiscount,
          totalTax: taxAmount,
          isMultiPackage: false,
          hasBundle: isBundle,
        };
      } else {
        groups[groupKey].items.push(tx);
        groups[groupKey].totalAmount += Number(tx.amount);
        groups[groupKey].totalOriginalPrice += (isBundle && origPrice > 0 ? origPrice : pkgPrice);
        groups[groupKey].totalDiscount += discountAmount;
        groups[groupKey].totalBundleDiscount += bundleDiscount;
        groups[groupKey].totalTax += taxAmount;
        groups[groupKey].isMultiPackage = true;
        if (isBundle) groups[groupKey].hasBundle = true;
      }
    });

    return Object.values(groups);
  }, [purchases]);

  const handleConfirmWhatsAppGroup = (group: PurchaseGroup) => {
    const waNumber = setting?.no_wa || '';
    const formattedNumber = waNumber.startsWith('0') ? '62' + waNumber.substring(1) : waNumber;

    const packageListText = group.items
      .map((item) => {
        if (item.package?.is_bundle) {
          return `- [BUNDLE] ${item.package.title} (Rp ${Number(item.amount).toLocaleString('id-ID')})`;
        }
        return `- ${item.package?.title || `Paket #${item.package_id}`} (Rp ${Number(item.amount).toLocaleString('id-ID')})`;
      })
      .join('\n');

    const voucherCodes = Array.from(new Set(group.items.map((i) => i.voucher?.code).filter(Boolean)));
    const voucherInfo = voucherCodes.length > 0 ? `*Voucher:* ${voucherCodes.join(', ')}\n` : '';

    const message =
      `Halo Admin, saya ingin melakukan konfirmasi pembayaran untuk:\n\n` +
      `*Invoice / Grup:* ${group.invoiceGroup}\n` +
      `*Daftar Paket (${group.items.length} item):*\n${packageListText}\n` +
      voucherInfo +
      `*Total Tagihan:* Rp ${group.totalAmount.toLocaleString('id-ID')}\n` +
      `*Email Saya:* ${user?.email}\n\n` +
      `Mohon di cek ya admin. Terima kasih!`;

    const waLink = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };

  const handleCancelGroup = (group: PurchaseGroup) => {
    Modal.confirm({
      title: 'Batalkan Pesanan?',
      content: `Apakah Anda yakin ingin membatalkan pesanan untuk Invoice "${group.invoiceGroup}" (${group.items.length} paket)?`,
      okText: 'Ya, Batalkan',
      cancelText: 'Batal',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await Promise.all(group.items.map((it) => updateTransactionStatus(it.id, 'cancelled')));
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

          {/* Stats Bar */}
          <Row gutter={[16, 16]} className="mb-8">
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
                  {groupedPurchases.length} pesanan / invoice ({total} paket)
                </Text>
              </div>
            </div>
            <Divider className="!my-0" />

            {loading ? (
              <div className="flex justify-center py-16">
                <Spin size="large" />
              </div>
            ) : groupedPurchases.length === 0 ? (
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
                  items={groupedPurchases.map((group) => {
                    const s = getStatus(group.status);

                    return {
                      color: s.timelineColor,
                      dot: s.icon,
                      children: (
                        <Card
                          className="border border-on-surface/5 rounded-2xl shadow-none hover:shadow-md hover:border-primary/20 transition-all duration-300 mb-4"
                          bodyStyle={{ padding: '18px 20px' }}
                          key={group.groupKey}
                        >
                          {/* Group Header Info */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-on-surface/5 pb-3 mb-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-black text-on-surface text-sm flex items-center gap-1.5">
                                <TagOutlined className="text-primary" />
                                {group.invoiceGroup}
                              </span>
                              <span className="text-on-surface/40">•</span>
                              <span className="text-on-surface/60 flex items-center gap-1">
                                <CalendarOutlined />
                                {group.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {group.hasBundle ? (
                                <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                                  <GiftOutlined className="text-[11px]" />
                                  Bundle ({group.items.length} Paket)
                                </span>
                              ) : group.isMultiPackage ? (
                                <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                                  <ShoppingOutlined className="text-[11px]" />
                                  Cart ({group.items.length} Paket)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                                  <TagOutlined className="text-[11px]" />
                                  Satuan
                                </span>
                              )}
                              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${s.color}`}>
                                {s.label}
                              </span>
                            </div>
                          </div>

                          {/* Items in this Order Group */}
                          <div className="space-y-3 mb-3">
                            {group.items.map((tx) => {
                              const isBundle = Boolean(tx.package?.is_bundle);
                              const isBundleSubItem = !isBundle && (String(tx.invoice_code).includes('-b') || (group.hasBundle && Number(tx.amount) === 0));
                              const pkgPrice = Number(tx.package?.price || 0);
                              const activeUntil = tx.active_until ? new Date(tx.active_until) : null;

                              let voucherDiscount = 0;
                              let voucherLabel = '';
                              if (tx.voucher) {
                                const vType = tx.voucher.type || (tx.voucher.discount_percentage !== undefined ? 'percentage' : 'fixed');
                                const vVal = Number(tx.voucher.value ?? tx.voucher.discount_percentage ?? 0);
                                if (vType === 'percentage') {
                                  voucherDiscount = (pkgPrice * vVal) / 100;
                                  voucherLabel = `${tx.voucher.code} (${vVal}%)`;
                                } else {
                                  voucherDiscount = Math.min(pkgPrice, vVal);
                                  voucherLabel = `${tx.voucher.code} (Rp ${vVal.toLocaleString('id-ID')})`;
                                }
                              }

                              // Bundle discounts
                              const bundleOrig = Number(tx.package?.original_price || 0);
                              const bundlePrice = Number(tx.amount || tx.package?.price || 0);
                              const bundleDiscount = (isBundle && bundleOrig > bundlePrice) ? (bundleOrig - bundlePrice) : 0;

                              // 1. Bundle Container Row (Hanya Title & Potongan, Gada Tombol Buka Paket)
                              if (isBundle) {
                                return (
                                  <div
                                    key={tx.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Text className="font-bold text-sm text-purple-950 dark:text-purple-200">
                                          {tx.package?.title}
                                        </Text>
                                        <Tag color="purple" className="border-none font-bold text-[10px] m-0 rounded-md">
                                          🎁 Paket Bundle
                                        </Tag>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs mt-1">
                                        {bundleOrig > bundlePrice && (
                                          <Text className="text-on-surface/40 line-through text-xs">
                                            Rp {bundleOrig.toLocaleString('id-ID')}
                                          </Text>
                                        )}
                                        {bundleDiscount > 0 && (
                                          <span className="text-purple-700 dark:text-purple-300 font-bold bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-md text-[11px]">
                                            Diskon Potongan Bundle (-Rp {bundleDiscount.toLocaleString('id-ID')})
                                          </span>
                                        )}
                                        {tx.voucher && (
                                          <span className="text-green-600 font-semibold flex items-center gap-1">
                                            <TagOutlined className="text-[10px]" />
                                            Diskon {voucherLabel} (-Rp {voucherDiscount.toLocaleString('id-ID')})
                                          </span>
                                        )}
                                        <span className="font-black text-purple-800 dark:text-purple-200">
                                          Rp {bundlePrice.toLocaleString('id-ID')}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="shrink-0">
                                      {tx.status === 'active' && (
                                        <Tag color="purple" className="border-none font-bold text-xs rounded-full px-3 py-1 m-0">
                                          Bundle Aktif
                                        </Tag>
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              // 2. Sub-Paket in Bundle Row
                              if (isBundleSubItem) {
                                return (
                                  <div
                                    key={tx.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-low/30 border border-on-surface/5 pl-4"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Text className="font-bold text-sm block text-on-surface">
                                          {tx.package?.title || `Paket #${tx.package_id}`}
                                        </Text>
                                        <Tag color="cyan" className="border-none font-bold text-[10px] m-0 rounded-md">
                                          Sub-Paket
                                        </Tag>
                                        {tx.invoice_code && (
                                          <Text className="text-[10px] text-on-surface/40">
                                            ({tx.invoice_code})
                                          </Text>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs mt-0.5">
                                        <span className="text-on-surface/60">
                                          Rp {pkgPrice.toLocaleString('id-ID')}
                                        </span>
                                        <span className="text-cyan-700 dark:text-cyan-400 font-medium text-[11px]">
                                          (Termasuk dalam Bundle)
                                        </span>
                                        {activeUntil && (
                                          <span className="text-[11px] text-green-600 font-medium">
                                            Aktif s/d {activeUntil.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {tx.status === 'active' && (
                                      <Button
                                        type="primary"
                                        size="small"
                                        icon={<ArrowRightOutlined />}
                                        className="rounded-xl font-bold h-7 px-3 shrink-0"
                                        onClick={() => navigate('/latihan')}
                                      >
                                        Buka Paket
                                      </Button>
                                    )}
                                  </div>
                                );
                              }

                              // 3. Regular Standalone Package Row
                              return (
                                <div
                                  key={tx.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-low/30 border border-on-surface/5"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Text className="font-bold text-sm block text-on-surface truncate">
                                        {tx.package?.title || `Paket #${tx.package_id}`}
                                      </Text>
                                      {group.isMultiPackage && tx.invoice_code !== group.invoiceGroup && (
                                        <Text className="text-[10px] text-on-surface/40">
                                          ({tx.invoice_code})
                                        </Text>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs mt-0.5">
                                      <span className="text-on-surface/60">
                                        Rp {pkgPrice.toLocaleString('id-ID')}
                                      </span>
                                      {tx.voucher && (
                                        <span className="text-green-600 font-semibold flex items-center gap-1">
                                          <TagOutlined className="text-[10px]" />
                                          Diskon {voucherLabel} (-Rp {voucherDiscount.toLocaleString('id-ID')})
                                        </span>
                                      )}
                                      {activeUntil && (
                                        <span className="text-[11px] text-green-600 font-medium">
                                          Aktif s/d {activeUntil.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {tx.status === 'active' && (
                                    <Button
                                      type="primary"
                                      size="small"
                                      icon={<ArrowRightOutlined />}
                                      className="rounded-xl font-bold h-7 px-3 shrink-0"
                                      onClick={() => navigate('/latihan')}
                                    >
                                      Buka Paket
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Order Financial Summary & Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-on-surface/5 bg-surface-low/20 rounded-xl p-3">
                            <div className="text-xs space-y-0.5">
                              {group.totalBundleDiscount > 0 && (
                                <div className="text-purple-600 font-semibold flex items-center gap-1">
                                  <span>Total Hemat Bundle:</span>
                                  <span>- Rp {group.totalBundleDiscount.toLocaleString('id-ID')}</span>
                                </div>
                              )}
                              {group.totalDiscount > 0 && (
                                <div className="text-green-600 font-semibold flex items-center gap-1">
                                  <span>Total Hemat Diskon Voucher:</span>
                                  <span>- Rp {group.totalDiscount.toLocaleString('id-ID')}</span>
                                </div>
                              )}
                              {group.totalTax > 0 && (
                                <div className="text-on-surface/60">
                                  <span>PPN / Pajak:</span> Rp {group.totalTax.toLocaleString('id-ID')}
                                </div>
                              )}
                              <div className="text-sm font-bold flex items-center gap-1.5 pt-0.5">
                                <span className="text-on-surface/70">Total Tagihan:</span>
                                <span className="text-primary font-black text-base">
                                  {group.totalAmount === 0 ? 'Gratis' : `Rp ${group.totalAmount.toLocaleString('id-ID')}`}
                                </span>
                              </div>
                            </div>

                            {group.status === 'pending payment' && (
                              <Space wrap className="shrink-0">
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<WhatsAppOutlined />}
                                  className="rounded-xl font-bold h-8 px-4 bg-green-500 hover:bg-green-600 border-none"
                                  onClick={() => handleConfirmWhatsAppGroup(group)}
                                >
                                  Konfirmasi Pembayaran
                                </Button>
                                <Button
                                  type="default"
                                  danger
                                  size="small"
                                  icon={<CloseOutlined />}
                                  className="rounded-xl font-bold h-8 px-3"
                                  onClick={() => handleCancelGroup(group)}
                                >
                                  Batalkan
                                </Button>
                              </Space>
                            )}
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
