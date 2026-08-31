import React, { useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import { Breadcrumb, Typography, Row, Col } from 'antd';
import CartItemList from '../components/organisms/CartItemList';
import CartSummary from '../components/organisms/CartSummary';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getSetting } from '../services/settingService';

const { Title, Paragraph } = Typography;

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, appliedVoucher, applyVoucher, removeVoucher } = useCart();
  const [ppn, setPpn] = useState<number>(11);

  React.useEffect(() => {
    getSetting().then(config => {
      if (config.ppn !== undefined) {
        setPpn(config.ppn);
      }
    }).catch(console.error);
  }, []);

  const handleRemove = (id: string) => {
    removeFromCart(id);
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * (ppn / 100));
  const total = subtotal + tax;

  return (
    <AppLayout>
      <div className="bg-surface-low/30 pt-32 pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb className="mb-8">
            <Breadcrumb.Item href="/">Beranda</Breadcrumb.Item>
            <Breadcrumb.Item>Keranjang Belanja</Breadcrumb.Item>
          </Breadcrumb>

          <header className="mb-12">
            <Title level={1} className="!text-4xl md:!text-5xl !font-manrope !mb-4">Keranjang Belanja</Title>
            <Paragraph className="text-lg text-on-surface/60 max-w-2xl">
              Satu langkah lagi untuk memulai persiapan terbaik Anda. Tinjau kembali pilihan paket Anda sebelum melakukan pembayaran.
            </Paragraph>
          </header>

          {items.length > 0 ? (
            <Row gutter={[32, 32]}>
              <Col xs={24} lg={16}>
                <CartItemList 
                  items={items} 
                  onRemove={handleRemove} 
                />
              </Col>
              
              <Col xs={24} lg={8}>
                <CartSummary 
                  subtotal={subtotal} 
                  tax={tax} 
                  total={total}
                  ppnRate={ppn}
                  appliedVoucher={appliedVoucher}
                  packageSlug={items[0]?.slug || items[0]?.id}
                  packageSlugs={items.map((i) => i.slug || i.id).filter(Boolean)}
                  onApplyVoucher={applyVoucher}
                  onRemoveVoucher={removeVoucher}
                  onCheckout={() => navigate('/checkout')} 
                />
              </Col>
            </Row>
          ) : (
            <div className="weightless-card bg-surface p-12">
              <CartItemList 
                items={[]} 
                onRemove={handleRemove} 
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default CartPage;
