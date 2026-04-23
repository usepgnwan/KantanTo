import React from 'react';
import { Card, Tag, Typography, Button, Space, Rate } from 'antd';
import { UserOutlined, ClockCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

export interface PackageProps {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  originalPrice: number;
  rating: number;
  studentCount: number;
  duration: string;
  category: string;
  isPopular?: boolean;
}

const PackageCard: React.FC<PackageProps> = ({
  title,
  slug,
  image,
  price,
  originalPrice,
  rating,
  studentCount,
  duration,
  category,
  isPopular
}) => {
  return (
    <Card
      hoverable
      className="h-full weightless-card border-none flex flex-col group overflow-hidden"
      cover={
        <div className="relative aspect-video overflow-hidden">
          <img 
            alt={title} 
            src={image} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Tag color="#0060ad" className="m-0 border-none px-3 py-0.5 rounded-lg font-bold shadow-lg">
              {category}
            </Tag>
            {isPopular && (
              <Tag color="orange" className="m-0 border-none px-3 py-0.5 rounded-lg font-bold shadow-lg flex items-center gap-1">
                <ThunderboltOutlined /> POPULER
              </Tag>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full flex-grow">
        <div className="mb-4">
          <div className="flex justify-between items-start mb-2">
            <Title level={4} className="!m-0 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {title}
            </Title>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Rate disabled defaultValue={rating} className="!text-xs" />
            <Text className="text-xs text-surface-on/40">({studentCount})</Text>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-surface-on/60">
            <span className="flex items-center gap-1">
              <ClockCircleOutlined className="text-primary" /> {duration}
            </span>
            <span className="flex items-center gap-1">
              <UserOutlined className="text-primary" /> {studentCount} Siswa
            </span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-surface-container">
          <div className="mb-4">
            <Text className="text-xs text-surface-on/40 line-through">Rp {originalPrice.toLocaleString('id-ID')}</Text>
            <div className="flex items-baseline gap-1">
              <Text className="text-2xl font-bold text-primary">Rp {price.toLocaleString('id-ID')}</Text>
              <Text className="text-xs text-surface-on/60">/paket</Text>
            </div>
          </div>
          
          <Space className="w-full" direction="vertical">
            <Button type="primary" block className="h-11 rounded-xl font-bold shadow-md shadow-primary/20">
              Pilih Paket
            </Button>
            <Link to={`/paket/${slug}`} className="w-full">
              <Button block className="h-11 rounded-xl font-semibold border-surface-container hover:border-primary hover:text-primary">
                Lihat Detail
              </Button>
            </Link>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default PackageCard;
