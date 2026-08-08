import React from 'react';
import { Typography, Row, Col } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  image: string;
  quote?: {
    text: string;
    author: string;
  };
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, image, quote }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col font-manrope">
      {/* Minimalist Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-on-surface/5">
        <div>
          <Link 
            to="/" 
            className="group flex items-center gap-3 text-on-surface hover:text-primary transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-full border border-on-surface/10 flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
              <ArrowLeftOutlined className="text-sm" />
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:block">Kembali ke Beranda</span>
          </Link>
        </div>
        <div>
            <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg"></div>
                <span className="font-black text-xl tracking-tighter">Rifaya Tryout.</span>
            </Link>
        </div>
      </nav>

      <Row className="flex-1">
        {/* Visual Side (Left) - Hidden on Mobile */}
        <Col xs={0} lg={12} className="relative bg-surface-low overflow-hidden mt-[81px]">
          <div className="absolute inset-0 bg-secondary/5 opacity-50"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-20 z-10">
            <div className="relative w-full max-w-sm aspect-square mb-12">
               <img 
                 src={image} 
                 alt="Auth Visual" 
                 className="w-full h-full object-contain animate-in fade-in zoom-in duration-1000 drop-shadow-2xl"
               />
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
               <div className="absolute -top-10 -left-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            {quote && (
              <div className="max-w-md text-center space-y-6 animate-in slide-in-from-bottom-8 duration-1000 delay-300">
                <Paragraph className="text-2xl font-manrope italic font-medium leading-relaxed text-on-surface/80">
                  "{quote.text}"
                </Paragraph>
                <div className="flex items-center justify-center gap-4">
                    <div className="h-[1px] w-8 bg-on-surface/20" />
                    <span className="font-bold tracking-widest uppercase text-[10px] text-on-surface/40">
                      {quote.author}
                    </span>
                    <div className="h-[1px] w-8 bg-on-surface/20" />
                </div>
              </div>
            )}
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-1/4 -left-20 w-64 h-64 border border-on-surface/5 rounded-full" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 border border-on-surface/5 rounded-full" />
        </Col>

        {/* Form Side (Right) */}
        <Col xs={24} lg={12} className="flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-24 py-32 lg:py-0 mt-[81px]">
          <div className="max-w-md w-full mx-auto animate-in slide-in-from-right-8 duration-700">
            <header className="mb-12 space-y-4">
              <Title level={1} className="!text-4xl md:!text-5xl !font-manrope !font-black !m-0 tracking-tighter leading-tight">
                {title}
              </Title>
              <Paragraph className="text-lg text-on-surface/50 leading-relaxed max-w-sm">
                {subtitle}
              </Paragraph>
            </header>

            <main>
              {children}
            </main>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AuthLayout;
