import React, { useState, useRef } from 'react';
import { Input, Button, Tooltip, Modal, message, Typography, Switch } from 'antd';
import {
  BoldOutlined, ItalicOutlined, PictureOutlined, AlignCenterOutlined,
  OrderedListOutlined, UnorderedListOutlined, CodeOutlined, FunctionOutlined,
} from '@ant-design/icons';
import type { TextAreaRef } from 'antd/es/input/TextArea';

const { TextArea } = Input;
const { Text } = Typography;

interface KantanEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  className?: string;
}

const TB: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <Tooltip title={label} mouseEnterDelay={0.5}>
    <button
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-on-surface/60 hover:bg-surface-low dark:hover:bg-zinc-700 hover:text-on-surface transition-all"
    >
      {icon}
    </button>
  </Tooltip>
);

const MathModal: React.FC<{ open: boolean; onInsert: (t: string, b: boolean) => void; onClose: () => void }> = ({ open, onInsert, onClose }) => {
  const [latex, setLatex] = useState('');
  const [isBlock, setIsBlock] = useState(false);
  const tpls = [
    { l: 'Pecahan', t: '\\frac{a}{b}' }, { l: 'Akar', t: '\\sqrt{x}' },
    { l: 'Pangkat', t: 'x^{n}' }, { l: 'Sigma', t: '\\sum_{i=1}^{n} x_i' },
    { l: 'Integral', t: '\\int_{a}^{b} f(x)\\,dx' }, { l: 'Limit', t: '\\lim_{x \\to \\infty} f(x)' },
  ];
  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={480}
      title={<span className="font-black font-manrope flex items-center gap-2"><FunctionOutlined className="text-primary" /> Sisipkan KaTeX</span>}
      footer={[
        <Button key="c" onClick={onClose}>Batal</Button>,
        <Button key="i" type="primary" onClick={() => { if (latex.trim()) { onInsert(latex.trim(), isBlock); onClose(); setLatex(''); } }}>Sisipkan</Button>
      ]}
    >
      <div className="space-y-4 py-2">
        <div className="flex flex-wrap gap-2">
          {tpls.map(f => (
            <button key={f.l} onClick={() => setLatex(f.t)} className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px] hover:bg-primary/20 border border-primary/20">
              {f.l}
            </button>
          ))}
        </div>
        <TextArea
          rows={3}
          value={latex}
          onChange={e => setLatex(e.target.value)}
          placeholder="\frac{-b \pm \sqrt{b^2-4ac}}{2a}"
          className="rounded-xl font-mono text-sm"
        />
        <div className="flex items-center gap-3">
          <Switch size="small" checked={isBlock} onChange={setIsBlock} />
          <Text className="text-xs font-bold">Tampilan Block (Tengah)</Text>
        </div>
      </div>
    </Modal>
  );
};

const KantanEditor: React.FC<KantanEditorProps> = ({ value, onChange, placeholder, rows = 6, label, className }) => {
  const [mathModal, setMathModal] = useState(false);
  const textareaRef = useRef<TextAreaRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = (before: string, after = '') => {
    const el = textareaRef.current?.resizableTextArea?.textArea;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selection = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);
    const newVal = beforeText + before + selection + after + afterText;
    onChange(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 10);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        // Kita gunakan format HTML img agar bisa resize lebih mudah jika user mau edit hardcode, 
        // atau markdown standart. User minta bisa resize, kita kasih wrapper CSS atau width attribute.
        insertAtCursor(`\n<img src="${base64}" width="300" alt="Gambar Upload" />\n`);
        message.success('Gambar berhasil diunggah dan disisipkan');
      };
      reader.readAsDataURL(file);
    }
  };

  const toolbar = [
    { icon: <BoldOutlined />, label: 'Bold', act: () => insertAtCursor('**', '**') },
    { icon: <ItalicOutlined />, label: 'Italic', act: () => insertAtCursor('_', '_') },
    { icon: <PictureOutlined />, label: 'Unggah Gambar', act: () => fileInputRef.current?.click() },
    { icon: <AlignCenterOutlined />, label: 'Heading ##', act: () => insertAtCursor('\n## ') },
    { icon: <OrderedListOutlined />, label: 'Numbered list', act: () => insertAtCursor('\n1. ') },
    { icon: <UnorderedListOutlined />, label: 'Bullet list', act: () => insertAtCursor('\n- ') },
    { icon: <CodeOutlined />, label: 'Inline kode', act: () => insertAtCursor('`', '`') },
    { icon: <FunctionOutlined />, label: 'Rumus LaTeX', act: () => setMathModal(true) },
  ];

  return (
    <div className={`flex flex-col border border-on-surface/10 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 transition-all focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/5 ${className}`}>
      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Toolbar */}
      <div className="px-3 py-2 bg-surface-low/50 dark:bg-zinc-800 border-b border-on-surface/5 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {toolbar.map((t, idx) => (
            <TB key={idx} icon={t.icon} label={t.label} onClick={t.act} />
          ))}
        </div>
        {label && <Text className="text-[10px] uppercase font-black tracking-widest text-on-surface/30 px-2">{label}</Text>}
      </div>

      {/* TextArea */}
      <TextArea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="border-none shadow-none focus:shadow-none p-4 text-base font-medium font-sans resize-none dark:bg-zinc-900 dark:text-zinc-100 placeholder:text-on-surface/30"
      />

      <MathModal
        open={mathModal}
        onClose={() => setMathModal(false)}
        onInsert={(latex, isBlock) => {
          const tag = isBlock ? `\n\n$$${latex}$$\n\n` : `$${latex}$`;
          insertAtCursor(tag);
        }}
      />
    </div>
  );
};

export default KantanEditor;
