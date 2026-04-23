import React from 'react';
import { Card, Typography, Space, Tag } from 'antd';
import { LockOutlined, PlayCircleFilled, FileTextOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface ResourceCardProps {
  title: string;
  type: 'video' | 'discussion';
  duration?: string;
  isLocked: boolean;
  thumbnail?: string;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ 
  title, 
  type, 
  duration, 
  isLocked, 
  thumbnail 
}) => {
  return (
    <Card 
      className={`border-none overflow-hidden group shadow-sm hover:shadow-md transition-all ${
        type === 'discussion' ? 'bg-surface-low' : 'bg-surface'
      }`}
      bodyStyle={{ padding: type === 'discussion' ? '16px' : '12px' }}
    >
      {type === 'video' ? (
        <div className="space-y-4">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-container">
            {thumbnail ? (
              <img src={thumbnail} alt={title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/5">
                <PlayCircleFilled className="text-4xl text-primary/20" />
              </div>
            )}
            
            {/* Overlay */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all ${
              isLocked ? 'bg-black/40 backdrop-blur-[2px]' : 'bg-transparent group-hover:bg-primary/10'
            }`}>
              {isLocked ? (
                <div className="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30">
                  <LockOutlined className="text-white text-xl" />
                </div>
              ) : (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary p-3 rounded-full shadow-xl">
                  <PlayCircleFilled className="text-white text-xl" />
                </div>
              )}
            </div>

            {duration && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                {duration}
              </div>
            )}
          </div>
          <div>
            <Title level={5} className="!text-sm !m-0 line-clamp-1 group-hover:text-primary transition-colors">
              {title}
            </Title>
            <Text className="text-[10px] text-surface-on/40 uppercase tracking-widest font-bold">Video Pembelajaran</Text>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <FileTextOutlined className="text-primary text-lg" />
            </div>
            <div>
              <Title level={5} className="!text-sm !m-0 group-hover:text-primary transition-colors">{title}</Title>
              <Text className="text-[10px] text-surface-on/40">Dokumen Pembahasan • PDF</Text>
            </div>
          </div>
          {isLocked && <LockOutlined className="text-surface-on/20 text-lg" />}
        </div>
      )}
    </Card>
  );
};

export default ResourceCard;
