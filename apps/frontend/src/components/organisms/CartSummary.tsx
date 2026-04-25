import React from 'react';
import { Typography, Button, Input, Divider } from 'antd';
import { SafetyCertificateOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface CartSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  onCheckout: () => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({ subtotal, tax, total, onCheckout }) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className="weightless-card p-6 sticky top-24">
      <Title level={4} className="!font-manrope !mb-6">Ringkasan Pesanan</Title>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Text className="text-on-surface/60">Subtotal</Text>
          <Text className="font-semibold">{formatCurrency(subtotal)}</Text>
        </div>
        
        <div className="flex justify-between items-center">
          <Text className="text-on-surface/60">PPN (11%)</Text>
          <Text className="font-semibold">{formatCurrency(tax)}</Text>
        </div>
        
        <div className="pt-2">
          <Text className="text-xs text-on-surface/40 block mb-2 uppercase tracking-wider font-bold">Kupon / Promo</Text>
          <div className="flex gap-2">
            <Input 
              placeholder="Kode Promo" 
              className="rounded-xl h-10 bg-surface-low border-none" 
            />
            <Button className="rounded-xl h-10 font-bold px-4">Terapkan</Button>
          </div>
        </div>
        
        <Divider className="my-4" />
        
        <div className="flex justify-between items-center mb-6">
          <Text className="text-lg font-bold">Total</Text>
          <Text className="text-2xl font-bold text-primary">{formatCurrency(total)}</Text>
        </div>
        
        <Button 
          type="primary" 
          block 
          size="large" 
          onClick={onCheckout}
          className="rounded-full h-12 font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
        >
          Bayar Sekarang <ArrowRightOutlined />
        </Button>
        
        <div className="flex items-center justify-center gap-2 mt-6 text-on-surface/40 text-xs">
          <SafetyCertificateOutlined className="text-lg text-green-500" />
          <Text className="text-inherit">Pembayaran Aman & Terenkripsi</Text>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
