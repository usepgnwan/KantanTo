import React from 'react';
import { Typography, Space, Tag, Breadcrumb, Row, Col } from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  SafetyCertificateFilled,
  ExperimentOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface PackageDetailHeaderProps {
  title: string;
  description: string;
  joinedCount: number;
  duration: string;
  questionCount?: number;
  category: string;
  classes: string[];
  subjects: string[];
  is_bundle?: boolean;
  bundledPackageCount?: number;
}

const PackageDetailHeader: React.FC<PackageDetailHeaderProps> = ({
  title,
  description,
  joinedCount,
  duration,
  questionCount,
  category,
  classes,
  subjects,
  is_bundle,
  bundledPackageCount
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
          <Col span={24}>
            <Space direction="vertical" size="large" className="w-full">
              <Space size="middle" wrap>
                {is_bundle && (
                  <Tag color="purple" className="rounded-full px-4 py-0.5 border-none font-black bg-purple-600 text-white shadow-md">
                    🎁 PAKET BUNDLE ({bundledPackageCount || 0} PAKET)
                  </Tag>
                )}
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
                <Paragraph className="text-md text-justify  text-surface-on/60 mt-6 leading-relaxed">
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

                {typeof questionCount === 'number' && questionCount > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-2xl">
                      <ExperimentOutlined className="text-primary text-xl" />
                    </div>
                    <div>
                      <Text className="block text-[10px] text-surface-on/40 uppercase font-bold tracking-widest">Total Soal</Text>
                      <Title level={4} className="!m-0">{questionCount} Soal</Title>
                    </div>
                  </div>
                )}
              </div>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PackageDetailHeader;
