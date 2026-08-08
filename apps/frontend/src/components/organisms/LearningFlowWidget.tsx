import React from 'react';
import { 
  UserOutlined,
  FileTextOutlined,
  LineChartOutlined
} from '@ant-design/icons';

const LearningFlowWidget: React.FC = () => {
  return (
    <div className="bg-[#f2faf7] rounded-[2rem] p-6 sm:p-10 flex flex-col h-full border border-green-50 overflow-hidden relative">
      <h3 className="font-bold text-2xl text-green-700 mb-10 z-10">Alur Belajar di Rifaya Tryout</h3>
      
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-between gap-4 z-10 w-full px-4 sm:px-8">
        
        <div className="flex flex-col items-center text-center max-w-[150px]">
           <div className="w-20 h-20 rounded-full bg-[#10b981] text-white flex items-center justify-center text-4xl mb-4 shadow-lg shadow-green-500/20 hover:scale-110 transition-transform cursor-default">
              <UserOutlined />
           </div>
           <span className="text-lg font-bold text-gray-800 mb-1">Daftar</span>
           <span className="text-xs text-gray-500 leading-relaxed px-2">Pilih paket sesuai kebutuhanmu.</span>
        </div>
        
        <div className="hidden lg:flex flex-1 items-center justify-center text-green-200">
           <span className="text-4xl px-2">➔</span>
        </div>
        
        <div className="flex flex-col items-center text-center max-w-[150px] mt-6 lg:mt-0">
           <div className="w-20 h-20 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-4xl mb-4 shadow-lg shadow-blue-500/20 hover:scale-110 transition-transform cursor-default">
              <FileTextOutlined />
           </div>
           <span className="text-lg font-bold text-gray-800 mb-1">Kerjakan Tryout</span>
           <span className="text-xs text-gray-500 leading-relaxed px-2">Kerjakan tryout kapan saja.</span>
        </div>

        <div className="hidden lg:flex flex-1 items-center justify-center text-green-200">
           <span className="text-4xl px-2">➔</span>
        </div>
        
        <div className="flex flex-col items-center text-center max-w-[150px] mt-6 lg:mt-0">
           <div className="w-20 h-20 rounded-full bg-[#f97316] text-white flex items-center justify-center text-4xl mb-4 shadow-lg shadow-orange-500/20 hover:scale-110 transition-transform cursor-default">
              <LineChartOutlined />
           </div>
           <span className="text-lg font-bold text-gray-800 mb-1">Lihat Hasil</span>
           <span className="text-xs text-gray-500 leading-relaxed px-2">Lihat skor dan analisis kemampuanmu.</span>
        </div>
        
        <div className="hidden lg:flex flex-1 items-center justify-center text-green-200">
           <span className="text-4xl px-2">➔</span>
        </div>
        
        <div className="flex flex-col items-center text-center max-w-[150px] mt-6 lg:mt-0">
           <div className="w-20 h-20 rounded-full bg-[#a855f7] text-white flex items-center justify-center text-3xl mb-4 shadow-lg shadow-purple-500/20 hover:scale-110 transition-transform cursor-default">
              <span className="font-bold font-manrope text-4xl">4</span>
           </div>
           <span className="text-lg font-bold text-gray-800 mb-1">Belajar & Perbaiki</span>
           <span className="text-xs text-gray-500 leading-relaxed px-2">Pelajari pembahasan dan tingkatkan skor!</span>
        </div>
      </div>
    </div>
  );
};

export default LearningFlowWidget;
