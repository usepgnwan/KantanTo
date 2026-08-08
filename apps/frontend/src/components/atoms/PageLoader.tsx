import React from 'react';
import { Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-20 h-20 bg-primary/5 rounded-3xl animate-pulse flex items-center justify-center">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <div className="w-4 h-4 bg-white rounded-sm" />
          </div>
        </div>
        <div className="absolute -inset-4 border-2 border-primary/10 rounded-[2.5rem] animate-spin-slow" style={{ borderTopColor: 'transparent' }} />
      </div>
      
      <div className="text-center space-y-2">
        <Text className="text-sm font-bold uppercase tracking-[0.3em] text-primary block">Rifaya Tryout Portal</Text>
        <Text className="text-xs text-on-surface/40 flex items-center gap-2">
          <LoadingOutlined /> Mempersiapkan Sanctuary Belajar Anda...
        </Text>
      </div>
      
      <div className="w-48 h-1 bg-surface-low rounded-full overflow-hidden">
        <div className="h-full bg-primary animate-progress-indefinite rounded-full" />
      </div>
    </div>
  );
};

export default PageLoader;
