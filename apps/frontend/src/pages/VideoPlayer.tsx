import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Breadcrumb, Button, Card } from 'antd';
import { ArrowLeftOutlined, PlayCircleFilled } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const VideoPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock data for the video
  const videoContent = {
    title: `Video Pembahasan Profesional #${id || '1'}`,
    duration: '15:20',
    description: 'Pelajari trik cepat dan analisis mendalam mengenai soal-soal tersulit di SNBT tahun ini. Video ini disusun oleh master tutor berpengalaman.',
    instructor: 'Budi Santoso - Lead Tutor',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200'
  };

  return (
    <div className="bg-black min-h-screen pt-4 pb-20 transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center justify-between mb-6">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="text-white/60 hover:text-white px-0 font-bold"
          >
            Kembali
          </Button>
          <Breadcrumb className="text-[10px] uppercase tracking-widest font-bold text-white/40">
            <Breadcrumb.Item className="cursor-pointer hover:text-white" onClick={() => navigate('/latihan')}>Latihan</Breadcrumb.Item>
            <Breadcrumb.Item>Video Playback</Breadcrumb.Item>
          </Breadcrumb>
        </div>

        <div className="bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 mb-8">
          {/* Mock Video Player Area */}
          <div className="relative aspect-video bg-black flex items-center justify-center group cursor-pointer">
            <img 
              src={videoContent.thumbnail} 
              alt={videoContent.title} 
              className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="relative z-10 w-20 h-20 bg-primary/90 text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/30 group-hover:bg-primary transition-colors">
              <PlayCircleFilled className="text-4xl" />
            </div>
            <div className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded font-mono text-sm tracking-wider">
              {videoContent.duration}
            </div>
            
            {/* Fake player controls */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/20">
              <div className="h-full bg-primary w-1/3 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
              </div>
            </div>
          </div>

          {/* Video Meta Info */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <Title level={2} className="!text-white !m-0 !font-black !font-manrope mb-2">
                  {videoContent.title}
                </Title>
                <Text className="text-white/40 font-bold uppercase tracking-widest text-xs block mb-6">
                  {videoContent.instructor}
                </Text>
                <Paragraph className="text-white/70 max-w-3xl leading-relaxed text-base">
                  {videoContent.description}
                </Paragraph>
              </div>
              
              <Button type="primary" size="large" className="rounded-xl font-bold h-12 shadow-lg shadow-primary/20 shrink-0">
                Tandai Selesai
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VideoPlayer;
