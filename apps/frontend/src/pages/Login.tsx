import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Divider, Typography, message } from 'antd';
import { MailOutlined, LockOutlined, GoogleOutlined, AppleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import authVisual from '../assets/auth-visual.png';
import PageLoader from '../components/atoms/PageLoader';
import { loginUser } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const { Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const result = await loginUser({ email: values.email, password: values.password });

      // Persist token in AuthContext (also saves to localStorage internally)
      login(result.token);

      message.success('Login berhasil! Mengalihkan...');
      setPageLoading(true);

      // Redirect based on roleid
      setTimeout(() => {
        if (result.roleid === 1) {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 800);

    } catch (error: any) {
      const msg = error.response?.data?.message || 'Terjadi kesalahan. Coba lagi nanti.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <PageLoader />;

  return (
    <AuthLayout
      title="Selamat Datang Kembali"
      subtitle="Masuk untuk mengakses materi belajar dan riwayat tryout Anda."
      image={authVisual}
      quote={{
        text: "Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan, Anda dapat mengubah dunia.",
        author: "Nelson Mandela"
      }}
    >
      <Form
        name="login"
        layout="vertical"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        requiredMark={false}
        className="space-y-1"
      >
        <Form.Item
          name="email"
          label={<span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Alamat Email</span>}
          rules={[{ required: true, message: 'Mohon masukkan email Anda!' }, { type: 'email', message: 'Format email tidak valid!' }]}
        >
          <Input
            prefix={<MailOutlined className="text-on-surface/20 mr-2" />}
            placeholder="nama@email.com"
            className="h-12 rounded-xl bg-surface-low border-none px-4 focus:bg-white transition-all"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={
            <div className="flex justify-between w-full items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Kata Sandi</span>
              <Link to="/forgot-password" className="text-[10px] font-bold text-primary uppercase tracking-wider">Lupa Sandi?</Link>
            </div>
          }
          rules={[{ required: true, message: 'Mohon masukkan kata sandi Anda!' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-on-surface/20 mr-2" />}
            placeholder="Masukkan kata sandi"
            className="h-12 rounded-xl bg-surface-low border-none px-4 focus:bg-white transition-all"
          />
        </Form.Item>

        <Form.Item name="remember" valuePropName="checked" className="mb-8">
          <Checkbox className="text-xs text-on-surface/60 font-medium">Biarkan saya tetap masuk</Checkbox>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            className="h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform"
          >
            Masuk Sekarang
          </Button>
        </Form.Item>

        <div className="mt-8">
          <Divider plain className="!border-on-surface/5">
            <Text className="text-[10px] uppercase tracking-[0.2em] text-on-surface/30 font-bold">Atau Lanjut Dengan</Text>
          </Divider>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button className="h-11 rounded-xl border-on-surface/5 flex items-center justify-center gap-2 font-semibold hover:bg-surface-low transition-all text-xs">
              <GoogleOutlined className="text-red-500" /> Google
            </Button>
            <Button className="h-11 rounded-xl border-on-surface/5 flex items-center justify-center gap-2 font-semibold hover:bg-surface-low transition-all text-xs">
              <AppleOutlined /> Apple
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center pt-4">
          <Text className="text-sm text-on-surface/60">
            Belum punya akun?{' '}
            <Link to="/register" className="font-bold text-primary">Daftar Gratis</Link>
          </Text>
        </div>
      </Form>
    </AuthLayout>
  );
};

export default LoginPage;


