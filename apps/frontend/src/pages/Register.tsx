import React, { useState } from 'react';
import { Form, Input, Button, Divider, Typography, Checkbox, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, WhatsAppOutlined, GoogleOutlined, AppleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import authVisual from '../assets/login.png';
import PageLoader from '../components/atoms/PageLoader';
import { registerUser } from '../services/userService';

const { Text } = Typography;

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        nohp: values.whatsapp,
        password: values.password,
      });

      message.success('Registrasi berhasil! Silakan masuk dengan akun Anda.');
      setPageLoading(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Gagal melakukan pendaftaran. Silahkan coba lagi nanti.');
      }
    } finally {
      if (!pageLoading) setLoading(false);
    }
  };

  if (pageLoading) return <PageLoader />;

  return (
    <AuthLayout
      title="Buat Akun Anda"
      subtitle="Bergabunglah dengan ribuan siswa lainnya dan mulai raih impian masuk PTN idaman."
      image={authVisual}
      quote={{
        text: "Buat akun untuk mulai menggunakan tryout",
        author: "Rifaya Education",
      }}
    >
      <Form
        name="register"
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        className="space-y-1"
      >
        <Form.Item
          name="name"
          label={<span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Nama Lengkap</span>}
          rules={[{ required: true, message: 'Mohon masukkan nama lengkap Anda!' }]}
        >
          <Input
            prefix={<UserOutlined className="text-on-surface/20 mr-2" />}
            placeholder="Contoh: Budi Santoso"
            className="h-12 rounded-xl bg-surface-low border-none px-4 focus:bg-white transition-all"
          />
        </Form.Item>

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
          name="whatsapp"
          label={<span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Nomor WhatsApp</span>}
          rules={[{ required: true, message: 'Mohon masukkan nomor WhatsApp Anda!' }]}
        >
          <Input
            prefix={<WhatsAppOutlined className="text-on-surface/20 mr-2" />}
            placeholder="0812xxxx"
            className="h-12 rounded-xl bg-surface-low border-none px-4 focus:bg-white transition-all"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40">Kata Sandi</span>}
          rules={[{ required: true, message: 'Mohon buat kata sandi Anda!' }, { min: 6, message: 'Sandi minimal 6 karakter!' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-on-surface/20 mr-2" />}
            placeholder="Minimal 6 karakter"
            className="h-12 rounded-xl bg-surface-low border-none px-4 focus:bg-white transition-all"
          />
        </Form.Item>

        <Form.Item name="agreement" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject('Mohon setujui syarat & ketentuan') }]} className="mb-8">
          <Checkbox className="text-xs text-on-surface/60 font-medium">
            Saya setuju dengan <Link to="/terms" className="text-primary font-bold">Syarat & Ketentuan</Link> yang berlaku.
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            className="h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform"
          >
            Daftar Sekarang
          </Button>
        </Form.Item>

        <div className="mt-8">
          <Divider plain className="!border-on-surface/5">
            <Text className="text-[10px] uppercase tracking-[0.2em] text-on-surface/30 font-bold">Atau Daftar Dengan</Text>
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
            Sudah memiliki akun?{' '}
            <Link to="/login" className="font-bold text-primary">Masuk Disini</Link>
          </Text>
        </div>
      </Form>
    </AuthLayout>
  );
};

export default RegisterPage;
