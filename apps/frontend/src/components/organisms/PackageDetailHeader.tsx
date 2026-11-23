import React from 'react';
import { Typography, Space, Tag, Breadcrumb, Row, Col, Button } from 'antd';
import {
  ClockCircleOutlined,
  TeamOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface PackageDetailHeaderProps {
  title: string;
  description: string;
  thumbnail?: string;
  joinedCount: number;
  duration: string;
  questionCount?: number;
  category: string;
  classes: string[];
  subjects: string[];
  is_bundle?: boolean;
  bundledPackageCount?: number;
  onLoadDescription?: () => void;
  descriptionLoading?: boolean;
}

const PackageDetailHeader: React.FC<PackageDetailHeaderProps> = ({
  title,
  description,
  thumbnail,
  joinedCount,
  duration,
  questionCount,
  category,
  classes,
  subjects,
  is_bundle,
  bundledPackageCount,
  onLoadDescription,
  descriptionLoading,
}) => {
  const hasCover = Boolean(thumbnail);

  return (
    <div className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Cover / Aesthetic */}
      {hasCover ? (
        <>
          <img
            src={thumbnail}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30" />
        </>
      ) : (
        <>
          <div className="absolute top-0 left-0 w-full h-full bg-surface-low -z-10" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border-color to-transparent" />
        </>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          className={`mb-8 ${hasCover ? '[&_.ant-breadcrumb-separator]:!text-white/50' : ''}`}
          items={[
            { title: <a href="/" className={hasCover ? '!text-white/75 hover:!text-white' : undefined}>Beranda</a> },
            { title: <a href="/paket" className={hasCover ? '!text-white/75 hover:!text-white' : undefined}>Katalog Paket</a> },
            { title: <span className={hasCover ? 'text-white font-semibold' : undefined}>{title}</span> },
          ]}
        />

        <Row gutter={[48, 48]} align="middle">
          <Col xs={24} lg={16}>
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
                  {classes?.map(c => (
                    <Tag
                      key={c}
                      className={`rounded-full px-3 border-none font-bold text-[10px] m-0 ${
                        hasCover
                          ? 'bg-white/15 text-white backdrop-blur-sm'
                          : 'bg-on-surface/5 text-on-surface/40'
                      }`}
                    >
                      {c}
                    </Tag>
                  ))}
                  {subjects?.map(s => (
                    <Tag
                      key={s}
                      className={`rounded-full px-3 border-none font-bold text-[10px] m-0 ${
                        hasCover
                          ? 'bg-blue-400/25 text-blue-100 backdrop-blur-sm'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {s}
                    </Tag>
                  ))}
                </Space>
              </Space>

              <div>
                <Title
                  level={1}
                  className={`!text-4xl md:!text-6xl !font-manrope !m-0 !leading-[1.1] ${
                    hasCover ? '!text-white drop-shadow-sm' : ''
                  }`}
                >
                  {title}
                </Title>
                {description ? (
                  <Paragraph
                    className={`text-md text-justify mt-6 leading-relaxed line-clamp-5 ${
                      hasCover ? '!text-white/85' : 'text-surface-on/60'
                    }`}
                  >
                    {description}
                  </Paragraph>
                ) : (
                  <Button
                    type="link"
                    className={`mt-4 px-0 ${hasCover ? '!text-blue-200 hover:!text-white font-semibold' : ''}`}
                    onClick={onLoadDescription}
                    loading={descriptionLoading}
                  >
                    Lihat deskripsi paket
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-8 items-center pt-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${hasCover ? 'bg-white/15 backdrop-blur-sm' : 'bg-primary/10'}`}>
                    <TeamOutlined className={`text-xl ${hasCover ? 'text-white' : 'text-primary'}`} />
                  </div>
                  <div>
                    <Text className={`block text-[10px] uppercase font-bold tracking-widest ${hasCover ? '!text-white/70' : 'text-surface-on/40'}`}>
                      Siswa Terdaftar
                    </Text>
                    <Title level={4} className={`!m-0 ${hasCover ? '!text-white' : ''}`}>
                      {joinedCount.toLocaleString('id-ID')}+
                    </Title>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${hasCover ? 'bg-white/15 backdrop-blur-sm' : 'bg-primary/10'}`}>
                    <ClockCircleOutlined className={`text-xl ${hasCover ? 'text-white' : 'text-primary'}`} />
                  </div>
                  <div>
                    <Text className={`block text-[10px] uppercase font-bold tracking-widest ${hasCover ? '!text-white/70' : 'text-surface-on/40'}`}>
                      Estimasi Waktu
                    </Text>
                    <Title level={4} className={`!m-0 ${hasCover ? '!text-white' : ''}`}>
                      {duration}
                    </Title>
                  </div>
                </div>

                {typeof questionCount === 'number' && questionCount > 0 && (
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${hasCover ? 'bg-white/15 backdrop-blur-sm' : 'bg-primary/10'}`}>
                      <ExperimentOutlined className={`text-xl ${hasCover ? 'text-white' : 'text-primary'}`} />
                    </div>
                    <div>
                      <Text className={`block text-[10px] uppercase font-bold tracking-widest ${hasCover ? '!text-white/70' : 'text-surface-on/40'}`}>
                        Total Soal
                      </Text>
                      <Title level={4} className={`!m-0 ${hasCover ? '!text-white' : ''}`}>
                        {questionCount} Soal
                      </Title>
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
