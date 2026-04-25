import React, { useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import { Breadcrumb, Typography, Row, Col } from 'antd';
import CartItemList from '../components/organisms/CartItemList';
import CartSummary from '../components/organisms/CartSummary';

const { Title, Paragraph } = Typography;

const CartPage: React.FC = () => {
  const [items, setItems] = useState([
    {
      id: '1',
      title: 'Intensive SNBT 2024 - Saintek Pro',
      variant: 'Akses 30 Hari • 15 Sesi LIVE',
      price: 75000,
      image: 'https://images.unsplash.com/photo-1434031211128-095490e7e7e9?auto=format&fit=crop&q=80&w=800',
      quantity: 1,
    },
    {
      id: '2',
      title: 'Mock Tryout Akbar - Sistem IRT',
      variant: 'Sekali Pengerjaan • Pembahasan Lengkap',
      price: 25000,
      image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800',
      quantity: 1,
    },
  ]);

  const handleRemove = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.11);
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
                  onUpdateQuantity={handleUpdateQuantity} 
                />
              </Col>
              
              <Col xs={24} lg={8}>
                <CartSummary 
                  subtotal={subtotal} 
                  tax={tax} 
                  total={total} 
                  onCheckout={() => alert('Proceeding to checkout...')} 
                />
              </Col>
            </Row>
          ) : (
            <div className="weightless-card bg-surface p-12">
              <CartItemList 
                items={[]} 
                onRemove={handleRemove} 
                onUpdateQuantity={handleUpdateQuantity} 
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default CartPage;
