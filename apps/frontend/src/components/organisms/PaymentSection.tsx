import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Badge } from 'antd';
import { CheckCircleOutlined, InfoCircleOutlined, LoadingOutlined, CopyOutlined } from '@ant-design/icons';
import qrisPlaceholder from '../../assets/qris-placeholder.png';

const { Title, Text, Paragraph } = Typography;

interface PaymentSectionProps {
  orderNumber: string;
  onSuccess: () => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({ orderNumber, onSuccess }) => {
  const [status, setStatus] = useState<'waiting' | 'success'>('waiting');

  useEffect(() => {
    // Simulate automatic status change after 8 seconds
    const timer = setTimeout(() => {
      setStatus('success');
      onSuccess();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onSuccess]);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    // You could add a toast notification here
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="flex justify-between items-start">
        <div>
          <Title level={3} className="!font-manrope !mb-2">Selesaikan Pembayaran</Title>
          <div className="flex items-center gap-2">
            <Text className="text-on-surface/60">ID Pesanan:</Text>
            <div className="bg-surface-low px-3 py-1 rounded-lg flex items-center gap-2 border border-on-surface/5">
              <Text className="font-mono font-bold text-primary">{orderNumber}</Text>
              <CopyOutlined 
                className="text-xs cursor-pointer hover:text-primary transition-colors" 
                onClick={copyOrderNumber}
              />
            </div>
          </div>
        </div>
        <Badge 
          status={status === 'waiting' ? 'processing' : 'success'} 
          text={
            <span className={`font-bold uppercase tracking-widest text-xs ${status === 'waiting' ? 'text-blue-500' : 'text-green-500'}`}>
              {status === 'waiting' ? 'Menunggu Pembayaran' : 'Pembayaran Berhasil'}
            </span>
          }
          className="bg-white px-4 py-2 rounded-full border border-on-surface/5 shadow-sm"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* QR Code Container */}
        <div className="w-full md:w-80 flex-shrink-0">
          <Card className={`border-none glass rounded-3xl overflow-hidden p-6 text-center shadow-xl transition-all duration-1000 ${status === 'success' ? 'opacity-40 grayscale-[0.5]' : 'shadow-primary/10'}`}>
            <div className="bg-white rounded-2xl p-4 mb-4 relative">
              <img 
                src={qrisPlaceholder} 
                alt="QRIS Payment" 
                className="w-full aspect-square object-contain"
              />
              {status === 'success' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                   <CheckCircleOutlined className="text-6xl text-green-500 animate-in zoom-in duration-500" />
                </div>
              )}
            </div>
            <Text className="text-xs font-bold uppercase tracking-widest text-primary">Scan QRIS Untuk Bayar</Text>
          </Card>
        </div>

        {/* Instructions / Success Message */}
        <div className="flex-grow space-y-6">
          {status === 'waiting' ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <Title level={5} className="!font-manrope">Instruksi Pembayaran:</Title>
                <div className="space-y-4">
                  {[
                    'Scan QR Code di atas menggunakan aplikasi e-wallet atau mobile banking Anda.',
                    'Pastikan nominal sesuai dengan total pesanan.',
                    'Lakukan konfirmasi PIN di aplikasi Anda.',
                    'Halaman ini akan otomatis diperbarui setelah pembayaran diterima.'
                  ].map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>
                      <Text className="text-sm">{step}</Text>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="border-none bg-blue-50/50 rounded-2xl p-4 flex gap-3 items-center">
                 <LoadingOutlined className="text-primary text-xl" />
                 <Text className="text-xs font-medium text-blue-800">
                   Sistem sedang memantau pembayaran Anda secara real-time...
                 </Text>
              </Card>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-700">
               <div className="p-8 rounded-3xl bg-green-50 border border-green-100 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                    <CheckCircleOutlined className="text-3xl text-white" />
                  </div>
                  <Title level={3} className="!font-manrope !m-0 !text-green-800">Pembayaran Diterima!</Title>
                  <Paragraph className="text-green-700/80">
                    Terima kasih telah melakukan pembayaran. Paket simulasi Anda telah diaktifkan secara otomatis.
                  </Paragraph>
                  <Button 
                    type="primary" 
                    size="large" 
                    className="bg-green-600 border-none hover:bg-green-700 h-14 rounded-2xl px-12 font-bold"
                    onClick={() => window.location.href = '/'}
                  >
                    Mulai Belajar Sekarang
                  </Button>
               </div>
            </div>
          )}

          <Card className="border-none bg-surface-low rounded-2xl p-4 flex gap-3">
             <InfoCircleOutlined className="text-primary text-lg" />
             <Text className="text-xs text-on-surface/60 italic">
               Butuh bantuan? Screenshot halaman ini dan kirimkan ke WhatsApp support kami untuk bantuan manual.
             </Text>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;
