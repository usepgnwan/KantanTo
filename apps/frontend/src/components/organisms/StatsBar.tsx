import React from 'react';
import { Space } from 'antd';
import { 
  TeamOutlined, 
  FileTextOutlined, 
  StarOutlined, 
  HeartOutlined,
  BankOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';

const StatsBar: React.FC = () => {
  const stats = [
    {
      icon: <TeamOutlined className="text-3xl text-primary" />,
      value: "10.000+",
      label: "Siswa Terdaftar"
    },
    {
      icon: <FileTextOutlined className="text-3xl text-primary" />,
      value: "500.000+",
      label: "Tryout Dikerjakan"
    },
    {
      icon: <StarOutlined className="text-3xl text-primary" />,
      value: "4.9 / 5",
      label: "Rating Platform"
    },
    {
      icon: <HeartOutlined className="text-3xl text-primary" />,
      value: "95%",
      label: "Puas dengan Rifaya Tryout"
    },
    {
      icon: <SafetyCertificateOutlined className="text-3xl text-primary" />,
      value: "Update Soal",
      label: "Sesuai Aturan TKA Terbaru"
    }
  ];

  return (
    <section className="py-8 bg-white border-y border-gray-100 dark:bg-zinc-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center justify-center text-center space-y-2">
              <div className="text-primary mb-1">{stat.icon}</div>
              <div className="font-bold text-lg md:text-xl text-on-surface leading-tight">{stat.value}</div>
              <div className="text-xs text-on-surface/60 font-medium leading-tight max-w-[120px]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
