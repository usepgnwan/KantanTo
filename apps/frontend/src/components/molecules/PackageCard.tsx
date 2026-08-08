import React from 'react';
import { Card, Tag, Typography, Button, Space, Rate } from 'antd';
import { UserOutlined, ClockCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { recordMenuLogAPI } from '../../services/logService';

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
  classes: string[];
  subjects: string[];
  isPopular?: boolean;
  isOwned?: boolean;
}

const PackageCard: React.FC<PackageProps> = ({
  id,
  title,
  slug,
  image,
  price,
  originalPrice,
  rating,
  studentCount,
  duration,
  category,
  classes,
  subjects,
  isPopular,
  isOwned
}) => {
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { isLoggedIn, user } = useAuth();

  const handleDetailClick = () => {
    const device = window.innerWidth < 768 ? 'mobile' : 'web';
    recordMenuLogAPI({
      path: `/paket/${slug}`,
      label: title,
      device,
      user_id: user?.id,
    });
  };

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!isInCart(id)) {
      addToCart({
        id,
        slug,
        title,
        variant: `${category} • ${duration}`,
        price,
        image: image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800',
        quantity: 1,
      });
    }
    navigate('/keranjang');
  };

  const alreadyInCart = isInCart(id);

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
            {isOwned && (
              <Tag color="green" className="m-0 border-none px-3 py-0.5 rounded-lg font-bold shadow-lg">
                SAYA MILIKI
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
          <div className="flex flex-wrap gap-2 mb-3">
            {classes?.map(c => <Tag key={c} className="m-0 rounded-md border-none bg-on-surface/5 text-on-surface/40 font-bold text-[9px] px-2">{c}</Tag>)}
            {subjects?.map(s => <Tag key={s} className="m-0 rounded-md border-none bg-blue-500/10 text-blue-500 font-bold text-[9px] px-2">{s}</Tag>)}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-surface-on/60">
            <span className="flex items-center gap-1">
              <ClockCircleOutlined className="text-primary" /> {duration}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-surface-container">
          {isOwned ? (
            <Button 
              type="primary" 
              block 
              className="h-12 rounded-xl font-bold bg-green-600 hover:bg-green-700 border-none shadow-lg shadow-green-600/20 text-base"
              onClick={() => {
                handleDetailClick();
                navigate(`/paket/${slug}`);
              }}
            >
              Mulai Belajar
            </Button>
          ) : (
            <>
              <div className="mb-4">
                <Text className="text-xs text-surface-on/40 line-through">Rp {originalPrice.toLocaleString('id-ID')}</Text>
                <div className="flex items-baseline gap-1">
                  <Text className="text-2xl font-bold text-primary">Rp {price.toLocaleString('id-ID')}</Text>
                  <Text className="text-xs text-surface-on/60">/paket</Text>
                </div>
              </div>
              
              <Space className="w-full" direction="vertical">
                <Button 
                  type={alreadyInCart ? "default" : "primary"} 
                  block 
                  className={`h-11 rounded-xl font-bold shadow-md ${alreadyInCart ? 'border-primary text-primary' : 'shadow-primary/20'}`}
                  onClick={handleAddToCart}
                >
                  {alreadyInCart ? 'Lihat Keranjang' : 'Pilih Paket'}
                </Button>
                <Link to={`/paket/${slug}`} className="w-full" onClick={handleDetailClick}>
                  <Button block className="h-11 rounded-xl font-semibold border-surface-container hover:border-primary hover:text-primary">
                    Lihat Detail
                  </Button>
                </Link>
              </Space>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PackageCard;
