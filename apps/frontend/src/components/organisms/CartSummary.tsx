import React from 'react';
import { Typography, Button, Input, Divider, message, Tag } from 'antd';
import { SafetyCertificateOutlined, ArrowRightOutlined } from '@ant-design/icons';

import { Voucher, applyVoucherAPI } from '../../services/voucherService';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

interface CartSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
  ppnRate: number;
  appliedVoucher: Voucher | null;
  onApplyVoucher: (voucher: Voucher) => void;
  onRemoveVoucher: () => void;
  onCheckout: () => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({ subtotal, tax, total, ppnRate, appliedVoucher, onApplyVoucher, onRemoveVoucher, onCheckout }) => {
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { user } = useAuth();
  
  const handleApply = async () => {
    if (!code.trim()) return;
    if (!user) {
      message.error('Anda harus login terlebih dahulu');
      return;
    }
    
    setLoading(true);
    try {
      // payload expects user_id
      const v = await applyVoucherAPI(code.trim(), user.id);
      onApplyVoucher(v);
      message.success('Voucher berhasil digunakan!');
      setCode('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Kode voucher tidak valid';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  let discount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.type === 'percentage') {
      discount = subtotal * (appliedVoucher.value / 100);
    } else {
      discount = appliedVoucher.value;
    }
  }
  
  // Recalculate tax and total with discount
  const newSubtotal = Math.max(0, subtotal - discount);
  const newTax = Math.round(newSubtotal * (ppnRate / 100));
  const newTotal = newSubtotal + newTax;

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
        
        {ppnRate > 0 && (
          <div className="flex justify-between items-center">
            <Text className="text-on-surface/60">PPN ({ppnRate}%)</Text>
            <Text className="font-semibold">{formatCurrency(newTax)}</Text>
          </div>
        )}
        
        <div className="pt-2">
          <Text className="text-xs text-on-surface/40 block mb-2 uppercase tracking-wider font-bold">Kupon / Promo</Text>
          {appliedVoucher ? (
            <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-200">
              <div>
                <Text className="font-bold text-green-700 block text-sm">{appliedVoucher.code}</Text>
                <Text className="text-xs text-green-600">
                  Potongan {appliedVoucher.type === 'percentage' ? `${appliedVoucher.value}%` : formatCurrency(appliedVoucher.value)}
                </Text>
              </div>
              <Button type="text" danger size="small" onClick={onRemoveVoucher} className="font-bold">Hapus</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input 
                placeholder="Kode Promo" 
                className="rounded-xl h-10 bg-surface-low border-none" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onPressEnter={handleApply}
              />
              <Button 
                className="rounded-xl h-10 font-bold px-4" 
                onClick={handleApply}
                loading={loading}
              >
                Terapkan
              </Button>
            </div>
          )}
        </div>
        
        <Divider className="my-4" />
        
        {appliedVoucher && (
          <div className="flex justify-between items-center mb-2">
            <Text className="text-green-600 font-bold">Diskon</Text>
            <Text className="text-green-600 font-bold">-{formatCurrency(discount)}</Text>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-2">
          <Text className="font-bold text-lg">Total</Text>
          <Text className="font-black text-xl text-primary">{formatCurrency(newTotal)}</Text>
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
