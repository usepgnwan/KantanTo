import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, Form, Input, Button, Typography, Space, message, Row, Col, Spin, Tooltip, Tag } from 'antd';
import {
  SettingOutlined, InfoCircleOutlined, EnvironmentOutlined, MailOutlined,
  WhatsAppOutlined, SaveOutlined, GlobalOutlined, BoldOutlined,
  ItalicOutlined, UnderlineOutlined, OrderedListOutlined, UnorderedListOutlined,
  CodeOutlined, AlignCenterOutlined
} from '@ant-design/icons';
import AdminLayout from '../../layouts/AdminLayout';
import { getSetting, updateSetting } from '../../services/settingService';

const { Title, Text } = Typography;

// Toolbar button mimic
const ToolBtn: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <Tooltip title={label} mouseEnterDelay={0.5}>
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all text-on-surface/60 hover:bg-surface-low dark:hover:bg-zinc-700 hover:text-on-surface"
    >
      {icon}
    </button>
  </Tooltip>
);

const AdminSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [body, setBody] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const config = await getSetting();
        setBody(config.deskripsi);
        form.setFieldsValue({
          appName: config.nama_aplikasi,
          address: config.alamat,
          email: config.email,
          whatsapp: config.no_wa,
        });
      } catch (error) {
        message.error('Gagal memuat konfigurasi sistem');
      } finally {
        setLoading(false);
      }
    };

    fetchSetting();
  }, [form]);

  const insertAtCursor = useCallback((before: string, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.substring(start, end);
    const newBody = body.substring(0, start) + before + selected + after + body.substring(end);
    setBody(newBody);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  }, [body]);

  const toolbar = [
    { icon: <BoldOutlined />, label: 'Bold (**text**)', action: () => insertAtCursor('**', '**') },
    { icon: <ItalicOutlined />, label: 'Italic (_text_)', action: () => insertAtCursor('_', '_') },
    { icon: <UnderlineOutlined />, label: 'Heading ##', action: () => insertAtCursor('\n## ', '') },
    { icon: <OrderedListOutlined />, label: 'Ordered list', action: () => insertAtCursor('\n1. ', '') },
    { icon: <UnorderedListOutlined />, label: 'Unordered list', action: () => insertAtCursor('\n- ', '') },
    { icon: <CodeOutlined />, label: 'Inline kode', action: () => insertAtCursor('`', '`') },
    { icon: <AlignCenterOutlined />, label: 'Heading ###', action: () => insertAtCursor('\n### ', '') },
  ];

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        nama_aplikasi: values.appName,
        deskripsi: body,
        alamat: values.address,
        email: values.email,
        no_wa: values.whatsapp,
      };

      await updateSetting(payload);
      message.success('Konfigurasi aplikasi berhasil diperbarui');
    } catch (error) {
      message.error('Gagal memperbarui konfigurasi sistem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8">
            <Text className="text-[10px] uppercase font-black tracking-widest text-primary/60 block mb-1">System Configuration</Text>
            <Title level={1} className="!text-3xl !font-manrope !font-black !m-0 dark:text-zinc-100 flex items-center gap-3">
              <SettingOutlined /> Pengaturan Aplikasi
            </Title>
            <Text className="text-on-surface/50 dark:text-zinc-400 text-sm">Kelola informasi publik dan kontak bantuan platform</Text>
          </div>

          <Spin spinning={loading} tip="Memuat Konfigurasi...">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
            >
              <Space direction="vertical" size="large" className="w-full">

                {/* General Info */}
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 p-2">
                  <Title level={4} className="!font-manrope !font-black !mb-6 flex items-center gap-3">
                    <InfoCircleOutlined className="text-primary" /> Informasi Umum
                  </Title>

                  <Form.Item name="appName" label={<span className="font-bold text-sm">Nama Aplikasi</span>} rules={[{ required: true }]}>
                    <Input prefix={<GlobalOutlined className="text-on-surface/20" />} className="h-12 rounded-2xl" placeholder="Masukan nama platform" />
                  </Form.Item>

                  <div className="mb-6">
                    <Text className="font-bold text-sm mb-2 block">Deskripsi Singkat (Markdown Editor)</Text>
                    <div className="border border-on-surface/10 rounded-2xl overflow-hidden focus-within:border-primary transition-colors">
                      {/* Editor Toolbar */}
                      <div className="flex items-center gap-1 flex-wrap px-4 py-2 border-b border-on-surface/10 bg-surface-low/50 dark:bg-zinc-800/50">
                        {toolbar.map((t, i) => (
                          <React.Fragment key={i}>
                            <ToolBtn icon={t.icon} label={t.label} onClick={t.action} />
                          </React.Fragment>
                        ))}
                        <div className="ml-auto">
                          <Tag className="rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-none font-bold text-[10px] px-2 m-0">
                            Markdown support
                          </Tag>
                        </div>
                      </div>
                      
                      {/* Textarea */}
                      <textarea
                        ref={textareaRef}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="w-full bg-transparent text-on-surface dark:text-zinc-100 font-sans text-sm p-4 outline-none resize-y min-h-[150px]"
                        placeholder="Jelaskan tentang platform ini menggunakan opsi pemformatan teks di atas..."
                      />
                    </div>
                  </div>
                </Card>

                {/* Contact Info */}
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-zinc-900 p-2">
                  <Title level={4} className="!font-manrope !font-black !mb-6 flex items-center gap-3">
                    <WhatsAppOutlined className="text-green-500" /> Kontak & Alamat
                  </Title>

                  <Form.Item name="address" label={<span className="font-bold text-sm">Alamat Kantor</span>}>
                    <Input prefix={<EnvironmentOutlined className="text-on-surface/20" />} className="h-12 rounded-2xl" placeholder="Alamat lengkap" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item name="email" label={<span className="font-bold text-sm">Email Support</span>} rules={[{ type: 'email' }]}>
                        <Input prefix={<MailOutlined className="text-on-surface/20" />} className="h-12 rounded-2xl" placeholder="example@mail.com" />
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
                    loading={submitting}
                    icon={<SaveOutlined />}
                    className="rounded-2xl h-14 px-10 font-black shadow-xl shadow-primary/20 text-lg"
                  >
                    Simpan Perubahan
                  </Button>
                </div>

              </Space>
            </Form>
          </Spin>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
