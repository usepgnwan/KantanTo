import React from 'react';
import { Button, Typography, Space } from 'antd';
import { PlayCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import jumbotronImg from '../../assets/jumbotron.png';

const { Title, Paragraph } = Typography;

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 pb-12 overflow-hidden bg-background dark:bg-black transition-colors duration-500">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent opacity-50 blur-3xl rounded-full translate-x-1/2 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-primary/5 blur-3xl rounded-full -translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div>
              <div className="inline-flex items-center space-x-2 py-1 px-4 rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold mb-6">
                <span>⭐ TKA SD & SMP READY!</span>
              </div>
              <Title level={1} className="!text-5xl md:!text-6xl !font-bold !font-manrope !leading-tight text-on-surface">
                Persiapan TKA <br />
                <span className="text-primary">SD & SMP</span> <br />
                Lebih Mudah <br />
                Bersama Rifaya Tryout.
              </Title>
              <Paragraph className="!text-lg text-on-surface/70 !font-inter max-w-lg leading-relaxed mt-4">
                Tryout berkualitas dengan sistem penilaian IRT akurat, pembahasan lengkap, dan laporan hasil belajar yang membantu kamu naik level.
              </Paragraph>
            </div>

            <Space size="middle" className="flex flex-wrap">
              <Button type="primary" size="large" className="h-14 px-8 text-base rounded-full font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform bg-primary" onClick={() => navigate('/register')}>
                🚀 COBA TRYOUT GRATIS
              </Button>
              <Button size="large" type="text" className="h-14 px-8 text-base font-bold text-primary hover:bg-primary/5 rounded-full flex items-center gap-2" onClick={() => navigate('/paket')}>
                <PlayCircleOutlined /> LIHAT PAKET
              </Button>
            </Space>

            <div className="flex items-center space-x-4 pt-4">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-primary relative z-10 hover:z-20 hover:scale-110 transition-transform shadow-sm">
                    <UserOutlined />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <p className="font-bold text-on-surface">Dipercaya oleh Siswa SD & SMP</p>
                <p className="text-on-surface/60">yang telah bergabung dan meraih skor terbaik!</p>
              </div>
            </div>
          </div>

          {/* Right Column - Illustration */}
          <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 w-full flex justify-center lg:justify-end items-center">
             <div className="relative w-full max-w-lg">
                {/* Decorative blob behind image */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl z-0"></div>
                
                <img 
                  src={jumbotronImg} 
                  alt="Ilustrasi Siswa Rifaya Tryout" 
                  className="relative z-10 w-full h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
                />
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
