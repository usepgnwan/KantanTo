import React from 'react';
import { Card, Form, Input, Button, Typography, Space, message, Divider, Row, Col } from 'antd';
import {
  SettingOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
  MailOutlined,
  WhatsAppOutlined,
  SaveOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import AdminLayout from '../../layouts/AdminLayout';

const { Title, Text } = Typography;
const { TextArea } = Input;

const AdminSettings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Settings saved:', values);
    message.success('Konfigurasi aplikasi berhasil diperbarui');
  };

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8">
            <Text className="text-[10px] uppercase font-black tracking-widest text-primary/60 block mb-1">System Configuration</Text>
            <Title level={1} className="!text-3xl !font-manrope !font-black !m-0 dark:text-zinc-100">Pengaturan Aplikasi</Title>
            <Text className="text-on-surface/50 dark:text-zinc-400 text-sm">Kelola informasi publik dan kontak bantuan platform</Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              appName: 'Kantan Tryout',
              appDescription: 'Platform tryout SNBT pilihan nomor satu untuk pejuang PTN.',
              address: 'Jl. Pendidikan No. 123, Jakarta Selatan, DKI Jakarta',
              email: 'halo@kantan.id',
              whatsapp: '081234567890',
            }}
          >
            <Space direction="vertical" size="large" className="w-full">

              {/* General Info */}
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 p-2">
                <Title level={4} className="!font-manrope !font-black !mb-6 flex items-center gap-3">
                  <InfoCircleOutlined className="text-primary" /> Informasi Umum
                </Title>

                <Form.Item name="appName" label={<span className="font-bold text-sm">Nama Aplikasi</span>} rules={[{ required: true }]}>
                  <Input prefix={<GlobalOutlined className="text-on-surface/20" />} className="h-12 rounded-2xl" />
                </Form.Item>

                <Form.Item name="appDescription" label={<span className="font-bold text-sm">Deskripsi Singkat</span>}>
                  <TextArea rows={4} className="rounded-2xl p-4" placeholder="Jelaskan tentang platform ini..." />
                </Form.Item>
              </Card>

              {/* Contact Info */}
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 p-2">
                <Title level={4} className="!font-manrope !font-black !mb-6 flex items-center gap-3">
                  <WhatsAppOutlined className="text-green-500" /> Kontak & Alamat
                </Title>

                <Form.Item name="address" label={<span className="font-bold text-sm">Alamat Kantor</span>}>
                  <Input prefix={<EnvironmentOutlined className="text-on-surface/20" />} className="h-12 rounded-2xl" />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="email" label={<span className="font-bold text-sm">Email Support</span>} rules={[{ type: 'email' }]}>
                      <Input prefix={<MailOutlined className="text-on-surface/20" />} className="h-12 rounded-2xl" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="whatsapp" label={<span className="font-bold text-sm">No. WhatsApp Bantuan</span>}>
                      <Input prefix={<WhatsAppOutlined className="text-on-surface/20" />} className="h-12 rounded-2xl" placeholder="Cth: 0812..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Save Footer */}
              <div className="flex justify-end pt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<SaveOutlined />}
                  className="rounded-2xl h-14 px-10 font-black shadow-xl shadow-primary/20 text-lg"
                >
                  Simpan Perubahan
                </Button>
              </div>

            </Space>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
