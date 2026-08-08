import React, { useState } from 'react';
import { 
  CalculatorOutlined,
  ReadOutlined,
  ExperimentOutlined,
  BankOutlined
} from '@ant-design/icons';

const SubjectsWidget: React.FC = () => {
  const [gradeLevel, setGradeLevel] = useState<'SD' | 'SMP'>('SD');

  return (
    <div className="bg-[#fff9f0] rounded-[2rem] p-6 sm:p-10 flex flex-col h-full border border-orange-50 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 z-10 gap-4">
        <h3 className="font-bold text-2xl text-gray-800">Mata Pelajaran TKA</h3>
        <div className="flex bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
          <button 
            className={`px-8 py-2 rounded-lg text-sm font-bold transition-all ${gradeLevel === 'SD' ? 'bg-[#0060ad] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setGradeLevel('SD')}
          >
            SD
          </button>
          <button 
            className={`px-8 py-2 rounded-lg text-sm font-bold transition-all ${gradeLevel === 'SMP' ? 'bg-[#0060ad] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setGradeLevel('SMP')}
          >
            SMP
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 z-10 w-full">
        <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center justify-center gap-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-2">
          <div className="w-20 h-20 rounded-[1.5rem] bg-blue-50 text-blue-500 flex items-center justify-center text-4xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <CalculatorOutlined />
          </div>
          <span className="font-bold text-lg text-gray-700">Matematika</span>
        </div>
        
        <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center justify-center gap-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-2">
          <div className="w-20 h-20 rounded-[1.5rem] bg-orange-50 text-orange-500 flex items-center justify-center text-4xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
            <ReadOutlined />
          </div>
          <span className="font-bold text-lg text-gray-700">Bahasa</span>
        </div>
        
        <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center justify-center gap-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-2">
          <div className="w-20 h-20 rounded-[1.5rem] bg-green-50 text-green-500 flex items-center justify-center text-4xl group-hover:bg-green-500 group-hover:text-white transition-colors">
            <ExperimentOutlined />
          </div>
          <span className="font-bold text-lg text-gray-700">IPA</span>
        </div>
        
        <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center justify-center gap-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-2">
          <div className="w-20 h-20 rounded-[1.5rem] bg-purple-50 text-purple-500 flex items-center justify-center text-4xl group-hover:bg-purple-500 group-hover:text-white transition-colors">
            <BankOutlined />
          </div>
          <span className="font-bold text-lg text-gray-700">PPKn</span>
        </div>
      </div>
      
      <p className="text-sm text-gray-400 mt-8 text-left sm:text-center z-10 w-full">Soal bervariasi, berbasis HOTS, dan sesuai kisi-kisi terbaru.</p>
    </div>
  );
};

export default SubjectsWidget;
