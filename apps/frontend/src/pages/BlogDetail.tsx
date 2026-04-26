import React from 'react';
import AppLayout from '../layouts/AppLayout';
import { Typography, Breadcrumb, Avatar, Tag, Divider, Row, Col, Card, Space, Button } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, UserOutlined, ArrowLeftOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const BlogDetail: React.FC = () => {
   const { slug } = useParams<{ slug: string }>();

   // Mock content for the blog post
   const blogContent = {
      title: 'Strategi Jitu Lolos SNBT 2024: Fokus pada Materi yang Sering Keluar',
      date: '22 April 2026',
      author: 'Admin Kantan',
      category: 'Tips & Trik',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1434031211128-095490e7e7e9?auto=format&fit=crop&q=80&w=1200',
      content: `
      <p>Menjelang SNBT 2024, banyak siswa merasa kewalahan dengan banyaknya materi yang harus dipelajari. Namun, tahukah kamu bahwa tidak semua materi memiliki bobot yang sama dalam penilaian?</p>
      
      <h2>1. Fokus pada Literasi dan Penalaran Umum</h2>
      <p>Subtes penalaran umum sering kali menjadi penentu skor tinggi. Pelajari pola-pola logika, silogisme, dan analisis data grafik secara mendalam. Jangan hanya menghafal rumus, tapi pahami alur berpikirnya.</p>
      
      <blockquote>
        "Keberhasilan bukan tentang seberapa banyak yang kamu pelajari, tapi seberapa tepat apa yang kamu pelajari dengan apa yang diujikan."
      </blockquote>

      <h2>2. Gunakan Sistem IRT (Item Response Theory) untuk Keuntunganmu</h2>
      <p>Sistem IRT menghargai jawaban benar pada soal yang tingkat kesulitannya tinggi. Oleh karena itu, jangan abaikan soal sulit jika kamu punya waktu sisa. Pastikan juga ketepatan jawabanmu tinggi pada soal-soal kategori menengah.</p>

      <h2>3. Simulasi Mandiri Minimal Seminggu Sekali</h2>
      <p>Latihan soal satuan tidak cukup. Kamu butuh simulasi full dengan manajemen waktu yang ketat. Ini akan melatih mental dan ketahanan fokusmu selama berjam-jam saat ujian sesungguhnya.</p>

      <img src="https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800" alt="Study" style="border-radius: 2rem; margin: 2rem 0; width: 100%;" />

      <p>Kesimpulannya, SNBT adalah tentang strategi. Dengan pembagian waktu yang tepat antara belajar materi dan simulasi soal, peluangmu masuk kampus impian akan terbuka lebar. Semangat!</p>
    `
   };

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

               <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <Space size="large" className="mb-6 flex-wrap">
                     <Tag color="blue" className="rounded-full border-none px-4 font-bold uppercase tracking-widest text-[10px]">
                        {blogContent.category}
                     </Tag>
                     <Space className="text-on-surface/40 text-xs font-medium">
                        <CalendarOutlined /> {blogContent.date}
                     </Space>
                     <Space className="text-on-surface/40 text-xs font-medium">
                        <ClockCircleOutlined /> {blogContent.readTime}
                     </Space>
                  </Space>

                  <Title level={1} className="!text-4xl md:!text-5xl !font-black !font-manrope !leading-tight mb-10">
                     {blogContent.title}
                  </Title>

                  <div className="flex items-center justify-between mb-12 py-6 border-y border-on-surface/5">
                     <div className="flex items-center gap-4">
                        <Avatar size={56} icon={<UserOutlined />} className="bg-primary/10 text-primary border-none" />
                        <div>
                           <Text className="block font-black text-lg">{blogContent.author}</Text>
                           <Text className="text-xs text-on-surface/40 uppercase tracking-widest font-bold">Academic Writer</Text>
                        </div>
                     </div>
                     <Button shape="circle" icon={<ShareAltOutlined />} className="border-on-surface/10" />
                  </div>

                  <div className="rounded-[40px] overflow-hidden mb-16 shadow-2xl">
                     <img src={blogContent.image} className="w-full object-cover" alt="Banner" />
                  </div>

                  <div
                     className="blog-content text-lg leading-[1.8] text-on-surface/80"
                     dangerouslySetInnerHTML={{ __html: blogContent.content }}
                  />

                  <Divider className="my-20" />

                  {/* Author Bio Card */}
                  <Card className="rounded-[2.5rem] bg-surface-low/30 border-none p-4 md:p-8">
                     <Row gutter={[24, 24]} align="middle">
                        <Col xs={24} md={4} className="text-center">
                           <Avatar size={80} icon={<UserOutlined />} className="bg-primary/10 text-primary" />
                        </Col>
                        <Col xs={24} md={20}>
                           <Title level={4} className="!m-0 !font-manrope">Tentang {blogContent.author}</Title>
                           <Paragraph className="mt-2 text-on-surface/60 italic">
                              Berkomitmen untuk mencerdaskan kehidupan bangsa melalui konten edukasi yang berkualitas dan mudah dipahami oleh seluruh pejuang PTN di Indonesia.
                           </Paragraph>
                        </Col>
                     </Row>
                  </Card>
               </div>
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
