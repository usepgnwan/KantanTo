import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, SaveOutlined } from '@ant-design/icons';
import { changePasswordAPI } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const AdminChangePassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    if (values.new_password !== values.confirm_password) {
      message.error('Konfirmasi password tidak cocok!');
      return;
    }

    if (!user || !user.id) {
      message.error('Sesi login tidak valid. Silakan login kembali.');
      return;
    }

    setLoading(true);
    try {
      await changePasswordAPI(user.id, {
        old_password: values.old_password,
        new_password: values.new_password,
      });
      message.success('Password berhasil diperbarui!');
      form.resetFields();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8">
            <Text className="text-[10px] uppercase font-black tracking-widest text-primary/60 block mb-1">Pengaturan</Text>
            <Title level={1} className="!text-3xl !font-manrope !font-black !m-0">Ubah Password</Title>
          </div>

          <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              className="mt-4"
            >
              <Form.Item
                label={<span className="font-bold text-on-surface dark:text-zinc-300">Password Lama</span>}
                name="old_password"
                rules={[{ required: true, message: 'Masukkan password lama Anda' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-on-surface/40 mr-2" />}
                  placeholder="Password Lama"
                  size="large"
                  className="rounded-xl border-on-surface/10 hover:border-primary focus:border-primary"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-bold text-on-surface dark:text-zinc-300">Password Baru</span>}
                name="new_password"
                rules={[
                  { required: true, message: 'Masukkan password baru Anda' },
                  { min: 6, message: 'Password minimal 6 karakter' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-on-surface/40 mr-2" />}
                  placeholder="Password Baru"
                  size="large"
                  className="rounded-xl border-on-surface/10 hover:border-primary focus:border-primary"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-bold text-on-surface dark:text-zinc-300">Konfirmasi Password Baru</span>}
                name="confirm_password"
                rules={[
                  { required: true, message: 'Konfirmasi password baru Anda' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-on-surface/40 mr-2" />}
                  placeholder="Konfirmasi Password Baru"
                  size="large"
                  className="rounded-xl border-on-surface/10 hover:border-primary focus:border-primary"
                />
              </Form.Item>

              <Form.Item className="mt-8 mb-0 text-right">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                  className="rounded-xl font-bold px-8"
                >
                  Simpan Password
                </Button>
              </Form.Item>
            </Form>
          </Card>

        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChangePassword;
