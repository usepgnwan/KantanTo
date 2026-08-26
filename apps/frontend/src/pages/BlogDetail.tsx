import React from 'react';
import AppLayout from '../layouts/AppLayout';
import { Typography, Breadcrumb, Avatar, Tag, Divider, Row, Col, Card, Space, Button, Spin } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, UserOutlined, ArrowLeftOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';

import { getArtikelBySlug, Artikel } from '../services/artikelService';
import { renderContent } from '../utils/renderContent';

const { Title, Text, Paragraph } = Typography;

const backendUrl = process.env.REACT_APP_LINK_BACKEND?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:3026';

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

   const formatDate = (dateStr: string) => {
      try {
         return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch { return dateStr; }
   };

   const thumbnailUrl = (path: string) => path ? `${backendUrl}${path}` : '/logo-rifaya.png';

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

                     <Title level={1} className="!text-3xl md:!text-5xl !font-black !font-manrope !leading-tight mb-10">
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

                     {post.thumbnail && (
                        <div className="rounded-[40px] overflow-hidden mb-16 shadow-2xl relative">
                           <img src={thumbnailUrl(post.thumbnail)} className="w-full object-cover aspect-video md:aspect-[21/9]" alt="Banner" />
                        </div>
                     )}

                     <div
                        id="blog-detail-content"
                        className="blog-content prose prose-lg dark:prose-invert max-w-none font-sans text-lg leading-[1.8] text-on-surface/80 dark:text-zinc-300 kantan-quill kantan-quill-preview"
                        dangerouslySetInnerHTML={{ __html: renderContent(post.konten) }}
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
        .blog-content h1 {
          font-family: 'Manrope', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          color: #0f172a;
          line-height: 1.3;
        }
        .blog-content h2 {
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 1.5rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #0f172a;
          line-height: 1.35;
        }
        .blog-content h3 {
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
          font-size: 1.25rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #0f172a;
        }
        .blog-content p {
          margin-bottom: 1.25rem;
          line-height: 1.8;
        }
        .blog-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .blog-content ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .blog-content li {
          margin-bottom: 0.5rem;
          line-height: 1.7;
        }
        .blog-content blockquote {
          margin: 2rem 0;
          padding: 1.5rem 2rem;
          background: #f0f7ff;
          border-radius: 1.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.5;
          color: #0060ad;
          font-style: italic;
          border-left: 6px solid #0060ad;
        }
        .blog-content .katex-display {
          margin: 1.5rem 0 !important;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0.5rem 0;
        }
        .blog-content .katex {
          font-size: 1.1em;
        }
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          border-radius: 0.75rem;
          overflow: hidden;
        }
        .blog-content th, .blog-content td {
          border: 1px solid #e2e8f0;
          padding: 0.75rem 1rem;
          text-align: left;
        }
        .blog-content th {
          background: #f8fafc;
          font-weight: bold;
        }
        .dark .blog-content h1,
        .dark .blog-content h2,
        .dark .blog-content h3 { color: #f8fafc; }
        .dark .blog-content blockquote { background: #1a202c; color: #68abff; border-left-color: #68abff; }
        .dark .blog-content th, .dark .blog-content td { border-color: #27272a; }
        .dark .blog-content th { background: #27272a; }
      `}</style>
      </AppLayout>
   );
};

export default BlogDetail;
