import React from 'react';
import { Card, Tag, Typography, Button, Space, Rate } from 'antd';
import { UserOutlined, ClockCircleOutlined, ThunderboltOutlined, CheckCircleFilled } from '@ant-design/icons';
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
  is_lifetime?: boolean;
  validity_days?: number;
  max_exam_attempts?: number;
  questions_count?: number;
  materials_count?: number;
  videos_count?: number;
  is_bundle?: boolean;
  bundled_package_ids?: number[];
  bundled_packages?: any[];
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
  isOwned,
  is_lifetime,
  validity_days,
  max_exam_attempts,
  questions_count,
  materials_count,
  videos_count,
  is_bundle,
  bundled_package_ids,
  bundled_packages,
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
        variant: is_bundle ? `🎁 Bundle (${bundled_package_ids?.length || 0} Paket)` : `${category} • ${duration}`,
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
      className={`h-full weightless-card border-none flex flex-col group overflow-hidden ${is_bundle ? 'ring-2 ring-purple-500/30' : ''}`}
      cover={
        <div className="relative aspect-video overflow-hidden">
          <img
            alt={title}
            src={image}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {is_bundle ? (
              <Tag color="#7c3aed" className="m-0 border-none px-3 py-0.5 rounded-lg font-black shadow-lg">
                🎁 BUNDLE ({bundled_package_ids?.length || 0} PAKET)
              </Tag>
            ) : (
              <Tag color="#0060ad" className="m-0 border-none px-3 py-0.5 rounded-lg font-bold shadow-lg">
                {category}
              </Tag>
            )}
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

          {is_bundle && bundled_packages && bundled_packages.length > 0 && (
            <div className="bg-purple-50/70 dark:bg-purple-950/30 rounded-xl p-2.5 mb-3 border border-purple-100 dark:border-purple-900/40">
              <div className="text-[10px] text-purple-700 dark:text-purple-300 font-black uppercase tracking-wider mb-1">
                Termasuk {bundled_packages.length} Sub-Paket:
              </div>
              <div className="space-y-0.5">
                {bundled_packages.map(p => (
                  <div key={p.id} className="text-xs text-on-surface/70 flex items-center gap-1.5 truncate">
                    <span className="text-purple-600 font-bold">•</span>
                    <span className="truncate">{p.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-surface-on/60 mb-4">
            <span className="flex items-center gap-1">
              <ClockCircleOutlined className={is_bundle ? "text-purple-600" : "text-primary"} /> {is_bundle ? 'Durasi Sesuai Sub-Paket' : duration}
            </span>
          </div>

          <div className="space-y-1.5 mt-2">
            {is_bundle ? (
              [
                `Akses lengkap ${bundled_package_ids?.length || 0} paket sekaligus`,

                'Masa aktif & kuota ujian berlaku per paket',
              ].map((feature) => (
                <div key={feature} className="flex items-start space-x-2">
                  <CheckCircleFilled className="text-purple-500 text-[10px] mt-0.5 shrink-0" />
                  <Text className="text-[11px] text-surface-on/70">{feature}</Text>
                </div>
              ))
            ) : (
              [
                is_lifetime ? 'Akses Selamanya (Lifetime)' : `Akses ${validity_days} Hari`,
                max_exam_attempts === 0 ? 'Bebas Ujian Berkali-kali' : `Maksimal ${max_exam_attempts}x Ujian`,
                `${questions_count || 0} Soal`,
                (materials_count ?? 0) > 0 ? `${materials_count} Materi Pembahasan` : 'Pembahasan dalam soal',
                (videos_count ?? 0) > 0 ? `${videos_count} Video Pembahasan` : null,
              ].filter(Boolean).map((feature) => (
                <div key={feature as string} className="flex items-start space-x-2">
                  <CheckCircleFilled className="text-primary/40 text-[10px] mt-0.5 shrink-0" />
                  <Text className="text-[11px] text-surface-on/70">{feature}</Text>
                </div>
              ))
            )}
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
                {originalPrice > price && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Text className="text-xs text-surface-on/40 line-through">Rp {originalPrice.toLocaleString('id-ID')}</Text>
                    <Tag color="red" className="m-0 border-none font-bold text-[10px] px-1.5 py-0.5 rounded-md">
                      Hemat Rp {(originalPrice - price).toLocaleString('id-ID')}
                    </Tag>
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <Text className={`text-2xl font-bold ${is_bundle ? 'text-purple-600' : 'text-primary'}`}>
                    Rp {price.toLocaleString('id-ID')}
                  </Text>
                  <Text className="text-xs text-surface-on/60">{is_bundle ? '/bundle' : '/paket'}</Text>
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
