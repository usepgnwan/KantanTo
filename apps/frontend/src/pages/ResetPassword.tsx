import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Result } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import authVisual from '../assets/auth-visual.png';
import { resetPassword } from '../services/userService';

const { Text } = Typography;

const ResetPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const onFinish = async (values: any) => {
    if (!token) {
      message.error('Token reset password tidak ditemukan. Silakan minta link reset baru.');
      return;
    }

    if (values.password !== values.confirm_password) {
      message.error('Konfirmasi password tidak cocok!');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, values.password);
      setSuccess(true);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Terjadi kesalahan. Coba lagi nanti.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Kata Sandi"
      subtitle="Masukkan kata sandi baru untuk akun Anda."
      image={authVisual}
      quote={{
        text: "Setiap hari adalah kesempatan baru untuk menjadi lebih baik.",
        author: "Unknown"
      }}
    >
      {success ? (
        <Result
          status="success"
          title="Password Berhasil Direset!"
          subTitle="Kata sandi Anda telah berhasil diperbarui. Silakan login dengan password baru."
          extra={[
            <Link to="/login" key="login">
              <Button type="primary" className="h-11 rounded-xl font-bold px-8">
                Login Sekarang
              </Button>
            </Link>
          ]}
          className="!p-0"
        />
      ) : !token ? (
        <Result
          status="error"
          title="Token Tidak Valid"
          subTitle="Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link reset baru."
          extra={[
            <Link to="/forgot-password" key="forgot">
              <Button type="primary" className="h-11 rounded-xl font-bold px-8">
                Minta Link Reset Baru
              </Button>
            </Link>
          ]}
          className="!p-0"
        />
      ) : (
        <Form
          name="reset-password"
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          className="space-y-1"
        >
          <Form.Item
            name="password"
            label={<span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Kata Sandi Baru</span>}
            rules={[
              { required: true, message: 'Mohon masukkan kata sandi baru!' },
              { min: 6, message: 'Kata sandi minimal 6 karakter!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-on-surface/20 mr-2" />}
              placeholder="Masukkan kata sandi baru"
              className="h-12 rounded-xl bg-surface-low border-none px-4 focus:bg-white transition-all"
            />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label={<span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Konfirmasi Kata Sandi</span>}
            rules={[
              { required: true, message: 'Mohon konfirmasi kata sandi!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-on-surface/20 mr-2" />}
              placeholder="Ketik ulang kata sandi baru"
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
              Reset Password
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

export default ResetPassword;
