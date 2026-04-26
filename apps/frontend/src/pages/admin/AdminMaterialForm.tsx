import React, { useState, useRef, useCallback, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Row, Col, Card, Form, Input, Button, Upload, Typography,
  Space, Tag, Divider, Modal, message, Switch, Tooltip,
  Select, Badge, Avatar,
} from 'antd';
import {
  BoldOutlined, ItalicOutlined, UnderlineOutlined, OrderedListOutlined,
  UnorderedListOutlined, LinkOutlined, PictureOutlined, FilePdfOutlined,
  SaveOutlined, EyeOutlined, FunctionOutlined, DeleteOutlined,
  FullscreenOutlined, CodeOutlined, AlignLeftOutlined, AlignCenterOutlined,
  FileTextOutlined, UploadOutlined, CheckCircleOutlined,
  PlusOutlined, EditOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';

const { Title, Text, Paragraph } = Typography;

// ─── KaTeX helper — uses window.katex if available ───────────
declare global { interface Window { katex?: any; renderMathInElement?: any; } }

const renderKaTeX = (latex: string, displayMode = false): string => {
  if (window.katex) {
    try {
      return window.katex.renderToString(latex, { displayMode, throwOnError: false });
    } catch { return latex; }
  }
  return `<span class="katex-placeholder font-mono bg-blue-50 text-blue-700 px-1 rounded text-sm">${displayMode ? '$$' : '$'}${latex}${displayMode ? '$$' : '$'}</span>`;
};

// ─── Simple markdown-like renderer with math support ─────────
const renderContent = (raw: string): string => {
  return raw
    .replace(/\$\$([^$]+)\$\$/g, (_, latex) => `<div class="my-4 flex justify-center overflow-x-auto">${renderKaTeX(latex, true)}</div>`)
    .replace(/\$([^$\n]+)\$/g, (_, latex) => renderKaTeX(latex, false))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-black font-manrope mt-6 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-black font-manrope mt-8 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-black font-manrope mt-10 mb-4">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-6 mb-1 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-6 mb-1 list-decimal">$2</li>')
    .replace(/`(.+?)`/g, '<code class="bg-surface-low dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')
    .replace(/\n{2,}/g, '</p><p class="mb-4 leading-loose">')
    .replace(/^(?!<[h|l|d])(.+)$/gm, (line) => line.trim() ? line : '');
};

const MathModal: React.FC<{ open: boolean; onInsert: (tex: string, block: boolean) => void; onClose: () => void }> = ({ open, onInsert, onClose }) => {
  const [latex, setLatex] = useState('');
  const [isBlock, setIsBlock] = useState(false);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (latex) setPreview(renderKaTeX(latex, isBlock));
  }, [latex, isBlock]);

  const commonFormulas = [
    { label: 'Pecahan', tex: '\\frac{a}{b}' },
    { label: 'Akar', tex: '\\sqrt{x}' },
    { label: 'Pangkat', tex: 'x^{n}' },
    { label: 'Sigma', tex: '\\sum_{i=1}^{n} x_i' },
    { label: 'Integral', tex: '\\int_{a}^{b} f(x)\\,dx' },
    { label: 'Limit', tex: '\\lim_{x \\to \\infty} f(x)' },
    { label: 'Vektor', tex: '\\vec{v} = \\begin{pmatrix} x \\\\ y \\end{pmatrix}' },
    { label: 'Trigonometri', tex: '\\sin^2(x) + \\cos^2(x) = 1' },
    { label: 'Log', tex: '\\log_{a}(b)' },
    { label: 'Pi', tex: '\\pi r^2' },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2 font-manrope font-black">
          <FunctionOutlined className="text-primary" /> Sisipkan Rumus Matematika (LaTeX)
        </div>
      }
      footer={[
        <Button key="cancel" onClick={onClose}>Batal</Button>,
        <Button
          key="insert"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => { if (latex.trim()) { onInsert(latex.trim(), isBlock); onClose(); setLatex(''); } }}
          className="rounded-xl font-bold shadow-md shadow-primary/20"
        >
          Sisipkan Rumus
        </Button>,
      ]}
      width={640}
    >
      <div className="space-y-4 py-2">
        {/* Quick templates */}
        <div>
          <Text className="block text-xs uppercase font-black tracking-widest text-on-surface/40 mb-2">Template Cepat</Text>
          <div className="flex flex-wrap gap-2">
            {commonFormulas.map((f) => (
              <button
                key={f.label}
                onClick={() => setLatex(f.tex)}
                className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-all border border-primary/20"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* LaTeX input */}
        <div>
          <Text className="block text-xs uppercase font-black tracking-widest text-on-surface/40 mb-2">Kode LaTeX</Text>
          <Input.TextArea
            rows={3}
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
            className="rounded-xl font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch size="small" checked={isBlock} onChange={setIsBlock} />
          <Text className="text-sm font-bold">Tampilan Block (di baris sendiri)</Text>
        </div>

        {/* Preview */}
        {latex && (
          <div>
            <Text className="block text-xs uppercase font-black tracking-widest text-on-surface/40 mb-2">Pratinjau</Text>
            <div
              className="p-4 rounded-2xl bg-surface-low dark:bg-zinc-800 border border-on-surface/10 overflow-x-auto min-h-[60px] flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: `<p class="mb-0">${preview}</p>` }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── Toolbar Button ───────────────────────────────────────────
const ToolBtn: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }> = ({ icon, label, onClick, active }) => (
  <Tooltip title={label} mouseEnterDelay={0.5}>
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${active ? 'bg-primary text-white' : 'text-on-surface/60 hover:bg-surface-low dark:hover:bg-zinc-700 hover:text-on-surface'}`}
    >
      {icon}
    </button>
  </Tooltip>
);

interface BlogPost {
  key: string;
  title: string;
  category: string;
  author: string;
  status: 'published' | 'draft';
  date: string;
  content: string;
}

const initialPosts: BlogPost[] = [
  { key: '1', title: 'Panduan Lengkap Lolos UTBK 2024', category: 'Tips & Trick', author: 'Admin Kantan', status: 'published', date: '2024-04-15', content: '## Konten Blog...' },
  { key: '2', title: 'Update Jadwal Seleksi Mandiri PTN', category: 'Berita', author: 'Siska Wahyuni', status: 'published', date: '2024-04-20', content: '## Konten Blog...' },
  { key: '3', title: 'Promo Bundling Paket Intensif', category: 'Promo', author: 'Team Marketing', status: 'draft', date: '2024-04-22', content: '## Konten Blog...' },
];

const AdminMaterialForm: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form] = Form.useForm();
  const [body, setBody] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [mathModalOpen, setMathModalOpen] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<UploadFile[]>([]);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCreate = () => {
    setEditingPost(null);
    setBody('');
    form.resetFields();
    setView('editor');
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setBody(post.content);
    form.setFieldsValue(post);
    setView('editor');
  };

  const deletePost = (key: string) => {
    setPosts(posts.filter(p => p.key !== key));
    message.success('Artikel dihapus');
  };

  // Re-render KaTeX after preview mode
  useEffect(() => {
    if (previewMode && window.renderMathInElement) {
      setTimeout(() => {
        const el = document.getElementById('material-preview');
        if (el) window.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
          ]
        });
      }, 100);
    }
  }, [previewMode, body]);

  const insertAtCursor = useCallback((before: string, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.substring(start, end);
    const newBody = body.substring(0, start) + before + selected + after + body.substring(end);
    setBody(newBody);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  }, [body]);

  const insertMath = (tex: string, block: boolean) => {
    if (block) {
      insertAtCursor('\n\n$$' + tex + '$$\n\n');
    } else {
      insertAtCursor('$', '$');
      // put the tex in between
      const ta = textareaRef.current;
      if (!ta) return;
      const cursor = ta.selectionStart;
      setBody(prev => prev.substring(0, cursor) + tex + prev.substring(cursor));
    }
  };

  const toolbar = [
    { icon: <BoldOutlined />, label: 'Bold (**text**)', action: () => insertAtCursor('**', '**') },
    { icon: <ItalicOutlined />, label: 'Italic (_text_)', action: () => insertAtCursor('_', '_') },
    { icon: <UnderlineOutlined />, label: 'Heading ##', action: () => insertAtCursor('\n## ', '') },
    { icon: <OrderedListOutlined />, label: 'Ordered list', action: () => insertAtCursor('\n1. ', '') },
    { icon: <UnorderedListOutlined />, label: 'Unordered list', action: () => insertAtCursor('\n- ', '') },
    { icon: <CodeOutlined />, label: 'Inline kode', action: () => insertAtCursor('`', '`') },
    { icon: <AlignCenterOutlined />, label: 'Heading ##', action: () => insertAtCursor('\n### ', '') },
    { icon: <FunctionOutlined />, label: 'Rumus Matematika', action: () => setMathModalOpen(true) },
  ];

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      const updatedPost: BlogPost = {
        key: editingPost?.key || Date.now().toString(),
        date: editingPost?.date || new Date().toISOString().split('T')[0],
        content: body,
        ...vals,
      };

      if (editingPost) {
        setPosts(posts.map(p => p.key === editingPost.key ? updatedPost : p));
      } else {
        setPosts([updatedPost, ...posts]);
      }

      setSaved(true);
      message.success(`Artikel "${vals.title}" berhasil disimpan!`);
      setTimeout(() => setView('list'), 1000);
    } catch {
      message.error('Harap lengkapi semua field wajib.');
    }
  };

  if (view === 'list') {
    return (
      <AdminLayout>
        <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <div>
                <Title level={1} className="!text-3xl !font-manrope !font-black !m-0">Manajemen Blog</Title>
                <Text className="text-on-surface/50">Kelola artikel, berita, dan tips untuk siswa</Text>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={handleCreate}
                className="rounded-2xl h-12 px-8 font-black shadow-xl shadow-primary/20"
              >
                Tulis Artikel Baru
              </Button>
            </div>

            <Row gutter={[24, 24]}>
              {posts.map((post) => (
                <Col xs={24} sm={12} lg={8} key={post.key}>
                  <Card
                    hoverable
                    className="rounded-3xl border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-900 group"
                    actions={[
                      <Tooltip title="Edit Artikel"><EditOutlined key="edit" onClick={() => handleEdit(post)} /></Tooltip>,
                      <Tooltip title="Hapus"><DeleteOutlined key="delete" onClick={() => deletePost(post.key)} /></Tooltip>,
                      <Tooltip title="Preview"><EyeOutlined key="view" /></Tooltip>,
                    ]}
                  >
                    <div className="p-1 px-4 pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <Tag className="rounded-lg border-none bg-primary/10 text-primary font-black text-[9px] uppercase">{post.category}</Tag>
                        <Badge status={post.status === 'published' ? 'success' : 'default'} text={<span className="text-[10px] font-bold uppercase text-on-surface/40">{post.status === 'published' ? 'Live' : 'Draft'}</span>} />
                      </div>
                      <Title level={4} className="!font-manrope !font-black !m-0 mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors h-[48px]">
                        {post.title}
                      </Title>
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-on-surface/5">
                        <Avatar size="small" className="bg-primary/20 text-primary font-bold">{post.author[0]}</Avatar>
                        <div>
                          <Text className="text-[10px] font-black block leading-none">{post.author}</Text>
                          <Text className="text-[9px] text-on-surface/30 font-bold">{post.date}</Text>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setView('list')}
                className="rounded-xl border-none bg-white dark:bg-zinc-800 shadow-sm h-11 w-11 flex items-center justify-center p-0"
              />
              <div>
                <Text className="text-[10px] uppercase font-black tracking-widest text-primary/60 block mb-1">Editor Artikel</Text>
                <Title level={1} className="!text-3xl !font-manrope !font-black !m-0">
                  {editingPost ? 'Edit Artikel' : 'Tulis Artikel Baru'}
                </Title>
              </div>
            </div>
            <Space className="mt-4 sm:mt-0 flex-wrap">
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-full px-3 py-1 border border-on-surface/10 dark:border-white/10">
                <EyeOutlined className="text-on-surface/40 text-sm" />
                <Text className="text-xs font-bold text-on-surface/60 dark:text-zinc-400">Pratinjau</Text>
                <Switch size="small" checked={previewMode} onChange={setPreviewMode} />
              </div>
              <Button
                type="primary"
                icon={saved ? <CheckCircleOutlined /> : <SaveOutlined />}
                onClick={handleSave}
                size="large"
                className={`h-11 rounded-2xl font-bold shadow-lg ${saved ? 'shadow-green-500/20' : 'shadow-primary/20'}`}
              >
                {saved ? 'Dipublikasikan' : 'Simpan & Publikasi'}
              </Button>
            </Space>
          </div>

          <Row gutter={[24, 24]}>
            {/* ── LEFT: Editor ──── */}
            <Col xs={24} lg={previewMode ? 12 : 24}>
              <div className="space-y-6">
                {/* Meta */}
                <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
                  <Title level={5} className="!font-manrope !font-black !mb-5 flex items-center gap-2">
                    <FileTextOutlined className="text-primary" /> Detail Artikel
                  </Title>
                  <Form form={form} layout="vertical" requiredMark={false} initialValues={{ status: 'published', author: 'Admin Kantan' }}>
                    <Row gutter={[16, 0]}>
                      <Col xs={24} sm={16}>
                        <Form.Item name="title" label={<span className="font-bold text-sm">Judul Artikel</span>} rules={[{ required: true, message: 'Judul wajib diisi' }]}>
                          <Input
                            placeholder="Cth: Tips Lolos UTBK-SNBT 2024"
                            className="rounded-xl h-12 text-base font-bold"
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item name="category" label={<span className="font-bold text-sm">Kategori Blog</span>}>
                          <Select
                            className="w-full rounded-xl"
                            style={{ height: 48 }}
                            options={[
                              { value: 'Tips & Trick', label: 'Tips & Trick' },
                              { value: 'Berita', label: 'Berita' },
                              { value: 'Promo', label: 'Promo' },
                              { value: 'Informasi Kampus', label: 'Informasi Kampus' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item name="author" label={<span className="font-bold text-sm">Penulis</span>}>
                          <Input placeholder="Nama Penulis" className="rounded-xl h-12" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item name="status" label={<span className="font-bold text-sm">Status Publikasi</span>}>
                          <Select
                            className="w-full rounded-xl"
                            style={{ height: 48 }}
                            options={[
                              { value: 'published', label: 'Terbit' },
                              { value: 'draft', label: 'Draf' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item name="tags" label={<span className="font-bold text-sm">Tags (Pisahkan koma)</span>}>
                          <Input placeholder="utbk, belajar, tips" className="rounded-xl h-12" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </Card>

                {/* Rich Editor */}
                <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md p-0 overflow-hidden">
                  {/* Editor Toolbar */}
                  <div className="flex items-center gap-1 flex-wrap px-4 py-3 border-b border-on-surface/5 dark:border-white/5 bg-surface-low/50 dark:bg-zinc-800/50">
                    {toolbar.map((t, i) => (
                      <React.Fragment key={i}>
                        {i === 7 && <div className="w-px h-5 bg-on-surface/10 dark:bg-white/10 mx-1" />}
                        <ToolBtn icon={t.icon} label={t.label} onClick={t.action} />
                      </React.Fragment>
                    ))}
                    <div className="ml-auto flex items-center gap-1">
                      <Tag className="rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-none font-bold text-[10px] px-2">
                        Markdown + LaTeX
                      </Tag>
                    </div>
                  </div>

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => { setBody(e.target.value); setSaved(false); }}
                    className="w-full bg-white dark:bg-zinc-900 text-on-surface dark:text-zinc-100 font-sans text-base p-8 outline-none resize-none leading-relaxed"
                    style={{ minHeight: '600px' }}
                    placeholder="Tulis artikel blog Anda di sini...&#10;&#10;Gunakan **bold**, _italic_, ## heading"
                  />

                  {/* Footer hints */}
                  <div className="px-4 py-2 border-t border-on-surface/5 dark:border-white/5 bg-surface-low/30 dark:bg-zinc-800/30 flex flex-wrap gap-3">
                    {['**bold**', '_italic_', '## Heading', '`kode`', '$rumus$', '$$blok$$', '- list'].map((hint) => (
                      <code key={hint} className="text-[10px] text-on-surface/40 font-mono">{hint}</code>
                    ))}
                  </div>
                </Card>

                {/* Thumbnail Upload */}
                <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
                  <Title level={5} className="!font-manrope !font-black !mb-4 flex items-center gap-2">
                    <PictureOutlined className="text-primary" /> Unggah Sampul (Thumbnail)
                  </Title>
                  <Upload.Dragger
                    accept="image/*"
                    className="rounded-2xl"
                    multiple={false}
                  >
                    <div className="py-6">
                      <PictureOutlined className="text-4xl text-primary/40 block mb-3" />
                      <Text className="font-bold block mb-1">Upload Gambar Sampulan</Text>
                      <Text className="text-xs text-on-surface/40">Saran: Rasio 16:9 • Maks. 5 MB</Text>
                    </div>
                  </Upload.Dragger>
                </Card>

                {/* PDF/Media Upload */}
                <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
                  <Title level={5} className="!font-manrope !font-black !mb-4 flex items-center gap-2">
                    <FilePdfOutlined className="text-red-500" /> Berkas Pendukung (Optional)
                  </Title>
                  <Upload.Dragger
                    accept=".pdf"
                    fileList={pdfFiles}
                    onChange={({ fileList }) => setPdfFiles(fileList)}
                    beforeUpload={() => false}
                    className="rounded-2xl"
                    multiple
                  >
                    <div className="py-6">
                      <FilePdfOutlined className="text-4xl text-red-400 block mb-3" />
                      <Text className="font-bold block mb-1">Seret &amp; lepas file PDF di sini</Text>
                      <Text className="text-xs text-on-surface/40">atau klik untuk memilih file • Maks. 20 MB per file</Text>
                    </div>
                  </Upload.Dragger>
                  {pdfFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {pdfFiles.map((f) => (
                        <div key={f.uid} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
                          <div className="flex items-center gap-3">
                            <FilePdfOutlined className="text-red-500 text-xl" />
                            <div>
                              <Text className="font-bold text-sm block">{f.name}</Text>
                              <Text className="text-xs text-on-surface/40">
                                {f.size ? `${(f.size / 1024).toFixed(1)} KB` : ''}
                              </Text>
                            </div>
                          </div>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => setPdfFiles(pdfFiles.filter(x => x.uid !== f.uid))}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </Col>

            {/* ── RIGHT: Preview ──── */}
            {previewMode && (
              <Col xs={24} lg={12}>
                <div className="sticky top-6">
                  <div className="flex items-center gap-2 mb-4">
                    <EyeOutlined className="text-primary" />
                    <Title level={5} className="!m-0 !font-manrope !font-black">Pratinjau Output</Title>
                    <Tag className="ml-auto rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 border-none font-bold text-[10px]">
                      /materi/:id
                    </Tag>
                  </div>

                  {/* Mimics MaterialDetail content area */}
                  <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-2xl shadow-primary/5 rounded-[2.5rem]">
                    <div className="p-6 sm:p-8">
                      <div className="flex items-center gap-3 text-primary mb-4">
                        <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-xl text-sm">
                          <CheckCircleOutlined />
                        </div>
                        <span className="text-xs uppercase tracking-widest font-bold">Kantan Blog</span>
                      </div>

                      <Title level={2} className="!font-black !font-manrope !mb-2">
                        {form.getFieldValue('title') || '(Judul belum diisi)'}
                      </Title>
                      <Text className="text-xs font-bold text-on-surface/30 uppercase tracking-widest block mb-6">
                        {form.getFieldValue('category') || 'Kategori'} · Ditulis oleh {form.getFieldValue('author') || 'Admin'} · {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                      <Divider className="border-on-surface/10 mb-6" />

                      <div
                        id="material-preview"
                        className="prose prose-lg dark:prose-invert max-w-none font-sans text-on-surface/80 dark:text-zinc-300 leading-loose"
                        dangerouslySetInnerHTML={{ __html: `<p class="mb-4 leading-loose">${renderContent(body)}</p>` }}
                      />

                      {pdfFiles.length > 0 && (
                        <>
                          <Divider className="mt-8 mb-4 border-on-surface/10" />
                          <Text className="text-xs uppercase font-black tracking-widest text-on-surface/40 block mb-3">
                            Berkas Lampiran
                          </Text>
                          <div className="space-y-2">
                            {pdfFiles.map((f) => (
                              <div key={f.uid} className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 cursor-pointer hover:shadow-md transition-all">
                                <FilePdfOutlined className="text-red-500 text-xl shrink-0" />
                                <Text className="font-bold text-sm">{f.name}</Text>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </div>
              </Col>
            )}
          </Row>
        </div>
      </div>

      {/* Math Modal */}
      <MathModal
        open={mathModalOpen}
        onInsert={insertMath}
        onClose={() => setMathModalOpen(false)}
      />
    </AdminLayout>
  );
};

export default AdminMaterialForm;
