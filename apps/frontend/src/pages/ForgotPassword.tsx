import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import authVisual from '../assets/auth-visual.png';
import { forgotPassword } from '../services/userService';

const { Text } = Typography;

const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await forgotPassword(values.email);
      setEmail(values.email);
      setSent(true);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Terjadi kesalahan. Coba lagi nanti.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Lupa Kata Sandi?"
      subtitle="Masukkan email yang terdaftar dan kami akan mengirimkan link untuk mereset password Anda."
      image={authVisual}
      quote={{
        text: "Kegagalan adalah bumbu yang memberi rasa pada keberhasilan.",
        author: "Truman Capote"
      }}
    >
      {sent ? (
        <Result
          status="success"
          title="Link Reset Password Telah Dikirim!"
          subTitle={
            <div className="text-on-surface/60">
              <p>Kami telah mengirimkan email ke <b className="text-primary">{email}</b>.</p>
              <p className="mt-2">Silakan cek inbox (atau folder spam) Anda dan klik link reset password yang kami kirim.</p>
              <p className="mt-4 text-xs text-on-surface/40">Link berlaku selama <b>10 menit</b>.</p>
            </div>
          }
          extra={[
            <Link to="/login" key="login">
              <Button type="primary" className="h-11 rounded-xl font-bold px-8">
                <ArrowLeftOutlined /> Kembali ke Login
              </Button>
            </Link>
          ]}
          className="!p-0"
        />
      ) : (
        <Form
          name="forgot-password"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="space-y-1"
        >
          <Form.Item
            name="email"
            label={<span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Alamat Email</span>}
            rules={[
              { required: true, message: 'Mohon masukkan email Anda!' },
              { type: 'email', message: 'Format email tidak valid!' }
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-on-surface/20 mr-2" />}
              placeholder="nama@email.com"
              className="h-12 rounded-xl bg-surface-low border-none px-4 focus:bg-white transition-all"
            />
          </Form.Item>

          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform"
            >
              Kirim Link Reset Password
            </Button>
          </Form.Item>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-bold text-primary hover:underline">
              <ArrowLeftOutlined className="mr-1" /> Kembali ke Halaman Login
            </Link>
          </div>
        </Form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
