import React from 'react';
import AppLayout from '../layouts/AppLayout';
import { Typography, Breadcrumb, Avatar, Tag, Divider, Row, Col, Card, Space, Button, Spin } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, UserOutlined, ArrowLeftOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';

import { getArtikelBySlug, Artikel } from '../services/artikelService';

const { Title, Text, Paragraph } = Typography;

const backendUrl = process.env.REACT_APP_LINK_BACKEND?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:3026';

declare global { interface Window { katex?: any; renderMathInElement?: any; } }

const renderKaTeX = (latex: string, displayMode = false): string => {
  if (window.katex) {
    try {
      return window.katex.renderToString(latex, { displayMode, throwOnError: false });
    } catch { return latex; }
  }
  return `<span class="font-mono bg-blue-50 text-blue-700 px-1 rounded text-sm">${displayMode ? '$$' : '$'}${latex}${displayMode ? '$$' : '$'}</span>`;
};

const renderContent = (raw: string): string => {
  if (!raw) return '';
  return raw
    .replace(/\$\$([^$]+)\$\$/g, (_, latex) => `<div class="my-6 py-4 flex justify-center overflow-x-auto">${renderKaTeX(latex, true)}</div>`)
    .replace(/\$([^$\n]+)\$/g, (_, latex) => renderKaTeX(latex, false))
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-on-surface dark:text-zinc-100">$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-black font-manrope mt-8 mb-3 text-on-surface dark:text-zinc-100">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-black font-manrope mt-10 mb-4 text-on-surface dark:text-zinc-100">$2</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-black font-manrope mt-12 mb-5 text-on-surface dark:text-zinc-100">$3</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 list-disc leading-relaxed">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-6 mb-2 list-decimal leading-relaxed">$2</li>')
    .replace(/`(.+?)`/g, '<code class="bg-surface-low dark:bg-zinc-800 px-2 py-0.5 rounded-md text-sm font-mono text-primary">$1</code>')
    .replace(/\n{2,}/g, '</p><p class="mb-5 leading-loose">');
};

const BlogDetail: React.FC = () => {
   const { slug } = useParams<{ slug: string }>();
   const [post, setPost] = React.useState<Artikel | null>(null);
   const [loading, setLoading] = React.useState(true);

   React.useEffect(() => {
      const fetchData = async () => {
         if (!slug) return;
         setLoading(true);
         try {
            const res = await getArtikelBySlug(slug);
            setPost(res);
         } catch {
            // handle error
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, [slug]);

   // Trigger KaTeX re-render on content change
   React.useEffect(() => {
      if (window.renderMathInElement && post) {
         const el = document.getElementById('blog-detail-content');
         if (el) {
            window.renderMathInElement(el, {
               delimiters: [
                  { left: '$$', right: '$$', display: true },
                  { left: '$', right: '$', display: false },
               ],
               throwOnError: false,
            });
         }
      }
   }, [post]);

   const formatDate = (dateStr: string) => {
      try {
         return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch { return dateStr; }
   };

   const thumbnailUrl = (path: string) => path ? `${backendUrl}${path}` : 'https://images.unsplash.com/photo-1434031211128-095490e7e7e9?auto=format&fit=crop&q=80&w=1200';

   return (
      <AppLayout>
         <div className="bg-white dark:bg-zinc-950 pt-32 pb-24 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

               <Breadcrumb className="mb-8">
                  <Breadcrumb.Item><Link to="/">Beranda</Link></Breadcrumb.Item>
                  <Breadcrumb.Item><Link to="/blog">Blog</Link></Breadcrumb.Item>
                  <Breadcrumb.Item>Artikel</Breadcrumb.Item>
               </Breadcrumb>

               <Link to="/blog" className="flex items-center gap-2 text-primary font-bold mb-8 hover:gap-3 transition-all">
                  <ArrowLeftOutlined /> Kembali ke Blog
               </Link>

               {loading ? (
                  <div className="flex items-center justify-center h-64"><Spin size="large" /></div>
               ) : post ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                     <Space size="large" className="mb-6 flex-wrap">
                        <Tag color="blue" className="rounded-full border-none px-4 font-bold uppercase tracking-widest text-[10px]">
                           {post.category?.title || 'Umum'}
                        </Tag>
                        <Space className="text-on-surface/40 text-xs font-medium">
                           <CalendarOutlined /> {formatDate(post.created_at)}
                        </Space>
                        <Space className="text-on-surface/40 text-xs font-medium">
                           <ClockCircleOutlined /> 5 min read
                        </Space>
                     </Space>

                     <Title level={1} className="!text-4xl md:!text-5xl !font-black !font-manrope !leading-tight mb-10">
                        {post.judul}
                     </Title>

                     <div className="flex items-center justify-between mb-12 py-6 border-y border-on-surface/5">
                        <div className="flex items-center gap-4">
                           <Avatar size={56} icon={<UserOutlined />} className="bg-primary/10 text-primary border-none">
                              {(post.user?.name || 'A')[0]}
                           </Avatar>
                           <div>
                              <Text className="block font-black text-lg">{post.user?.name || 'Admin'}</Text>
                              <Text className="text-xs text-on-surface/40 uppercase tracking-widest font-bold">Academic Writer</Text>
                           </div>
                        </div>
                        <Button shape="circle" icon={<ShareAltOutlined />} className="border-on-surface/10" />
                     </div>

                     <div className="rounded-[40px] overflow-hidden mb-16 shadow-2xl relative">
                        <img src={thumbnailUrl(post.thumbnail)} className="w-full object-cover aspect-video md:aspect-[21/9]" alt="Banner" />
                     </div>

                     <div
                        id="blog-detail-content"
                        className="blog-content text-lg leading-[1.8] text-on-surface/80 dark:text-zinc-300"
                        dangerouslySetInnerHTML={{ __html: `<p class="mb-5 leading-loose">${renderContent(post.konten)}</p>` }}
                     />

                     <Divider className="my-20" />

                     {/* Author Bio Card */}
                     <Card className="rounded-[2.5rem] bg-surface-low/30 border-none p-4 md:p-8">
                        <Row gutter={[24, 24]} align="middle">
                           <Col xs={24} md={4} className="text-center">
                              <Avatar size={80} icon={<UserOutlined />} className="bg-primary/10 text-primary">
                                 {(post.user?.name || 'A')[0]}
                              </Avatar>
                           </Col>
                           <Col xs={24} md={20}>
                              <Title level={4} className="!m-0 !font-manrope">Tentang {post.user?.name || 'Admin'}</Title>
                              <Paragraph className="mt-2 text-on-surface/60 italic">
                                 Berkomitmen untuk mencerdaskan kehidupan bangsa melalui konten edukasi yang berkualitas dan mudah dipahami oleh seluruh pejuang PTN di Indonesia.
                              </Paragraph>
                           </Col>
                        </Row>
                     </Card>
                  </div>
               ) : (
                  <div className="text-center py-20">
                     <Title level={3}>Artikel tidak ditemukan</Title>
                     <Link to="/blog">Kembali ke Blog</Link>
                  </div>
               )}
            </div>
         </div>

         <style>{`
        .blog-content h2 {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          color: #000;
        }
        .blog-content blockquote {
          margin: 3rem 0;
          padding: 2rem;
          background: #f0f7ff;
          border-radius: 2rem;
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.4;
          color: #0060ad;
          font-style: italic;
          border-left: 8px solid #0060ad;
        }
        .dark .blog-content h2 { color: #fff; }
        .dark .blog-content blockquote { background: #1a202c; color: #3b82f6; border-left-color: #3b82f6; }
      `}</style>
      </AppLayout>
   );
};

export default BlogDetail;
