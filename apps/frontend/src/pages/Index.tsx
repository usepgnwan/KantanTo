import React from 'react';
import AppLayout from '../layouts/AppLayout';
import HeroSection from '../components/organisms/HeroSection';
import CustomerReviews from '../components/organisms/CustomerReviews';
import ContactForm from '../components/organisms/ContactForm';
import { Typography, Row, Col, Card, Tag, Space, Button } from 'antd';
import { 
  RocketOutlined, 
  SafetyCertificateOutlined, 
  LineChartOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleFilled
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const features = [
  {
    icon: <RocketOutlined className="text-4xl text-primary" />,
    title: "Akses Instan",
    description: "Nikmati kemudahan akses soal dan hasil analisis secara real-time tanpa menunggu lama."
  },
  {
    icon: <SafetyCertificateOutlined className="text-4xl text-primary" />,
    title: "Standard Nasional",
    description: "Seluruh butir soal disusun berdasarkan standar resmi kemendikbud dengan tingkat akurasi tinggi."
  },
  {
    icon: <LineChartOutlined className="text-4xl text-primary" />,
    title: "Grafik Perkembangan",
    description: "Pantau sejauh mana perkembangan belajar Anda dengan fitur grafik perbandingan yang komprehensif."
  }
];

const packages = [
  {
    title: "Saintek Pro",
    tag: "POPULER",
    price: "75.000",
    students: "850 Siswa",
    features: ["7 Paket Soal", "Sistem IRT", "Video Pembahasan"]
  },
  {
    title: "Soshum Pro",
    tag: "BEST SELLER",
    price: "75.000",
    students: "920 Siswa",
    features: ["7 Paket Soal", "Sistem IRT", "Video Pembahasan"]
  },
  {
    title: "Campuran",
    tag: "HEMAT",
    price: "120.000",
    students: "450 Siswa",
    features: ["14 Paket Soal", "Sistem IRT", "Video Pembahasan"]
  },
  {
    title: "Lite Pass",
    tag: "STARTUP",
    price: "25.000",
    students: "1.2k Siswa",
    features: ["2 Paket Soal", "Sistem IRT", "Kunci Jawaban"]
  }
];

const IndexPage: React.FC = () => {
  return (
    <AppLayout>
      <HeroSection />
      
      {/* Features Overview */}
      <section className="py-24 bg-white dark:bg-zinc-900 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <Title level={2} className="!text-4xl !font-manrope mb-4">Mengapa Memilih Kami?</Title>
          <Paragraph className="text-lg text-surface-on/60 max-w-2xl mx-auto">
            Kami menghadirkan ekosistem belajar yang asimetris dan modern untuk memaksimalkan potensi Anda.
          </Paragraph>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} md={8} key={index}>
                <Card 
                  className="h-full weightless-card border-none hover:-translate-y-2 transition-all p-4"
                  bodyStyle={{ textAlign: 'center' }}
                >
                  <div className="mb-6 inline-flex p-4 rounded-2xl bg-primary/5">
                    {feature.icon}
                  </div>
                  <Title level={4} className="mb-4">{feature.title}</Title>
                  <Paragraph className="text-surface-on/70">
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Package Catalog - 4 Grid */}
      <section id="paket" className="py-24 bg-background dark:bg-zinc-800/10 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <Title level={2} className="!text-4xl !font-manrope mb-4">Katalog Tryout Unggulan</Title>
          <Paragraph className="text-lg text-surface-on/60 max-w-2xl mx-auto">
            Pilihlah paket yang sesuai dengan minat dan target PTN impian Anda.
          </Paragraph>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Row gutter={[24, 24]}>
            {packages.map((pkg, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card 
                  className="h-full weightless-card border-none hover:shadow-2xl transition-all"
                  cover={
                    <div className="h-24 bg-primary/5 flex items-center justify-center relative overflow-hidden">
                       <Tag color="blue" className="m-0 absolute top-4 left-4 font-bold border-none">{pkg.tag}</Tag>
                       <div className="absolute top-0 right-0 w-16 h-16 bg-primary opacity-5 rounded-bl-full" />
                    </div>
                  }
                >
                  <Space direction="vertical" className="w-full" size="small">
                    <Title level={4} className="m-0">{pkg.title}</Title>
                    <div className="flex items-center space-x-2 text-surface-on/60 text-xs">
                      <UserOutlined />
                      <span>{pkg.students} Berlangganan</span>
                    </div>
                    
                    <div className="py-4">
                      <Text className="text-xs text-surface-on/40 line-through">Rp 150.000</Text>
                      <div className="flex items-end space-x-1">
                        <Text className="text-xl font-bold text-primary">Rp {pkg.price}</Text>
                        <Text className="text-xs text-surface-on/60 mb-1">/Paket</Text>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {pkg.features.map((f, i) => (
                        <div key={i} className="flex items-center space-x-2">
                           <CheckCircleFilled className="text-primary/40 text-xs" />
                           <Text className="text-xs text-surface-on/70">{f}</Text>
                        </div>
                      ))}
                    </div>

                    <Button type="primary" block className="h-10 rounded-xl font-bold">
                       Pilih Paket
                    </Button>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      <CustomerReviews />
      
      <ContactForm />

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-br from-primary to-primary-container text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Title level={2} className="!text-white !text-3xl md:!text-5xl mb-8">Siap Bersaing di SNBT 2024?</Title>
          <Paragraph className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Bergabunglah dengan ribuan pejuang PTN lainnya dan mulailah latihan intensif hari ini.
          </Paragraph>
          <button className="bg-white text-primary px-12 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl">
            Ikuti Tryout Sekarang
          </button>
        </div>
      </section>
    </AppLayout>
  );
};

export default IndexPage;
