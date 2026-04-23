import React from 'react';
import { Button, Typography, Space } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-background dark:bg-black transition-colors duration-500">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent opacity-50 blur-3xl rounded-full translate-x-1/2 -translate-y-1/4" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-primary/5 blur-3xl rounded-full -translate-x-1/4 translate-y-1/4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div>
              <div className="inline-flex items-center space-x-2 py-1 px-4 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold tracking-wide mb-6">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                <span>SNBT 2024 READY</span>
              </div>
              <Title level={1} className="!text-5xl md:!text-7xl !font-bold !font-manrope !leading-tight tracking-tight">
                Raih Impian Masuk <br />
                <span className="text-primary italic">PTN Idaman</span> Bersama Kami.
              </Title>
              <Paragraph className="!text-lg md:!text-xl text-surface-on/70 !font-inter max-w-lg leading-relaxed">
                Platform Tryout Terpercaya dengan Sistem Penilaian IRT Akurat. Rasakan pengalaman belajar yang modern dan efisien.
              </Paragraph>
            </div>

            <Space size="large" className="flex flex-wrap">
              <Button type="primary" size="large" icon={<ArrowRightOutlined />} className="h-14 px-10 text-lg rounded-full shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
                Start Free Tryout
              </Button>
              <Button size="large" className="h-14 px-10 text-lg rounded-full hover:border-primary hover:text-primary transition-all">
                Learn More
              </Button>
            </Space>

            <div className="flex items-center space-x-6 pt-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-surface bg-gray-200 overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <p className="font-bold text-surface-on">15,000+ Students</p>
                <p className="text-surface-on/60">Already joined our platform</p>
              </div>
            </div>
          </div>

          {/* Mixed Media Mockup Area */}
          <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
            <div className="relative bg-white dark:bg-zinc-900 rounded-[2rem] p-4 shadow-2xl border border-white/20 glass">
              <div className="rounded-[1.5rem] overflow-hidden bg-gray-100 dark:bg-zinc-800 aspect-[4/3] relative">
                {/* Hero Image / Video Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse">
                      <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1" />
                    </div>
                    <Title level={3} className="!text-white">The Weightless Experience</Title>
                  </div>
                </div>
                {/* Floating Elements on Image */}
                <div className="absolute -top-6 -right-6 w-32 h-32 glass rounded-2xl flex flex-col items-center justify-center shadow-xl animate-bounce duration-[3000ms]">
                   <span className="text-3xl">🎯</span>
                   <span className="text-xs font-bold mt-2">Precision Analysis</span>
                </div>
              </div>
            </div>
            {/* Absolute floating cards */}
            <div className="absolute -bottom-10 -left-10 glass p-6 rounded-2xl shadow-xl w-64 border border-white/20 hidden md:block">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">✓</div>
                <span className="font-bold text-sm">Exam Completed</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full w-[85%]" />
              </div>
              <p className="text-xs mt-2 text-on-surface/60">Success rate increased by 20%</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
