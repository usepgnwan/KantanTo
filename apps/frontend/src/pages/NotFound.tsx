import React from 'react';
import { Result, Button, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AppLayout from '../layouts/AppLayout';

const { Title, Paragraph, Text } = Typography;

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="min-h-[80vh] flex items-center justify-center bg-surface-low/30 pt-16 pb-24">
        <div className="max-w-xl w-full px-4 text-center">
          <div className="relative mb-8">
            <div className="text-[12rem] font-black text-primary/5 select-none leading-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            </div>
          </div>
          
          <Title level={1} className="!font-manrope !font-black !text-4xl md:!text-5xl mb-4 tracking-tight">
            Halaman Hilang di Awan
          </Title>
          
          <Paragraph className="text-lg text-on-surface/60 mb-12 leading-relaxed">
            Sepertinya rute yang Anda cari telah dipindahkan atau memang tidak pernah ada. 
            Jangan khawatir, mari kita kembali ke jalur yang benar.
          </Paragraph>

          <Space size="large" className="flex justify-center">
            <Button 
              size="large" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
              className="h-14 rounded-2xl font-bold px-8 border-on-surface/10 hover:bg-surface-low transition-all"
            >
              Kembali
            </Button>
            <Button 
              type="primary" 
              size="large" 
              icon={<HomeOutlined />} 
              onClick={() => navigate('/')}
              className="h-14 rounded-2xl font-bold px-8 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              Ke Beranda
            </Button>
          </Space>
          
          <div className="mt-20 pt-8 border-t border-on-surface/5">
            <Text className="text-xs font-bold text-on-surface/20 uppercase tracking-widest leading-loose">
              Error Code: <span className="text-primary/40 font-mono">NS_FILE_NOT_FOUND_404</span>
            </Text>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotFound;
