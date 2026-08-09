import React from 'react';
import { Typography, Card, Button, Badge, Space } from 'antd';
import {
  CopyOutlined,
  WhatsAppOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  ShoppingOutlined,
  QrcodeOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import qrisPlaceholder from '../../assets/qris-placeholder.jpeg';

const { Title, Text } = Typography;

interface PaymentSectionProps {
  orderNumber: string;
  customerData: {
    name: string;
    whatsapp: string;
    email: string;
  };
  cartItems: Array<{
    id: string;
    title: string;
    price: number;
    variant?: string;
  }>;
  totalAmount: number;
  onSuccess?: () => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  orderNumber,
  customerData,
  cartItems,
  totalAmount,
}) => {
  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
  };

  const handleWhatsAppConfirm = () => {
    const packageNames = cartItems.map(i => i.title).join(', ');
    const adminPhone = '6281234567890';
    const messageText = `Halo Admin, saya ingin konfirmasi pembayaran paket:
• Invoice: ${orderNumber}
• Nama: ${customerData.name || 'Siswa'}
• No. WA: ${customerData.whatsapp || '-'}
• Email: ${customerData.email || '-'}
• Paket: ${packageNames}
• Total: Rp ${totalAmount.toLocaleString('id-ID')}

Mohon bantuan untuk konfirmasi & aktivasi transaksi ini. Terima kasih!`;

    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-surface-container shadow-sm">
        <div>
          <Title level={4} className="!font-manrope !m-0">Instruksi & Detail Pembayaran</Title>
          <div className="flex items-center gap-2 mt-1">
            <Text className="text-xs text-on-surface/60">No. Invoice / Tagihan:</Text>
            <div className="bg-surface-low px-3 py-1 rounded-lg flex items-center gap-2 border border-on-surface/5">
              <Text className="font-mono font-bold text-primary text-sm">{orderNumber || 'INV/PENDING'}</Text>
              <CopyOutlined
                className="text-xs cursor-pointer hover:text-primary transition-colors"
                onClick={copyOrderNumber}
              />
            </div>
          </div>
        </div>
        <Badge
          status="processing"
          text={
            <span className="font-bold uppercase tracking-widest text-xs text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
              Menunggu Pembayaran
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: QRIS Template */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <Card className="w-full border-none glass rounded-3xl overflow-hidden p-6 text-center shadow-xl shadow-primary/5 bg-white dark:bg-zinc-900 border border-surface-container">
            <div className="flex items-center justify-center gap-2 mb-4 text-primary font-bold text-sm">
              <QrcodeOutlined className="text-xl" /> Scan QRIS Pembayaran
            </div>
            <div className="bg-white rounded-2xl p-4 mb-4 border border-surface-container shadow-inner">
              <img
                src={qrisPlaceholder}
                alt="QRIS Payment"
                className="w-full aspect-square object-contain mx-auto max-w-[240px]"
              />
            </div>
            <Text className="text-xs font-bold uppercase tracking-wider text-on-surface/60 block mb-1">
              Bisa Di-Scan Semua E-Wallet & Bank
            </Text>
            <Text className="text-[11px] text-on-surface/40 block">
              Gopay, OVO, Dana, LinkAja, ShopeePay, BCA, Mandiri, BRI, dll
            </Text>
          </Card>
        </div>

        {/* Right Column: Data Form & Detail Pembelian */}
        <div className="lg:col-span-7 space-y-6">
          {/* Data Yang Diisi Siswa */}
          <Card className="border-none rounded-3xl p-6 shadow-md bg-white dark:bg-zinc-900 border border-surface-container">
            <Title level={5} className="!font-manrope mb-4 flex items-center gap-2">
              <UserOutlined className="text-primary" /> Data Pemesan (Form Siswa)
            </Title>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-surface-container">
                <Text className="text-on-surface/60 flex items-center gap-2">
                  <UserOutlined className="text-xs text-primary" /> Nama Lengkap:
                </Text>
                <Text className="font-bold">{customerData.name || '-'}</Text>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-container">
                <Text className="text-on-surface/60 flex items-center gap-2">
                  <PhoneOutlined className="text-xs text-emerald-500" /> Nomor WhatsApp:
                </Text>
                <Text className="font-bold font-mono text-emerald-600">{customerData.whatsapp || '-'}</Text>
              </div>
              <div className="flex justify-between items-center py-2">
                <Text className="text-on-surface/60 flex items-center gap-2">
                  <MailOutlined className="text-xs text-blue-500" /> Email:
                </Text>
                <Text className="font-semibold">{customerData.email || '-'}</Text>
              </div>
            </div>
          </Card>

          {/* Rincian Paket Yang Dibeli */}
          <Card className="border-none rounded-3xl p-6 shadow-md bg-white dark:bg-zinc-900 border border-surface-container">
            <Title level={5} className="!font-manrope mb-4 flex items-center gap-2">
              <ShoppingOutlined className="text-primary" /> Detail Rincian Paket
            </Title>
            <div className="space-y-3 text-sm">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-surface-container">
                  <div>
                    <Text className="font-bold block">{item.title}</Text>
                    {item.variant && <Text className="text-xs text-on-surface/50">{item.variant}</Text>}
                  </div>
                  <Text className="font-bold">Rp {item.price.toLocaleString('id-ID')}</Text>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 text-base">
                <Text className="font-bold">Total Tagihan Pembayaran</Text>
                <Text className="text-2xl font-black text-primary">Rp {totalAmount.toLocaleString('id-ID')}</Text>
              </div>
            </div>
          </Card>

          {/* Tombol Konfirmasi WA */}
          <div className="pt-2">
            <Button
              type="primary"
              size="large"
              block
              className="h-14 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 border-none flex items-center justify-center gap-3 text-base sm:text-lg shadow-xl shadow-emerald-600/30 hover:scale-[1.01] transition-all"
              icon={<WhatsAppOutlined className="text-2xl" />}
              onClick={handleWhatsAppConfirm}
            >
              Konfirmasi Pembayaran via WhatsApp
            </Button>
            <div className="flex items-center justify-center gap-2 mt-3 text-on-surface/50 text-xs">
              <InfoCircleOutlined className="text-emerald-500" />
              <span>Buka aplikasi WhatsApp untuk mengirimkan bukti transfer ke Admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;
