import React from 'react';
import AppLayout from '../layouts/AppLayout';
import { Row, Col, Typography, Input, Button, Form, Card, Divider } from 'antd';
import { MailOutlined, PhoneOutlined, EnvironmentOutlined, SendOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const ContactPage: React.FC = () => {
  const onFinish = (values: any) => {
    console.log('Success:', values);
    alert('Pesan Anda berhasil dikirim! Tim Kantan akan segera menghubungi Anda.');
  };

  return (
    <AppLayout>
      <div className="bg-surface-low/30 pt-32 pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
            <Text className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">
              Pusat Dukungan
            </Text>
            <Title level={1} className="!text-4xl md:!text-5xl !font-manrope !font-black !mb-6">
              Hubungi Tim Kantan
            </Title>
            <Paragraph className="text-lg text-on-surface/60">
              Ada pertanyaan terkait paket pembelajaran SNBT, kendala teknis, atau ingin tahu lebih lanjut bagaimana Kantan membantu ribuan siswa lolos PTN impian? Kami siap membantu.
            </Paragraph>
          </div>

          <Row gutter={[48, 48]} align="top">
            {/* Left Column: About Kantan & Contact Info */}
            <Col xs={24} lg={10} className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <div className="pr-0 md:pr-8">
                <Title level={3} className="!font-manrope !font-black !mb-4">
                  Tentang Kantan
                </Title>
                <div className="prose prose-p:text-on-surface/70 prose-p:leading-relaxed mb-10">
                  <p>
                    <strong>Kantan</strong> didirikan dengan satu misi sederhana: mendemokratisasi akses pendidikan berstandar tinggi untuk persiapan Seleksi Nasional Berdasarkan Tes (SNBT).
                  </p>
                  <p>
                    Kami percaya bahwa kelulusan ke PTN impian bukanlah tentang seberapa keras Anda menghafal, melainkan seberapa cerdas Anda menggunakan <i>Cognitive Sanctuary</i>—sebuah ruang fokus yang dirancang khusus untuk meminimalkan beban mental dan memaksimalkan retensi materi.
                  </p>
                </div>

                <Divider className="border-on-surface/10" />
                
                <Title level={4} className="!font-manrope !font-black !mt-8 !mb-6">
                  Informasi Kontak
                </Title>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <MailOutlined className="text-xl" />
                    </div>
                    <div>
                      <Text className="font-bold text-on-surface block text-base mb-1">Email</Text>
                      <Text className="text-on-surface/60">support@kantan.edu.id</Text>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                      <PhoneOutlined className="text-xl" />
                    </div>
                    <div>
                      <Text className="font-bold text-on-surface block text-base mb-1">Telepon / WhatsApp</Text>
                      <Text className="text-on-surface/60">+62 812 3456 7890</Text>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                      <EnvironmentOutlined className="text-xl" />
                    </div>
                    <div>
                      <Text className="font-bold text-on-surface block text-base mb-1">Kantor Pusat</Text>
                      <Text className="text-on-surface/60 block leading-relaxed">
                        Gedung Inovasi Pendidikan Lt. 4<br />
                        Jl. Sudirman No. 123, Jakarta Selatan<br />
                        DKI Jakarta 12190
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            {/* Right Column: Contact Form */}
            <Col xs={24} lg={14} className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <Card className="weightless-card border-none bg-white p-2 sm:p-8">
                <Title level={3} className="!font-manrope !font-black !mb-2">Kirim Pesan Langsung</Title>
                <Paragraph className="text-on-surface/60 mb-8">Isi formulir di bawah ini dan representatif kami akan membalas dalam waktu maksimal 1x24 jam.</Paragraph>
                
                <Form
                  layout="vertical"
                  onFinish={onFinish}
                  requiredMark={false}
                  className="space-y-2"
                >
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="name"
                        label={<span className="font-bold text-on-surface/80">Nama Lengkap</span>}
                        rules={[{ required: true, message: 'Masukkan nama lengkap Anda' }]}
                      >
                        <Input size="large" className="rounded-xl h-12 border-surface-container hover:border-primary focus:border-primary bg-surface-lowest" placeholder="John Doe" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="email"
                        label={<span className="font-bold text-on-surface/80">Alamat Email</span>}
                        rules={[
                          { required: true, message: 'Masukkan alamat email Anda' },
                          { type: 'email', message: 'Format email tidak valid' }
                        ]}
                      >
                        <Input size="large" className="rounded-xl h-12 border-surface-container hover:border-primary focus:border-primary bg-surface-lowest" placeholder="john@example.com" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="subject"
                    label={<span className="font-bold text-on-surface/80">Subjek Topik</span>}
                    rules={[{ required: true, message: 'Pilih atau ketik subjek' }]}
                  >
                    <Input size="large" className="rounded-xl h-12 border-surface-container hover:border-primary focus:border-primary bg-surface-lowest" placeholder="Misal: Kendala Akses Paket Tryout" />
                  </Form.Item>

                  <Form.Item
                    name="message"
                    label={<span className="font-bold text-on-surface/80">Pesan Detail</span>}
                    rules={[{ required: true, message: 'Tuliskan pesan Anda' }]}
                  >
                    <TextArea 
                      rows={5} 
                      className="rounded-xl border-surface-container hover:border-primary focus:border-primary bg-surface-lowest p-3" 
                      placeholder="Jelaskan secara detail pertanyaan atau kendala yang Anda alami..." 
                    />
                  </Form.Item>

                  <Form.Item className="mt-8 mb-0">
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      size="large" 
                      block 
                      className="h-14 rounded-xl font-bold shadow-lg shadow-primary/20 text-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                    >
                      <SendOutlined /> Kirim Pesan Sekarang
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>

        </div>
      </div>
    </AppLayout>
  );
};

export default ContactPage;
