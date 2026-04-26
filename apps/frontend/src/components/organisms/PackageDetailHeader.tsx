import React from 'react';
import { Typography, Space, Tag, Breadcrumb, Row, Col } from 'antd';
import { 
  UserOutlined, 
  ClockCircleOutlined, 
  TeamOutlined, 
  SafetyCertificateFilled 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface PackageDetailHeaderProps {
  title: string;
  description: string;
  joinedCount: number;
  duration: string;
  category: string;
  classes: string[];
  subjects: string[];
}

const PackageDetailHeader: React.FC<PackageDetailHeaderProps> = ({
  title,
  description,
  joinedCount,
  duration,
  category,
  classes,
  subjects
}) => {
  return (
    <div className="relative pt-32 pb-16 overflow-hidden">
      {/* Background Aesthetic */}
      <div className="absolute top-0 left-0 w-full h-full bg-surface-low -z-10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border-color to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb className="mb-8">
          <Breadcrumb.Item><a href="/">Beranda</a></Breadcrumb.Item>
          <Breadcrumb.Item><a href="/paket">Katalog Paket</a></Breadcrumb.Item>
          <Breadcrumb.Item>{title}</Breadcrumb.Item>
        </Breadcrumb>

        <Row gutter={[48, 48]} align="middle">
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" className="w-full">
              <Space size="middle">
                <Tag color="blue" className="rounded-full px-4 border-none font-bold bg-primary text-white">
                  {category}
                </Tag>
                <Space size={4} wrap>
                  {classes?.map(c => <Tag key={c} className="rounded-full px-3 border-none bg-on-surface/5 text-on-surface/40 font-bold text-[10px] m-0">{c}</Tag>)}
                  {subjects?.map(s => <Tag key={s} className="rounded-full px-3 border-none bg-blue-500/10 text-blue-500 font-bold text-[10px] m-0">{s}</Tag>)}
                </Space>
              </Space>

              <div>
                <Title level={1} className="!text-4xl md:!text-6xl !font-manrope !m-0 !leading-[1.1]">
                  {title}
                </Title>
                <Paragraph className="text-xl text-surface-on/60 mt-6 max-w-2xl leading-relaxed">
                  {description}
                </Paragraph>
              </div>

              <div className="flex flex-wrap gap-8 items-center pt-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-2xl">
                    <TeamOutlined className="text-primary text-xl" />
                  </div>
                  <div>
                    <Text className="block text-[10px] text-surface-on/40 uppercase font-bold tracking-widest">Siswa Terdaftar</Text>
                    <Title level={4} className="!m-0">{joinedCount.toLocaleString('id-ID')}+</Title>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-2xl">
                    <ClockCircleOutlined className="text-primary text-xl" />
                  </div>
                  <div>
                    <Text className="block text-[10px] text-surface-on/40 uppercase font-bold tracking-widest">Estimasi Waktu</Text>
                    <Title level={4} className="!m-0">{duration}</Title>
                  </div>
                </div>
              </div>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PackageDetailHeader;
