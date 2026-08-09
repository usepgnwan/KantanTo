import React, { useState } from 'react';
import { Typography, Row, Col, Form, Input, Button, Card, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { submitContactMessage } from '../../services/contactMessageService';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const ContactForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      await submitContactMessage({
        name: values.name,
        email: values.email,
        subject: values.subject || 'Pesan dari Landing Page',
        message: values.message,
      });
      message.success({
        content: 'Pesan Anda berhasil dikirim! Tim kami akan segera menghubungi Anda melalui email.',
        duration: 5,
      });
      form.resetFields();
    } catch (error: any) {
      message.error({
        content: 'Terjadi kesalahan saat mengirim pesan: ' + (error.response?.data?.message || error.message),
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="kontak" className="py-24 bg-white dark:bg-black transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <Title level={2} className="!text-4xl !font-manrope mb-4">Hubungi Kami</Title>
          <Paragraph className="text-lg text-surface-on/60">
            Ada pertanyaan atau butuh bantuan? Tim kami siap melayani Anda.
          </Paragraph>
        </div>

        <Card className="border-none glass shadow-xl rounded-[2rem] overflow-hidden p-4 md:p-12">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            className="space-y-4"
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={<span className="font-semibold">Nama Lengkap</span>}
                  name="name"
                  rules={[{ required: true, message: 'Harap isi nama Anda' }]}
                >
                  <Input placeholder="Contoh: Andi Wijaya" className="h-12 rounded-xl" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label={<span className="font-semibold">Email</span>}
                  name="email"
                  rules={[{ required: true, type: 'email', message: 'Harap isi email yang valid' }]}
                >
                  <Input placeholder="andi@example.com" className="h-12 rounded-xl" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={<span className="font-semibold">Subjek</span>}
              name="subject"
              rules={[{ required: true, message: 'Harap isi subjek pesan' }]}
            >
              <Input placeholder="Misal: Pertanyaan tentang paket tryout" className="h-12 rounded-xl" />
            </Form.Item>

            <Form.Item
              label={<span className="font-semibold">Pesan</span>}
              name="message"
              rules={[{ required: true, message: 'Harap tulis pesan Anda' }]}
            >
              <TextArea rows={4} placeholder="Tuliskan pertanyaan Anda di sini..." className="rounded-xl" />
            </Form.Item>

            <Form.Item className="text-center pt-6 mb-0">
              <Button type="primary" size="large" icon={<SendOutlined />} htmlType="submit" loading={loading} className="h-14 px-12 text-lg rounded-full shadow-lg shadow-primary/30">
                Kirim Pesan
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </section>
  );
};

export default ContactForm;

