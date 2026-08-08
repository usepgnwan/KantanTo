import React from 'react';
import { Typography } from 'antd';
import { 
  ThunderboltFilled,
  BookFilled,
  PlayCircleFilled,
  BarChartOutlined,
  TrophyFilled,
  MobileFilled
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const FeaturesGrid: React.FC = () => {
  const features = [
    {
      icon: <ThunderboltFilled className="text-2xl text-white" />,
      iconBg: "bg-blue-500",
      title: "Sistem Penilaian IRT",
      description: "Hasil lebih akurat sesuai kemampuanmu."
    },
    {
      icon: <BookFilled className="text-2xl text-white" />,
      iconBg: "bg-teal-400",
      title: "Soal Sesuai TKA",
      description: "Soal HOTS terbaru sesuai kisi-kisi resmi TKA."
    },
    {
      icon: <PlayCircleFilled className="text-2xl text-white" />,
      iconBg: "bg-purple-500",
      title: "Pembahasan Lengkap",
      description: "Pembahasan detail berbentuk teks dan video."
    },
    {
      icon: <BarChartOutlined className="text-2xl text-white" />,
      iconBg: "bg-indigo-400",
      title: "Laporan & Analisis",
      description: "Laporan lengkap dan mudah dipahami."
    },
    {
      icon: <TrophyFilled className="text-2xl text-white" />,
      iconBg: "bg-pink-400",
      title: "Ranking Nasional",
      description: "Lihat peringkatmu di tingkat nasional."
    },
    {
      icon: <MobileFilled className="text-2xl text-white" />,
      iconBg: "bg-cyan-400",
      title: "Bisa di Mana Saja",
      description: "Kerjakan tryout di HP, tablet, atau laptop."
    }
  ];

  return (
    <section className="py-20 bg-background dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Title level={2} className="!text-3xl md:!text-4xl !font-bold !mb-2">Kenapa Belajar di Rifaya Tryout?</Title>
        <Paragraph className="text-on-surface/60 text-lg mb-12">
          Fitur lengkap untuk membantumu lebih siap menghadapi TKA.
        </Paragraph>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all text-center flex flex-col items-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-md ${feature.iconBg}`}>
                {feature.icon}
              </div>
              <h3 className="font-bold text-lg text-on-surface mb-2">{feature.title}</h3>
              <p className="text-sm text-on-surface/60 max-w-[200px]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
