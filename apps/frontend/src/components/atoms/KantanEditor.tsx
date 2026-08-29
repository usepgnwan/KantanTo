import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal, Switch, Typography } from 'antd';
import { FunctionOutlined } from '@ant-design/icons';
import Quill from 'quill';
import QuillTableBetter from 'quill-table-better';
import katex from 'katex';
import 'quill/dist/quill.snow.css';
import 'quill/dist/quill.bubble.css';
import 'quill-table-better/dist/quill-table-better.css';
import 'katex/dist/katex.min.css';
import 'katex/dist/contrib/mhchem.js';

const { Text } = Typography;

interface KantanEditorProps {
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  className?: string;
  theme?: 'snow' | 'bubble';
}

const toolbarOptions = [
  [{ header: [2, 3, 4, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['blockquote', 'code-block'],
  ['link', 'image', 'formula'],
  ['table-better'],
  ['clean'],
];

Quill.register({ 'modules/table-better': QuillTableBetter }, true);
window.katex = katex;

const isProbablyHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

// ── CUSTOM IMAGE BLOT (QUILL V2) ─────────────────────────────────────────────
// Preserves style, width, height, class, and align formats in Quill Deltas & HTML
const BaseImage = Quill.import('formats/image') as any;
const IMAGE_ATTRIBUTES = ['alt', 'height', 'width', 'style', 'class', 'data-align'];

class CustomImage extends BaseImage {
  static blotName = 'image';
  static tagName = 'IMG';

  static create(value: any) {
    const src = typeof value === 'string' ? value : value?.src;
    const node = super.create(src);
    if (typeof value === 'object' && value !== null) {
      if (value.width) node.setAttribute('width', value.width);
      if (value.height) node.setAttribute('height', value.height);
      if (value.style) node.setAttribute('style', value.style);
      if (value.alt) node.setAttribute('alt', value.alt);
      if (value.class) node.setAttribute('class', value.class);
    }
    return node;
  }

  static formats(domNode: HTMLElement) {
    return IMAGE_ATTRIBUTES.reduce((formats: Record<string, string>, attribute: string) => {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute) || '';
      }
      return formats;
    }, {});
  }

  format(name: string, value: any) {
    if (IMAGE_ATTRIBUTES.indexOf(name) > -1) {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}

Quill.register({ 'formats/image': CustomImage }, true);

// ── IMAGE RESIZER & ALIGNMENT OVERLAY MODULE ────────────────────────────────
// ── IMAGE RESIZER & ALIGNMENT OVERLAY MODULE ────────────────────────────────
function setupImageResizer(quill: Quill, onChangeCallback: () => void) {
  let activeImg: HTMLImageElement | null = null;
  let overlay: HTMLDivElement | null = null;
  let isResizing = false;

  function removeOverlay() {
    if (isResizing) return;
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    activeImg = null;
  }

  function updateOverlayPosition() {
    if (!overlay || !activeImg) return;
    if (!document.body.contains(activeImg)) {
      removeOverlay();
      return;
    }

    const iRect = activeImg.getBoundingClientRect();
    if (iRect.width === 0 || iRect.height === 0) return;

    overlay.style.top = `${iRect.top}px`;
    overlay.style.left = `${iRect.left}px`;
    overlay.style.width = `${iRect.width}px`;
    overlay.style.height = `${iRect.height}px`;

    // Check if image is in viewport
    if (iRect.bottom < 0 || iRect.top > window.innerHeight) {
      overlay.style.display = 'none';
    } else {
      overlay.style.display = 'block';
    }

    // Position toolbar above or below depending on room
    const toolbar = overlay.querySelector<HTMLElement>('.kantan-img-toolbar');
    if (toolbar) {
      if (iRect.top < 65) {
        toolbar.style.top = 'calc(100% + 8px)';
        toolbar.style.bottom = 'auto';
      } else {
        toolbar.style.bottom = 'calc(100% + 8px)';
        toolbar.style.top = 'auto';
      }

      const toolbarWidth = toolbar.offsetWidth || 350;
      let shiftX = 0;
      const leftEdge = iRect.left + (iRect.width - toolbarWidth) / 2;
      if (leftEdge < 12) {
        shiftX = 12 - leftEdge;
      } else if (leftEdge + toolbarWidth > window.innerWidth - 12) {
        shiftX = window.innerWidth - 12 - (leftEdge + toolbarWidth);
      }
      toolbar.style.transform = `translateX(calc(-50% + ${shiftX}px))`;
    }

    const sizeText = overlay.querySelector<HTMLElement>('.kantan-img-size-badge');
    if (sizeText) {
      sizeText.textContent = `${Math.round(iRect.width)} × ${Math.round(iRect.height)}`;
    }
  }

  function syncToQuill() {
    if (!activeImg) return;
    const blot = Quill.find(activeImg) as any;
    if (blot) {
      if (activeImg.getAttribute('width')) blot.format('width', activeImg.getAttribute('width'));
      if (activeImg.getAttribute('height')) blot.format('height', activeImg.getAttribute('height'));
      if (activeImg.getAttribute('style')) blot.format('style', activeImg.getAttribute('style'));
    }
    onChangeCallback();
    updateOverlayPosition();
  }

  function setAlignment(align: 'left' | 'center' | 'right' | 'default') {
    if (!activeImg) return;
    activeImg.style.float = '';
    activeImg.style.display = '';
    activeImg.style.margin = '';
    activeImg.style.marginLeft = '';
    activeImg.style.marginRight = '';
    activeImg.style.marginTop = '';
    activeImg.style.marginBottom = '';

    if (align === 'left') {
      activeImg.style.display = 'inline-block';
      activeImg.style.float = 'left';
      activeImg.style.margin = '0 16px 12px 0';
    } else if (align === 'center') {
      activeImg.style.display = 'block';
      activeImg.style.float = 'none';
      activeImg.style.margin = '12px auto';
    } else if (align === 'right') {
      activeImg.style.display = 'inline-block';
      activeImg.style.float = 'right';
      activeImg.style.margin = '0 0 12px 16px';
    } else {
      activeImg.style.display = 'inline';
      activeImg.style.float = 'none';
      activeImg.style.margin = '4px';
    }

    syncToQuill();
  }

  function setQuickWidth(pct: number) {
    if (!activeImg) return;
    const editorWidth = quill.root.clientWidth - 32;
    const targetWidth = Math.round(editorWidth * pct);
    const aspect = (activeImg.naturalWidth && activeImg.naturalHeight)
      ? activeImg.naturalWidth / activeImg.naturalHeight
      : (activeImg.offsetWidth / (activeImg.offsetHeight || 1));
    const targetHeight = Math.round(targetWidth / aspect);

    activeImg.style.width = `${targetWidth}px`;
    activeImg.style.height = `${targetHeight}px`;
    activeImg.setAttribute('width', `${targetWidth}`);
    activeImg.setAttribute('height', `${targetHeight}`);

    syncToQuill();
  }

  function deleteImage() {
    if (!activeImg) return;
    const blot = Quill.find(activeImg) as any;
    if (blot) {
      blot.remove();
    } else {
      activeImg.remove();
    }
    removeOverlay();
    onChangeCallback();
  }

  function startResize(e: MouseEvent, handleId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!activeImg) return;

    isResizing = true;
    const targetImg = activeImg;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = targetImg.getBoundingClientRect().width;
    const startHeight = targetImg.getBoundingClientRect().height;
    const aspect = startWidth / (startHeight || 1);
    const editorWidth = quill.root.clientWidth - 32;

    const onMouseMove = (me: MouseEvent) => {
      try {
        me.preventDefault();
        if (!targetImg || !document.body.contains(targetImg)) return;

        const dx = me.clientX - startX;
        const dy = me.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;

        if (handleId === 'se' || handleId === 'e') {
          newWidth = startWidth + dx;
          newHeight = newWidth / aspect;
        } else if (handleId === 'sw' || handleId === 'w') {
          newWidth = startWidth - dx;
          newHeight = newWidth / aspect;
        } else if (handleId === 'ne') {
          newWidth = startWidth + dx;
          newHeight = newWidth / aspect;
        } else if (handleId === 'nw') {
          newWidth = startWidth - dx;
          newHeight = newWidth / aspect;
        } else if (handleId === 's') {
          newHeight = startHeight + dy;
          newWidth = newHeight * aspect;
        } else if (handleId === 'n') {
          newHeight = startHeight - dy;
          newWidth = newHeight * aspect;
        }

        newWidth = Math.max(50, Math.min(newWidth, editorWidth));
        newHeight = Math.round(newWidth / aspect);

        targetImg.style.width = `${Math.round(newWidth)}px`;
        targetImg.style.height = `${Math.round(newHeight)}px`;
        targetImg.setAttribute('width', `${Math.round(newWidth)}`);
        targetImg.setAttribute('height', `${Math.round(newHeight)}`);

        updateOverlayPosition();
      } catch (err) {
        // Safe fallback
      }
    };

    const onMouseUp = () => {
      isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      syncToQuill();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function createOverlay(img: HTMLImageElement) {
    if (activeImg === img && overlay) {
      updateOverlayPosition();
      return;
    }
    removeOverlay();
    activeImg = img;

    const iRect = img.getBoundingClientRect();

    const ov = document.createElement('div');
    ov.className = 'kantan-img-overlay';
    ov.style.cssText = `
      position: fixed !important;
      top: ${iRect.top}px !important;
      left: ${iRect.left}px !important;
      width: ${iRect.width}px !important;
      height: ${iRect.height}px !important;
      box-sizing: border-box !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
      border: 2px solid #0053dd !important;
      box-shadow: 0 0 0 2px rgba(0,83,221,0.3) !important;
    `;

    // 8 Resize Handles
    const handles = [
      { id: 'nw', cursor: 'nw-resize', top: '-7px', left: '-7px' },
      { id: 'n',  cursor: 'n-resize',  top: '-7px', left: 'calc(50% - 7px)' },
      { id: 'ne', cursor: 'ne-resize', top: '-7px', right: '-7px' },
      { id: 'e',  cursor: 'e-resize',  top: 'calc(50% - 7px)', right: '-7px' },
      { id: 'se', cursor: 'se-resize', bottom: '-7px', right: '-7px' },
      { id: 's',  cursor: 's-resize',  bottom: '-7px', left: 'calc(50% - 7px)' },
      { id: 'sw', cursor: 'sw-resize', bottom: '-7px', left: '-7px' },
      { id: 'w',  cursor: 'w-resize',  top: 'calc(50% - 7px)', left: '-7px' },
    ];

    handles.forEach(h => {
      const hEl = document.createElement('div');
      hEl.style.cssText = `
        position: absolute !important;
        width: 14px !important;
        height: 14px !important;
        background: #0053dd !important;
        border: 2.5px solid #ffffff !important;
        border-radius: 50% !important;
        box-shadow: 0 2px 5px rgba(0,0,0,0.4) !important;
        box-sizing: border-box !important;
        cursor: ${h.cursor} !important;
        pointer-events: auto !important;
        ${h.top ? `top: ${h.top} !important;` : ''}
        ${h.bottom ? `bottom: ${h.bottom} !important;` : ''}
        ${h.left ? `left: ${h.left} !important;` : ''}
        ${h.right ? `right: ${h.right} !important;` : ''}
      `;
      hEl.addEventListener('mousedown', e => startResize(e, h.id));
      ov.appendChild(hEl);
    });

    // Floating Action Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'kantan-img-toolbar';
    toolbar.style.cssText = `
      position: absolute !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      bottom: calc(100% + 8px) !important;
      background: #0f172a !important;
      border-radius: 10px !important;
      padding: 6px 10px !important;
      display: flex !important;
      align-items: center !important;
      gap: 5px !important;
      pointer-events: auto !important;
      white-space: nowrap !important;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.4) !important;
      z-index: 2147483647 !important;
      border: 1px solid rgba(255,255,255,0.18) !important;
    `;

    const createBtn = (label: string, title: string, onClick: () => void, isDanger = false) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = title;
      btn.innerHTML = label;
      btn.style.cssText = `
        background: ${isDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)'} !important;
        border: 1px solid ${isDanger ? 'rgba(239, 68, 68, 0.45)' : 'rgba(255,255,255,0.18)'} !important;
        color: ${isDanger ? '#ef4444' : '#ffffff'} !important;
        border-radius: 6px !important;
        padding: 4px 9px !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        gap: 3px !important;
        line-height: 1.2 !important;
        user-select: none !important;
      `;
      btn.addEventListener('mousedown', e => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      });
      return btn;
    };

    const addDivider = () => {
      const sep = document.createElement('div');
      sep.style.cssText = 'width: 1px !important; height: 18px !important; background: rgba(255,255,255,0.18) !important; margin: 0 3px !important;';
      toolbar.appendChild(sep);
    };

    toolbar.appendChild(createBtn('⬅ Kiri', 'Rata Kiri (Wrap Text)', () => setAlignment('left')));
    toolbar.appendChild(createBtn('⬛ Tengah', 'Rata Tengah (Center)', () => setAlignment('center')));
    toolbar.appendChild(createBtn('➡ Kanan', 'Rata Kanan (Wrap Text)', () => setAlignment('right')));
    toolbar.appendChild(createBtn('↩ Normal', 'Posisi Normal (Inline)', () => setAlignment('default')));

    addDivider();

    toolbar.appendChild(createBtn('25%', 'Ubah ukuran ke 25%', () => setQuickWidth(0.25)));
    toolbar.appendChild(createBtn('50%', 'Ubah ukuran ke 50%', () => setQuickWidth(0.50)));
    toolbar.appendChild(createBtn('75%', 'Ubah ukuran ke 75%', () => setQuickWidth(0.75)));
    toolbar.appendChild(createBtn('100%', 'Ubah ukuran ke 100%', () => setQuickWidth(1.0)));

    addDivider();

    const badge = document.createElement('span');
    badge.className = 'kantan-img-size-badge';
    badge.style.cssText = `
      color: rgba(255,255,255,0.7) !important;
      font-size: 10px !important;
      font-family: monospace !important;
      padding: 0 4px !important;
      user-select: none !important;
    `;
    badge.textContent = `${Math.round(iRect.width)} × ${Math.round(iRect.height)}`;
    toolbar.appendChild(badge);

    addDivider();

    toolbar.appendChild(createBtn('🗑', 'Hapus Gambar', () => deleteImage(), true));

    ov.appendChild(toolbar);
    document.body.appendChild(ov);
    overlay = ov;
    updateOverlayPosition();
  }

  // Intercept image clicks directly in the CAPTURE phase so nothing can prevent it
  function onEditorPointer(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const img = target && (target.tagName === 'IMG' ? target : target.closest('img'));
    if (img && quill.root.contains(img)) {
      e.preventDefault();
      e.stopPropagation();
      createOverlay(img as HTMLImageElement);
    }
  }

  function onDocMousedown(e: MouseEvent) {
    if (isResizing) return;
    const target = e.target as HTMLElement;
    if (overlay && overlay.contains(target)) return;
    if (activeImg && (target === activeImg || activeImg.contains(target))) return;
    if (target && target.tagName === 'IMG' && quill.root.contains(target)) return;
    removeOverlay();
  }

  function onScrollOrResize() {
    updateOverlayPosition();
  }

  function onKeydown(e: KeyboardEvent) {
    if (activeImg) {
      if (e.key === 'Escape') {
        removeOverlay();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteImage();
      }
    }
  }

  // Set capture = true on editor root
  quill.root.addEventListener('mousedown', onEditorPointer, true);
  quill.root.addEventListener('click', onEditorPointer, true);
  window.addEventListener('scroll', onScrollOrResize, true);
  window.addEventListener('resize', onScrollOrResize);
  document.addEventListener('mousedown', onDocMousedown, false);
  document.addEventListener('keydown', onKeydown);

  return () => {
    quill.root.removeEventListener('mousedown', onEditorPointer, true);
    quill.root.removeEventListener('click', onEditorPointer, true);
    window.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize);
    document.removeEventListener('mousedown', onDocMousedown, false);
    document.removeEventListener('keydown', onKeydown);
    removeOverlay();
  };
}

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
    { label: 'Kimia', value: '\\ce{H2O}' },
    { label: 'Reaksi', value: '\\ce{CO2 + C -> 2 CO}' },
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

const KantanEditor: React.FC<KantanEditorProps> = ({ value, onChange, placeholder, rows = 6, className, theme = 'snow' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastHtmlRef = useRef(value || '');
  const onChangeRef = useRef(onChange);
  const [mathModalOpen, setMathModalOpen] = useState(false);

  const editorMinHeight = useMemo(() => Math.max(rows * 40, 120), [rows]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current) return;

    let quill = quillRef.current;
    if (!quill) {
      quill = new Quill(editorRef.current, {
        theme: theme,
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
        const html = quill!.root.innerHTML;
        const normalized = html === '<p><br></p>' ? '' : html;
        lastHtmlRef.current = normalized;
        if (onChangeRef.current) {
          onChangeRef.current(normalized);
        }
      });
    }

    const emitChange = () => {
      const html = quill!.root.innerHTML;
      const normalized = html === '<p><br></p>' ? '' : html;
      lastHtmlRef.current = normalized;
      if (onChangeRef.current) onChangeRef.current(normalized);
    };

    const cleanupResizer = setupImageResizer(quill!, emitChange);

    return () => {
      cleanupResizer();
    };
  }, []);

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
    <div className={`kantan-quill relative rounded-lg bg-white dark:bg-zinc-900 border border-on-surface/10 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/5 ${className || ''}`}>
      <style>{`
        .kantan-quill .ql-editor img {
          cursor: pointer !important;
          user-select: none !important;
          -webkit-user-select: none !important;
          transition: outline 0.15s ease;
        }
        .kantan-quill .ql-editor img:hover {
          outline: 2px dashed #0053dd !important;
          outline-offset: 2px;
        }
      `}</style>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={insertImage} />
      <div ref={editorRef} style={{ minHeight: theme === 'bubble' ? 20 : editorMinHeight }} />
      <MathModal open={mathModalOpen} onClose={() => setMathModalOpen(false)} onInsert={insertFormula} />
    </div>
  );
};

export default KantanEditor;
