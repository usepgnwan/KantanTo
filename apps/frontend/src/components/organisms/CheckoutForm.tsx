import React from 'react';
import { Form, Input, Typography, Grid, Button } from 'antd';
import { UserOutlined, MailOutlined, WhatsAppOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

interface CheckoutFormProps {
  onComplete: (values: any) => void;
  initialValues?: {
    name?: string;
    email?: string;
    whatsapp?: string;
  };
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onComplete, initialValues }) => {
  const screens = useBreakpoint();
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    onComplete(values);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <Title level={3} className="!font-manrope !mb-2">Informasi Siswa</Title>
        <Paragraph className="text-on-surface/60">
          Masukkan detail Anda untuk aktivasi paket instan setelah pembayaran.
        </Paragraph>
      </div>

      <Form 
        form={form}
        layout="vertical" 
        className="checkout-form"
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        <Form.Item
          label={<span className="font-bold text-xs uppercase tracking-wider text-on-surface/50">Nama Lengkap</span>}
          name="name"
          rules={[{ required: true, message: 'Mohon masukkan nama lengkap Anda' }]}
        >
          <Input 
            prefix={<UserOutlined className="text-on-surface/20 mr-2" />} 
            placeholder="Contoh: Budi Santoso"
            className="h-14 rounded-2xl bg-surface-low border-none text-lg px-4 focus:bg-white transition-all"
          />
        </Form.Item>

        <div className={`grid ${screens.md ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
          <Form.Item
            label={<span className="font-bold text-xs uppercase tracking-wider text-on-surface/50">Alamat Email</span>}
            name="email"
            rules={[
              { required: true, message: 'Mohon masukkan alamat email' },
              { type: 'email', message: 'Format email tidak valid' }
            ]}
          >
            <Input 
              prefix={<MailOutlined className="text-on-surface/20 mr-2" />} 
              placeholder="budi@example.com"
              className="h-14 rounded-2xl bg-surface-low border-none text-lg px-4 focus:bg-white transition-all"
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-bold text-xs uppercase tracking-wider text-on-surface/50">Nomor WhatsApp</span>}
            name="whatsapp"
            rules={[{ required: true, message: 'Mohon masukkan nomor WhatsApp' }]}
          >
            <Input 
              prefix={<WhatsAppOutlined className="text-on-surface/20 mr-2" />} 
              placeholder="0812xxxx"
              className="h-14 rounded-2xl bg-surface-low border-none text-lg px-4 focus:bg-white transition-all"
            />
          </Form.Item>
        </div>

        <div className="pt-6">
          <Button 
            type="primary" 
            htmlType="submit"
            size="large"
            block
            className="h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform"
          >
            Bayar Sekarang <ArrowRightOutlined />
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CheckoutForm;
