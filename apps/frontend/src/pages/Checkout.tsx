import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { Breadcrumb, Typography, Row, Col, Steps, Button } from 'antd';
import { LockOutlined, CheckCircleOutlined, UserOutlined, WalletOutlined, ArrowLeftOutlined, RocketFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CheckoutForm from '../components/organisms/CheckoutForm';
import PaymentSection from '../components/organisms/PaymentSection';
import OrderSummarySimple from '../components/molecules/OrderSummarySimple';
import PageLoader from '../components/atoms/PageLoader';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { checkoutAPI } from '../services/checkoutService';
import { getSetting } from '../services/settingService';
import { message } from 'antd';

const { Title, Text, Paragraph } = Typography;

type CheckoutStep = 'form' | 'payment' | 'success';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const { items: cartItems, clearCart, appliedVoucher } = useCart();
  
  const [step, setStep] = useState<CheckoutStep>('form');
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(true);

  const [customerData, setCustomerData] = useState({ name: '', whatsapp: '', email: '' });
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
  const [purchasedTotal, setPurchasedTotal] = useState<number>(0);
  const [ppn, setPpn] = useState<number>(11);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (cartItems.length === 0 && step === 'form') {
      navigate('/pembelian');
      return;
    }
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    getSetting().then(config => {
      if (config.ppn !== undefined) {
        setPpn(config.ppn);
      }
    }).catch(console.error);

    return () => clearTimeout(timer);
  }, [isLoggedIn, cartItems.length, step, navigate]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  let discount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.type === 'percentage') {
      discount = subtotal * (appliedVoucher.value / 100);
    } else {
      discount = appliedVoucher.value;
    }
  }

  const newSubtotal = Math.max(0, subtotal - discount);
  const tax = Math.round(newSubtotal * (ppn / 100));
  const total = newSubtotal + tax;

  const handleFormComplete = async (values: any) => {
    if (!user || cartItems.length === 0) return;

    const currentCart = [...cartItems];
    const currentTotal = total;

    setCustomerData({
      name: values.name || user.name || '',
      whatsapp: values.whatsapp || user.phone || '',
      email: values.email || user.email || '',
    });
    setPurchasedItems(currentCart);
    setPurchasedTotal(currentTotal);
    
    setLoading(true);
    try {
      const res = await checkoutAPI({
        user_id: user.id,
        package_slug: currentCart[0].slug || currentCart[0].id,
        voucher_code: appliedVoucher?.code,
      });
      setOrderNumber(res.invoice_code || res.order_id);
      setStep('payment');
      clearCart();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal melakukan checkout');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  if (step === 'success') {
    return (
      <AppLayout>
        <div className="bg-surface-low/30 pt-32 pb-24 min-h-screen flex items-center justify-center">
          <div className="max-w-2xl w-full px-4 animate-in zoom-in-95 duration-700">
            <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-primary/5 text-center space-y-8 border border-on-surface/5">
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                        <CheckCircleOutlined className="text-white text-5xl" />
                    </div>
                </div>
                
                <div className="space-y-4">
                    <Title level={1} className="!text-3xl md:!text-5xl !font-manrope !m-0 !font-black tracking-tight">Pembayaran Berhasil!</Title>
                    <Paragraph className="text-lg text-on-surface/60 max-w-md mx-auto">
                        Terima kasih! Pesanan <span className="font-bold text-on-surface">{orderNumber}</span> telah kami terima. Akses materi Anda telah aktif secara otomatis.
                    </Paragraph>
                </div>

                <div className="bg-surface-low rounded-3xl p-6 flex items-center flex-wrap justify-between gap-4">
                    <div className="text-left">
                        <Text className="text-[10px] uppercase font-bold text-on-surface/40 block">Total Pembayaran</Text>
                        <Text className="text-xl font-black text-primary">Rp {total.toLocaleString('id-ID')}</Text>
                    </div>
                    <div className="text-right">
                        <Text className="text-[10px] uppercase font-bold text-on-surface/40 block">Metode Pembayaran</Text>
                        <Text className="text-sm font-bold">QRIS (Otomatis)</Text>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <Button 
                        type="primary" 
                        size="large" 
                        block 
                        className="h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
                        onClick={() => navigate('/dashboard')}
                    >
                        <RocketFilled /> Mulai Belajar
                    </Button>
                    <Button 
                        size="large" 
                        block 
                        className="h-14 rounded-2xl font-bold text-lg border-on-surface/10 hover:bg-surface-low"
                        onClick={() => navigate('/')}
                    >
                        Ke Beranda
                    </Button>
                </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-surface-low/30 pt-24 pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
              <div className="space-y-4">
                <Breadcrumb>
                  <Breadcrumb.Item href="/">Beranda</Breadcrumb.Item>
                  <Breadcrumb.Item href="/keranjang">Keranjang</Breadcrumb.Item>
                  <Breadcrumb.Item>Checkout</Breadcrumb.Item>
                </Breadcrumb>
                <div className="flex items-center gap-4">
                  <Button 
                    icon={<ArrowLeftOutlined />} 
                    type="text" 
                    className="md:hidden"
                    onClick={() => step === 'payment' ? setStep('form') : navigate('/keranjang')}
                  />
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <LockOutlined className="text-primary text-2xl" />
                  </div>
                  <Title level={1} className="!text-3xl md:!text-5xl !font-manrope !m-0 tracking-tight !font-bold">Checkout</Title>
                </div>
              </div>

              <div className="w-full md:w-[450px]">
                <Steps
                  current={step === 'form' ? 0 : step === 'payment' ? 1 : 2}
                  size="small"
                  items={[
                    { title: 'Informasi', icon: <UserOutlined /> },
                    { title: 'Pembayaran', icon: <WalletOutlined /> },
                    { title: 'Selesai', icon: <CheckCircleOutlined /> },
                  ]}
                />
              </div>
            </div>
          </header>

          <Row gutter={[64, 48]} className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <Col xs={24} lg={15}>
              <div className="min-h-[500px]">
                {step === 'form' ? (
                  <CheckoutForm 
                    onComplete={handleFormComplete} 
                    initialValues={{
                      name: user?.name,
                      email: user?.email,
                      whatsapp: user?.phone
                    }}
                  />
                ) : (
                  <PaymentSection 
                    orderNumber={orderNumber} 
                    customerData={customerData}
                    cartItems={purchasedItems}
                    totalAmount={purchasedTotal}
                  />
                )}
              </div>
            </Col>
            
            <Col xs={24} lg={9}>
              <div className="space-y-6 sticky top-24">
                <OrderSummarySimple 
                  items={step === 'payment' ? purchasedItems : cartItems} 
                  total={step === 'payment' ? purchasedTotal : total} 
                  discount={discount} 
                  voucherCode={appliedVoucher?.code} 
                />
                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex gap-4 items-start">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <CheckCircleOutlined className="text-primary text-xl" />
                    </div>
                    <div className="space-y-1">
                        <Text className="block font-bold text-sm">Jaminan Akses Instan</Text>
                        <Text className="text-xs text-on-surface/60 block leading-relaxed">
                            Gunakan metode <span className="font-bold text-primary">QRIS</span> untuk mendapatkan akses secara otomatis.
                        </Text>
                    </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </AppLayout>
  );
};

export default CheckoutPage;
