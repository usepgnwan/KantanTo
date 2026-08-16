import React, { useState, useRef, useCallback, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Row, Col, Card, Form, Input, Button, Upload, Typography,
  Space, Tag, Divider, Modal, message, Switch, Tooltip,
  Select, Badge, Avatar, Spin,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  BoldOutlined, ItalicOutlined, UnderlineOutlined, OrderedListOutlined,
  UnorderedListOutlined, LinkOutlined, PictureOutlined, FilePdfOutlined,
  SaveOutlined, EyeOutlined, FunctionOutlined, DeleteOutlined,
  FullscreenOutlined, CodeOutlined, AlignLeftOutlined, AlignCenterOutlined,
  FileTextOutlined, UploadOutlined, CheckCircleOutlined,
  PlusOutlined, EditOutlined, ArrowLeftOutlined, StarFilled,
} from '@ant-design/icons';
import { getArtikel, createArtikel, updateArtikel, deleteArtikel, Artikel } from '../../services/artikelService';
import { getCategories } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import KantanEditor from '../../components/atoms/KantanEditor';
import AIAssistant from '../../components/organisms/AIAssistant';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const { Title, Text, Paragraph } = Typography;
const backendUrl = process.env.REACT_APP_LINK_BACKEND?.replace('/api', '') || 'http://127.0.0.1:3026';

const renderPreviewContent = (html: string) => {
  if (!html) return html;
  
  let processedHtml = html;

  // 1. Convert Quill formula spans
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
      return `<div class="my-4 flex justify-center overflow-x-auto">${katex.renderToString(decodedLatex, { throwOnError: false, displayMode: true })}</div>`;
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

// ─── Main Component ───────────────────────────────────────────
const AdminMaterialForm: React.FC = () => {
  const { payload } = useAuth();
  const [posts, setPosts] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categories, setCategories] = useState<{ value: number; label: string }[]>([]);

  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingPost, setEditingPost] = useState<Artikel | null>(null);
  const [form] = Form.useForm();
  const [body, setBody] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [saved, setSaved] = useState(false);

  // File states
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [berkasFile, setBerkasFile] = useState<File | null>(null);
  const [berkasName, setBerkasName] = useState<string>('');

  // ─── Fetch data ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getArtikel(currentPage, 9, searchQuery, statusFilter);
      setPosts(res.list?.rows || []);
      setTotal(res.list?.total || 0);
    } catch {
      message.error('Gagal mengambil data artikel');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 400);
    return () => clearTimeout(t);
  }, [fetchData]);

  // Fetch categories for dropdown
  useEffect(() => {
    getCategories(1, 100).then((res) => {
      setCategories(res.rows.map((c) => ({ value: c.id, label: c.title })));
    }).catch(() => {});
  }, []);

  // ─── Handlers ──────────────────────────────────────────────
  const handleCreate = () => {
    setEditingPost(null);
    setBody('');
    setThumbnailFile(null);
    setThumbnailPreview('');
    setBerkasFile(null);
    setBerkasName('');
    setSaved(false);
    form.resetFields();
    setView('editor');
  };

  const handleEdit = (post: Artikel) => {
    setEditingPost(post);
    setBody(post.konten);
    setThumbnailPreview(post.thumbnail ? `${backendUrl}${post.thumbnail}` : '');
    setBerkasName(post.berkas ? post.berkas.split('/').pop() || '' : '');
    setBerkasFile(null);
    setThumbnailFile(null);
    setSaved(false);
    form.setFieldsValue({
      judul: post.judul,
      deskripsi: post.deskripsi,
      status: post.status,
      is_priority: post.is_priority,
      category_id: post.category_id,
    });
    setView('editor');
  };

  const handleDelete = (id: number, judul: string) => {
    Modal.confirm({
      title: 'Hapus Artikel?',
      content: `Artikel "${judul}" akan dihapus permanen.`,
      okText: 'Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await deleteArtikel(id);
          message.success('Artikel dihapus');
          fetchData();
        } catch {
          message.error('Gagal menghapus artikel');
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      setSaving(true);

      const fd = new FormData();
      fd.append('judul', vals.judul);
      fd.append('konten', body);
      fd.append('deskripsi', vals.deskripsi || '');
      fd.append('status', vals.status);
      fd.append('is_priority', vals.is_priority ? 'true' : 'false');
      if (vals.category_id) fd.append('category_id', String(vals.category_id));
      if (payload?.user_id) fd.append('user_id', String(payload.user_id));
      if (thumbnailFile) fd.append('thumbnail', thumbnailFile);
      if (berkasFile) fd.append('berkas', berkasFile);

      if (editingPost) {
        await updateArtikel(editingPost.id, fd);
        message.success(`Artikel "${vals.judul}" berhasil diperbarui!`);
      } else {
        await createArtikel(fd);
        message.success(`Artikel "${vals.judul}" berhasil disimpan!`);
      }

      setSaved(true);
      fetchData();
      setTimeout(() => setView('list'), 800);
    } catch (err: any) {
      if (err?.errorFields) {
        message.error('Harap lengkapi semua field wajib.');
      } else {
        const msg = err?.response?.data?.message || 'Gagal menyimpan artikel';
        message.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Editor helpers ────────────────────────────────────────
  // No longer needed, KantanEditor handles it.

  // ─── LIST VIEW ─────────────────────────────────────────────
  if (view === 'list') {
    return (
      <AdminLayout>
        <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <div>
                <Title level={1} className="!text-3xl !font-manrope !font-black !m-0">Manajemen Blog</Title>
                <Text className="text-on-surface/50">Kelola artikel, berita, dan tips untuk siswa</Text>
              </div>
              <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleCreate}
                className="rounded-2xl h-12 px-8 font-black shadow-xl shadow-primary/20">
                Tulis Artikel Baru
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Input.Search placeholder="Cari judul artikel..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} onSearch={() => fetchData()}
                className="rounded-xl flex-1 max-w-sm" allowClear />
              <Select value={statusFilter} onChange={setStatusFilter}
                className="w-40" placeholder="Semua Status"
                options={[{ value: '', label: 'Semua Status' }, { value: 'publish', label: 'Publish' }, { value: 'draft', label: 'Draft' }]} />
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64"><Spin size="large" /></div>
            ) : (
              <Row gutter={[24, 24]}>
                {posts.map((post) => (
                  <Col xs={24} sm={12} lg={8} key={post.id}>
                    <Card hoverable className="rounded-3xl border-none shadow-sm overflow-hidden bg-white dark:bg-zinc-900 group h-full"
                      cover={post.thumbnail && (
                        <div className="h-44 overflow-hidden relative">
                          <img src={`${backendUrl}${post.thumbnail}`} alt={post.judul}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          {post.is_priority && (
                            <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                              <StarFilled className="text-[8px]" /> Headline
                            </div>
                          )}
                        </div>
                      )}
                      actions={[
                        <Tooltip title="Edit"><EditOutlined key="edit" onClick={() => handleEdit(post)} /></Tooltip>,
                        <Tooltip title="Hapus"><DeleteOutlined key="delete" className="text-red-400" onClick={() => handleDelete(post.id, post.judul)} /></Tooltip>,
                      ]}>
                      <div className="p-1">
                        <div className="flex justify-between items-start mb-2">
                          <Tag className="rounded-lg border-none bg-primary/10 text-primary font-black text-[9px] uppercase">
                            {post.category?.title || 'Umum'}
                          </Tag>
                          <Badge status={post.status === 'publish' ? 'success' : 'default'}
                            text={<span className="text-[10px] font-bold uppercase text-on-surface/40">{post.status === 'publish' ? 'Live' : 'Draft'}</span>} />
                        </div>
                        <Title level={4} className="!font-manrope !font-black !m-0 mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {post.judul}
                        </Title>
                        {post.deskripsi && (
                          <Text className="text-xs text-on-surface/50 line-clamp-2 block mb-3">{post.deskripsi}</Text>
                        )}
                        <div className="flex items-center gap-3 pt-3 border-t border-on-surface/5">
                          <Avatar size="small" className="bg-primary/20 text-primary font-bold shrink-0">
                            {post.user?.name?.[0] || 'A'}
                          </Avatar>
                          <div>
                            <Text className="text-[10px] font-black block leading-none">{post.user?.name || 'Admin'}</Text>
                            <Text className="text-[9px] text-on-surface/30 font-bold">
                              {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
                {posts.length === 0 && !loading && (
                  <Col span={24}>
                    <div className="text-center py-20 text-on-surface/30">
                      <FileTextOutlined className="text-5xl block mb-4" />
                      <Text className="font-bold text-lg block">Belum ada artikel</Text>
                      <Text className="text-sm">Klik "Tulis Artikel Baru" untuk memulai</Text>
                    </div>
                  </Col>
                )}
              </Row>
            )}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ─── EDITOR VIEW ───────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full font-sans transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button icon={<ArrowLeftOutlined />} onClick={() => setView('list')}
                className="rounded-xl border-none bg-white dark:bg-zinc-800 shadow-sm h-11 w-11 flex items-center justify-center p-0" />
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
              <Button type="primary" icon={saved ? <CheckCircleOutlined /> : <SaveOutlined />}
                onClick={handleSave} loading={saving} size="large"
                className={`h-11 rounded-2xl font-bold shadow-lg ${saved ? 'shadow-green-500/20' : 'shadow-primary/20'}`}>
                {saved ? 'Tersimpan!' : editingPost ? 'Simpan Perubahan' : 'Simpan & Publikasi'}
              </Button>
            </Space>
          </div>

          <Row gutter={[24, 24]}>
            {/* ── LEFT: Editor ── */}
            <Col xs={24} lg={previewMode ? 12 : 24}>
              <div className="space-y-6">
                {/* Meta form */}
                <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
                  <Title level={5} className="!font-manrope !font-black !mb-5 flex items-center gap-2">
                    <FileTextOutlined className="text-primary" /> Detail Artikel
                  </Title>
                  <Form form={form} layout="vertical" requiredMark={false}
                    initialValues={{ status: 'draft', is_priority: false }}>
                    <Row gutter={[16, 0]}>
                      <Col xs={24} sm={16}>
                        <Form.Item name="judul" label={<span className="font-bold text-sm">Judul Artikel</span>}
                          rules={[{ required: true, message: 'Judul wajib diisi' }]}>
                          <Input placeholder={`Cth: Tips Lolos UTBK-SNBT ${new Date().getFullYear()}`} className="rounded-xl h-12 text-base font-bold" size="large" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item name="category_id" label={<span className="font-bold text-sm">Kategori</span>}>
                          <Select className="w-full rounded-xl" style={{ height: 48 }} placeholder="Pilih kategori" options={categories} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item name="status" label={<span className="font-bold text-sm">Status Publikasi</span>}
                          rules={[{ required: true }]}>
                          <Select className="w-full rounded-xl" style={{ height: 48 }}
                            options={[{ value: 'publish', label: 'Publish' }, { value: 'draft', label: 'Draft' }]} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Form.Item name="is_priority" label={<span className="font-bold text-sm">⭐ Jadikan Headline</span>} valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item name="deskripsi" label={<span className="font-bold text-sm">Deskripsi Singkat (Excerpt)</span>}>
                          <Input.TextArea rows={2} placeholder="Ringkasan singkat yang muncul di daftar artikel..." className="rounded-xl" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </Card>

                {/* Rich Editor */}
                <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md p-4 overflow-hidden">
                  <KantanEditor
                    value={body}
                    onChange={(val) => { setBody(val); setSaved(false); }}
                    placeholder="Tulis artikel blog Anda di sini..."
                    rows={12}
                  />
                </Card>

                {/* Thumbnail Upload */}
                <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
                  <Title level={5} className="!font-manrope !font-black !mb-4 flex items-center gap-2">
                    <PictureOutlined className="text-primary" /> Thumbnail Sampul
                  </Title>
                  {thumbnailPreview && (
                    <div className="mb-4 relative rounded-2xl overflow-hidden">
                      <img src={thumbnailPreview} alt="preview" className="w-full max-h-52 object-cover" />
                      <button
                        onClick={() => { setThumbnailPreview(''); setThumbnailFile(null); }}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-500 transition-all">
                        <DeleteOutlined className="text-xs" />
                      </button>
                    </div>
                  )}
                  <Upload.Dragger accept="image/jpeg,image/png" multiple={false}
                    showUploadList={false} beforeUpload={(file) => {
                      setThumbnailFile(file);
                      setThumbnailPreview(URL.createObjectURL(file));
                      return false;
                    }} className="rounded-2xl">
                    <div className="py-6">
                      <PictureOutlined className="text-4xl text-primary/40 block mb-3" />
                      <Text className="font-bold block mb-1">{thumbnailPreview ? 'Ganti Thumbnail' : 'Upload Gambar Sampul'}</Text>
                      <Text className="text-xs text-on-surface/40">JPG / PNG • Dikompres otomatis • Maks. 10 MB</Text>
                    </div>
                  </Upload.Dragger>
                </Card>

                {/* Berkas Upload */}
                <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md">
                  <Title level={5} className="!font-manrope !font-black !mb-4 flex items-center gap-2">
                    <FilePdfOutlined className="text-red-500" /> Berkas Pendukung (Opsional)
                  </Title>
                  {berkasName && (
                    <div className="mb-4 flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
                      <div className="flex items-center gap-3">
                        <FilePdfOutlined className="text-red-500 text-xl" />
                        <Text className="font-bold text-sm">{berkasName}</Text>
                      </div>
                      <Button type="text" danger icon={<DeleteOutlined />} size="small"
                        onClick={() => { setBerkasFile(null); setBerkasName(''); }} />
                    </div>
                  )}
                  <Upload.Dragger accept=".pdf,.doc,.docx,.xls,.xlsx" multiple={false}
                    showUploadList={false} beforeUpload={(file) => {
                      setBerkasFile(file);
                      setBerkasName(file.name);
                      return false;
                    }} className="rounded-2xl">
                    <div className="py-6">
                      <FilePdfOutlined className="text-4xl text-red-400 block mb-3" />
                      <Text className="font-bold block mb-1">Seret & lepas berkas di sini</Text>
                      <Text className="text-xs text-on-surface/40">PDF • DOC • DOCX • XLS • XLSX • Maks. 20 MB</Text>
                    </div>
                  </Upload.Dragger>
                </Card>
              </div>
            </Col>

            {/* ── RIGHT: Preview ── */}
            {previewMode && (
              <Col xs={24} lg={12}>
                <div className="sticky top-6">
                  <div className="flex items-center gap-2 mb-4">
                    <EyeOutlined className="text-primary" />
                    <Title level={5} className="!m-0 !font-manrope !font-black">Pratinjau Output</Title>
                  </div>
                  <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-2xl shadow-primary/5 rounded-[2.5rem]">
                    <div className="p-6 sm:p-8">
                      {thumbnailPreview && (
                        <div className="mb-6 rounded-2xl overflow-hidden -mx-6 sm:-mx-8 -mt-6 sm:-mt-8">
                          <img src={thumbnailPreview} alt="thumbnail" className="w-full h-48 object-cover" />
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-primary mb-4">
                        <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-xl text-sm"><CheckCircleOutlined /></div>
                        <span className="text-xs uppercase tracking-widest font-bold">Kantan Blog</span>
                      </div>
                      <Title level={2} className="!font-black !font-manrope !mb-2">
                        {form.getFieldValue('judul') || '(Judul belum diisi)'}
                      </Title>
                      <Text className="text-xs font-bold text-on-surface/30 uppercase tracking-widest block mb-6">
                        {categories.find(c => c.value === form.getFieldValue('category_id'))?.label || 'Kategori'} ·{' '}
                        {payload?.nama || 'Admin'} · {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                      <Divider className="border-on-surface/10 mb-6" />
                      <div id="material-preview"
                        className="prose prose-lg dark:prose-invert max-w-none font-sans text-on-surface/80 dark:text-zinc-300 leading-loose kantan-quill kantan-quill-preview"
                        dangerouslySetInnerHTML={{ __html: renderPreviewContent(body) }} />
                    </div>
                  </Card>
                </div>
              </Col>
            )}
          </Row>
        </div>
      </div>
      
      {/* AI Assistant Floating Button */}
      {view === 'editor' && (
        <AIAssistant onApply={(content) => {
          setBody(content);
          setSaved(false);
        }} />
      )}
    </AdminLayout>
  );
};

export default AdminMaterialForm;
