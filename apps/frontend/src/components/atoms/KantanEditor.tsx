import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal, Switch, Typography } from 'antd';
import { FunctionOutlined } from '@ant-design/icons';
import Quill from 'quill';
import QuillTableBetter from 'quill-table-better';
import katex from 'katex';
import 'quill/dist/quill.snow.css';
import 'quill-table-better/dist/quill-table-better.css';
import 'katex/dist/katex.min.css';

const { Text } = Typography;

interface KantanEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  className?: string;
}

const toolbarOptions = [
  [{ header: [2, 3, 4, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['blockquote', 'code-block'],
  ['link', 'image', 'formula'],
  ['table-better'],
  ['clean'],
];

Quill.register({ 'modules/table-better': QuillTableBetter }, true);
window.katex = katex;

const isProbablyHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const MathModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onInsert: (latex: string, block: boolean) => void;
}> = ({ open, onClose, onInsert }) => {
  const [latex, setLatex] = useState('');
  const [block, setBlock] = useState(false);
  const templates = [
    { label: 'Pecahan', value: '\\frac{a}{b}' },
    { label: 'Akar', value: '\\sqrt{x}' },
    { label: 'Pangkat', value: 'x^{n}' },
    { label: 'Sigma', value: '\\sum_{i=1}^{n} x_i' },
    { label: 'Integral', value: '\\int_{a}^{b} f(x)\\,dx' },
    { label: 'Limit', value: '\\lim_{x \\to \\infty} f(x)' },
    { label: 'Fisika', value: 'F = m a' },
    { label: 'Energi', value: 'E_k = \\frac{1}{2}mv^2' },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={520}
      title={<span className="font-black font-manrope flex items-center gap-2"><FunctionOutlined className="text-primary" /> Sisipkan Rumus LaTeX</span>}
      footer={[
        <Button key="cancel" onClick={onClose}>Batal</Button>,
        <Button
          key="insert"
          type="primary"
          onClick={() => {
            if (!latex.trim()) return;
            onInsert(latex.trim(), block);
            setLatex('');
            setBlock(false);
            onClose();
          }}
        >
          Sisipkan
        </Button>,
      ]}
    >
      <div className="space-y-4 py-2">
        <div className="flex flex-wrap gap-2">
          {templates.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => setLatex(item.value)}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px] hover:bg-primary/20 border border-primary/20"
            >
              {item.label}
            </button>
          ))}
        </div>
        <textarea
          rows={4}
          value={latex}
          onChange={event => setLatex(event.target.value)}
          placeholder="\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
          className="w-full rounded-xl border border-on-surface/10 bg-white dark:bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-primary/50"
        />
        <div className="rounded-xl bg-surface-low/40 dark:bg-zinc-800 p-3 min-h-14 overflow-x-auto">
          {latex.trim() ? (
            <div
              className={block ? 'text-center' : ''}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(latex, { displayMode: block, throwOnError: false }),
              }}
            />
          ) : (
            <Text className="text-xs text-on-surface/40 font-bold">Preview rumus akan muncul di sini.</Text>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Switch size="small" checked={block} onChange={setBlock} />
          <Text className="text-xs font-bold">Tampilan block/tengah</Text>
        </div>
      </div>
    </Modal>
  );
};

const KantanEditor: React.FC<KantanEditorProps> = ({ value, onChange, placeholder, rows = 6, className }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastHtmlRef = useRef(value || '');
  const onChangeRef = useRef(onChange);
  const [mathModalOpen, setMathModalOpen] = useState(false);

  const editorMinHeight = useMemo(() => Math.max(rows * 28, 140), [rows]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder,
      modules: {
        table: false,
        toolbar: {
          container: toolbarOptions,
          handlers: {
            image: () => fileInputRef.current?.click(),
            formula: () => setMathModalOpen(true),
          },
        },
        'table-better': {
          language: 'en_US',
          menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'copy', 'delete'],
          toolbarTable: true,
        },
        keyboard: {
          bindings: QuillTableBetter.keyboardBindings,
        },
      },
    });

    quillRef.current = quill;

    if (value) {
      if (isProbablyHtml(value)) {
        const delta = quill.clipboard.convert({ html: value });
        quill.updateContents(delta, Quill.sources.SILENT);
      } else {
        quill.setText(value, Quill.sources.SILENT);
      }
    }

    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      const normalized = html === '<p><br></p>' ? '' : html;
      lastHtmlRef.current = normalized;
      onChangeRef.current(normalized);
    });
  }, [placeholder, value]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const nextValue = value || '';
    if (nextValue === lastHtmlRef.current) return;

    lastHtmlRef.current = nextValue;
    quill.setContents([], Quill.sources.SILENT);
    if (!nextValue) return;

    if (isProbablyHtml(nextValue)) {
      const delta = quill.clipboard.convert({ html: nextValue });
      quill.updateContents(delta, Quill.sources.SILENT);
    } else {
      quill.setText(nextValue, Quill.sources.SILENT);
    }
  }, [value]);

  const insertImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !quillRef.current) return;

    const reader = new FileReader();
    reader.onload = loadEvent => {
      const range = quillRef.current?.getSelection(true);
      quillRef.current?.insertEmbed(range?.index || 0, 'image', loadEvent.target?.result, Quill.sources.USER);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const insertFormula = (latex: string, block: boolean) => {
    const quill = quillRef.current;
    if (!quill) return;

    const range = quill.getSelection(true);
    const index = range?.index || quill.getLength();
    if (block) {
      quill.insertText(index, '\n', Quill.sources.USER);
      quill.insertEmbed(index + 1, 'formula', latex, Quill.sources.USER);
      quill.insertText(index + 2, '\n', Quill.sources.USER);
      quill.setSelection(index + 3, 0, Quill.sources.SILENT);
      return;
    }

    quill.insertEmbed(index, 'formula', latex, Quill.sources.USER);
    quill.insertText(index + 1, ' ', Quill.sources.USER);
    quill.setSelection(index + 2, 0, Quill.sources.SILENT);
  };

  return (
    <div className={`kantan-quill rounded-lg overflow-hidden bg-white dark:bg-zinc-900 border border-on-surface/10 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/5 ${className || ''}`}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={insertImage} />
      <div ref={editorRef} style={{ minHeight: editorMinHeight }} />
      <MathModal open={mathModalOpen} onClose={() => setMathModalOpen(false)} onInsert={insertFormula} />
    </div>
  );
};

export default KantanEditor;
