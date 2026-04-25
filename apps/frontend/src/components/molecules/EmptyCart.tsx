import React from 'react';
import { Typography, Button } from 'antd';
import { ShoppingCartOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const EmptyCart: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <ShoppingCartOutlined className="text-4xl text-primary" />
      </div>
      <Title level={3} className="!font-manrope !mb-2">Keranjang Anda Masih Kosong</Title>
      <Text className="text-on-surface/60 max-w-md mb-8">
        Sepertinya Anda belum menambahkan paket simulasi apa pun. Mari temukan paket yang tepat untuk membantu persiapan SNBT Anda.
      </Text>
      <Button 
        type="primary" 
        size="large" 
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/paket')}
        className="rounded-full h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
      >
        Lihat Katalog Paket
      </Button>
    </div>
  );
};

export default EmptyCart;
