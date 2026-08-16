import React, { useState, useEffect } from 'react';
import { Button, Input, Modal, Typography, message, Tooltip } from 'antd';
import { RobotOutlined, SendOutlined, CloseOutlined, FastForwardOutlined } from '@ant-design/icons';
import axios from 'axios';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const { Text } = Typography;

interface AIAssistantProps {
  onApply: (content: string) => void;
}

const backendUrl = process.env.REACT_APP_LINK_BACKEND || 'http://127.0.0.1:3026/api';
const secretKey = process.env.REACT_APP_SECRET_BACKEND || 'Z9ToSwagger1413999';

const renderPreviewContent = (html: string): string => {
  if (!html) return '';
  
  let processedHtml = html;

  // 1. Convert Quill formula spans (<span class="ql-formula" data-value="..."></span>)
  processedHtml = processedHtml.replace(/<span[^>]*class="ql-formula"[^>]*data-value="([^"]+)"[^>]*>.*?<\/span>/g, (match, latex) => {
    try {
      const decodedLatex = latex.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      return katex.renderToString(decodedLatex, { throwOnError: false, displayMode: false });
    } catch (e) {
      return match;
    }
  });

  // 2. Convert Block Markdown Math $$ ... $$
  processedHtml = processedHtml.replace(/\$\$([\s\S]+?)\$\$/g, (match, latex) => {
    try {
      const decodedLatex = latex.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      return `<div class="my-3 flex justify-center overflow-x-auto">${katex.renderToString(decodedLatex, { throwOnError: false, displayMode: true })}</div>`;
    } catch (e) {
      return match;
    }
  });

  // 3. Convert Inline Markdown Math $ ... $
  processedHtml = processedHtml.replace(/\$([^$\n]+?)\$/g, (match, latex) => {
    try {
      const decodedLatex = latex.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      return katex.renderToString(decodedLatex, { throwOnError: false, displayMode: false });
    } catch (e) {
      return match;
    }
  });

  return processedHtml;
};

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
        // Fast-forward past complete HTML tags so HTML structure remains valid during typing
        if (aiResponse[i] === '<') {
          const closeIndex = aiResponse.indexOf('>', i);
          if (closeIndex !== -1) {
            i = closeIndex;
          }
        } else if (aiResponse[i] === '&') {
          const semiIndex = aiResponse.indexOf(';', i);
          if (semiIndex !== -1 && semiIndex - i < 10) {
            i = semiIndex;
          }
        }

        i++;
        setDisplayedResponse(aiResponse.slice(0, i));

        if (i >= aiResponse.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 15); // Typing speed
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
        `${backendUrl.replace(/\/+$/, '')}/ai/chat`,
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
        width={550}
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
              {/* Rendered HTML Container */}
              <div className="ai-rendered-preview bg-white dark:bg-zinc-800/90 border border-indigo-100 dark:border-zinc-700/60 rounded-2xl p-5 mb-4 text-sm font-sans text-on-surface/90 dark:text-zinc-200 max-h-[380px] overflow-y-auto shadow-inner leading-relaxed">
                <div 
                  className="ai-content-body inline"
                  dangerouslySetInnerHTML={{ __html: renderPreviewContent(displayedResponse) }} 
                />
                {isTyping && (
                  <span className="inline-block animate-pulse font-bold text-indigo-500 text-base ml-1">
                    ●
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => { setAiResponse(''); setDisplayedResponse(''); setIsTyping(false); }} 
                  disabled={isTyping} 
                  className="rounded-xl flex-1 h-11"
                >
                  Tanya Ulang
                </Button>
                {isTyping && (
                  <Button
                    icon={<FastForwardOutlined />}
                    onClick={() => {
                      setDisplayedResponse(aiResponse);
                      setIsTyping(false);
                    }}
                    className="rounded-xl h-11 px-4 text-indigo-600 border-indigo-200 hover:border-indigo-400"
                  >
                    Lewati
                  </Button>
                )}
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
        .ai-rendered-preview h1 { font-size: 1.35rem; font-weight: 800; margin: 0.75rem 0 0.4rem 0; color: #1e1b4b; line-height: 1.3; }
        .ai-rendered-preview h2 { font-size: 1.2rem; font-weight: 700; margin: 0.65rem 0 0.35rem 0; color: #312e81; line-height: 1.35; }
        .ai-rendered-preview h3 { font-size: 1.05rem; font-weight: 700; margin: 0.55rem 0 0.3rem 0; color: #3730a3; line-height: 1.4; }
        .ai-rendered-preview p { margin-bottom: 0.6rem; line-height: 1.6; }
        .ai-rendered-preview ul { list-style-type: disc; padding-left: 1.4rem; margin-bottom: 0.6rem; }
        .ai-rendered-preview ol { list-style-type: decimal; padding-left: 1.4rem; margin-bottom: 0.6rem; }
        .ai-rendered-preview li { margin-bottom: 0.2rem; line-height: 1.5; }
        .ai-rendered-preview table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.85rem; }
        .ai-rendered-preview th, .ai-rendered-preview td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
        .ai-rendered-preview th { background-color: #f8fafc; font-weight: 600; color: #1e293b; }
        .ai-rendered-preview .ql-align-center { text-align: center; }
        .ai-rendered-preview .ql-align-right { text-align: right; }
        .ai-rendered-preview .ql-align-justify { text-align: justify; }
        .ai-rendered-preview blockquote { border-left: 3px solid #6366f1; padding-left: 0.75rem; margin: 0.6rem 0; color: #4b5563; font-style: italic; }
        .ai-rendered-preview strong { font-weight: 700; color: #0f172a; }
        .ai-rendered-preview code { background-color: #f1f5f9; padding: 2px 5px; border-radius: 4px; font-family: monospace; font-size: 0.85em; color: #4338ca; }
      `}</style>
    </>
  );
};

export default AIAssistant;
