import React, { useState, useEffect } from 'react';
import { Button, Input, Modal, Typography, message, Tooltip } from 'antd';
import { RobotOutlined, SendOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

interface AIAssistantProps {
  onApply: (content: string) => void;
}

const backendUrl = process.env.REACT_APP_LINK_BACKEND?.replace('/api', '') || 'http://127.0.0.1:3026';

const secretKey = process.env.REACT_APP_SECRET_BACKEND || 'Z9ToSwagger1413999';

const AIAssistant: React.FC<AIAssistantProps> = ({ onApply }) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [aiResponse, setAiResponse] = useState('');
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isTyping && aiResponse) {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedResponse(aiResponse.slice(0, i + 1));
        i++;
        if (i === aiResponse.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 15); // Kecepatan ngetik
      return () => clearInterval(interval);
    }
  }, [isTyping, aiResponse]);

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
    setTimeout(() => {
      setAiResponse('');
      setDisplayedResponse('');
      setIsTyping(false);
    }, 300);
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const systemPrompt = `Instruksi untuk AI:
Tolong jawab dengan menggunakan format HTML secara langsung (gunakan tag seperti <h1>, <p>, <ul>, <li>, <strong> dll).
JANGAN gunakan format Markdown (seperti ## atau **).
Untuk penulisan rumus matematika (LaTeX), WAJIB gunakan format Quill Editor berikut (BUKAN $ atau $$):
- Block/Tengah: <p class="ql-align-center"><span class="ql-formula" data-value="RUMUS_LATEX"></span></p>
- Inline/Sejajar: <span class="ql-formula" data-value="RUMUS_LATEX"></span>
      
Berikut adalah permintaan user:
${prompt}`;

      const response = await axios.post(
        `${backendUrl}/api/ai/chat`,
        { prompt: systemPrompt },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'secret-to-apps': secretKey
          } 
        }
      );

      if (response.data && response.data.status) {
        setAiResponse(response.data.data);
        setDisplayedResponse('');
        setIsTyping(true);
      } else {
        message.error(response.data.message || 'Gagal memproses permintaan');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Terjadi kesalahan pada server saat menghubungi AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Tooltip title="Tanya AI">
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<RobotOutlined className="text-2xl" />}
            onClick={() => setOpen(true)}
            className="!w-16 !h-16 !p-0 rounded-full shadow-2xl flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-none transition-transform hover:scale-110"
            style={{ animation: 'bounce 2s infinite' }}
          />
        </Tooltip>
      </div>

      {/* Floating Chat Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-indigo-600">
            <RobotOutlined className="text-xl" />
            <span className="font-bold font-manrope">Rifaya Tryout AI Assistant</span>
          </div>
        }
        open={open}
        onCancel={handleClose}
        footer={null}
        width={450}
        closeIcon={<CloseOutlined />}
        style={{
          top: 'auto',
          bottom: 90,
          right: 32,
          position: 'fixed',
          margin: 0,
        }}
        mask={false} // So user can still see the form
      >
        <div className="py-4">
          {!aiResponse ? (
            <>
              <Text className="block mb-4 text-sm text-on-surface/60">
                Tuliskan instruksi materi yang ingin Anda buat. Jawaban AI akan otomatis menimpa seluruh isi editor.
              </Text>
              <Input.TextArea
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Contoh: Buatkan materi bahasa inggris tentang Past Tense yang mudah dipahami, gunakan tabel untuk contoh kalimat, dan format heading dengan rapi..."
                className="rounded-xl p-3 resize-none mb-4 bg-surface-low/30"
                disabled={loading}
              />
              <Button
                type="primary"
                block
                onClick={handleSend}
                loading={loading}
                icon={!loading && <SendOutlined />}
                className="rounded-xl h-12 bg-indigo-600 hover:bg-indigo-700 font-bold border-none shadow-md shadow-indigo-500/30"
              >
                {loading ? 'AI sedang berpikir...' : 'Generate Materi'}
              </Button>
            </>
          ) : (
            <div className="flex flex-col">
              <div className="bg-surface-low/30 dark:bg-zinc-800/50 rounded-xl p-4 mb-4 text-sm whitespace-pre-wrap font-sans text-on-surface/80 dark:text-zinc-300 max-h-[350px] overflow-y-auto">
                {displayedResponse}
                {isTyping && <span className="animate-pulse font-bold text-indigo-500">|</span>}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => { setAiResponse(''); setDisplayedResponse(''); setIsTyping(false); }} 
                  disabled={isTyping} 
                  className="rounded-xl flex-1 h-11"
                >
                  Tanya Ulang
                </Button>
                <Button 
                  type="primary" 
                  onClick={() => { 
                    onApply(aiResponse); 
                    message.success('Respon AI berhasil disalin ke editor');
                    handleClose(); 
                    setPrompt('');
                  }} 
                  disabled={isTyping}
                  className="rounded-xl flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 font-bold border-none shadow-md shadow-indigo-500/30"
                >
                  {isTyping ? 'Mengetik...' : 'Copy to Body'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-10%);
            animation-timing-function: cubic-bezier(0.8,0,1,1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0,0,0.2,1);
          }
        }
      `}</style>
    </>
  );
};

export default AIAssistant;
