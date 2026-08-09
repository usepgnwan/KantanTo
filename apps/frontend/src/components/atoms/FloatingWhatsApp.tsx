import React, { useEffect, useState } from 'react';
import { WhatsAppOutlined } from '@ant-design/icons';
import { getSetting } from '../../services/settingService';

const FloatingWhatsApp: React.FC = () => {
  const [waNumber, setWaNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchWa = async () => {
      try {
        const config = await getSetting();
        if (config && config.no_wa) {
          // Format phone number to start with 62 instead of 0
          let formatted = config.no_wa.replace(/\D/g, '');
          if (formatted.startsWith('0')) {
            formatted = '62' + formatted.substring(1);
          }
          setWaNumber(formatted);
        }
      } catch (error) {
        console.error('Failed to fetch WA setting:', error);
      }
    };
    
    fetchWa();
  }, []);

  if (!waNumber) return null;

  const handleClick = () => {
    window.open(`https://wa.me/${waNumber}?text=Halo%20Admin%20Rifaya,%20saya%20butuh%20bantuan.`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-[2rem] shadow-2xl shadow-green-500/40 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110"
      aria-label="Chat with Admin on WhatsApp"
    >
      <WhatsAppOutlined className="text-4xl" />
    </button>
  );
};

export default FloatingWhatsApp;
