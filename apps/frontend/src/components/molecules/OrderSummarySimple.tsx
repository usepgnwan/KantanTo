import React from 'react';
import { Typography, Space } from 'antd';

const { Text, Title } = Typography;

interface SummaryItem {
  id: string;
  title: string;
  price: number;
}

interface OrderSummarySimpleProps {
  items: SummaryItem[];
  total: number;
  discount?: number;
  voucherCode?: string;
}

const OrderSummarySimple: React.FC<OrderSummarySimpleProps> = ({ items, total, discount = 0, voucherCode }) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className="weightless-card p-6">
      <Title level={5} className="!font-manrope !mb-4 uppercase tracking-wider text-xs text-on-surface/40">Rincian Pesanan</Title>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-start gap-4">
            <Text className="text-sm font-medium line-clamp-2">{item.title}</Text>
            <Text className="text-sm border-on-surface/10">{formatCurrency(item.price)}</Text>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-dashed border-on-surface/10 space-y-3">
        {voucherCode && discount > 0 && (
          <div className="flex justify-between items-center">
            <Text className="text-green-600 font-bold">Promo ({voucherCode})</Text>
            <Text className="text-green-600 font-bold">-{formatCurrency(discount)}</Text>
          </div>
        )}
        <div className="flex justify-between items-center">
          <Text className="font-bold">Total Pembayaran</Text>
          <Text className="text-xl font-bold text-primary">{formatCurrency(total)}</Text>
        </div>
      </div>
    </div>
  );
};

export default OrderSummarySimple;
