import React, { useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import { Typography, Row, Col, Card, Tag, Input, Badge, Button, Pagination, Space } from 'antd';
import { SearchOutlined, ClockCircleOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface BlogPost {
   id: string;
   slug: string;
   title: string;
   excerpt: string;
   author: string;
   date: string;
   category: string;
   image: string;
   readTime: string;
}

const mockPosts: BlogPost[] = [
   {
      id: '1',
      slug: 'strategi-lolos-snbt-2024',
      title: 'Strategi Jitu Lolos SNBT 2024: Fokus pada Materi yang Sering Keluar',
      excerpt: 'Menjelang SNBT 2024, banyak siswa merasa kewalahan. Berikut adalah roadmap belajar efektif yang fokus pada subtes dengan bobot terbesar...',
      author: 'Admin Kantan',
      date: '22 Apr 2026',
      category: 'Tips & Trik',
      image: 'https://images.unsplash.com/photo-1434031211128-095490e7e7e9?auto=format&fit=crop&q=80&w=800',
      readTime: '5 min read'
   },
   {
      id: '2',
      slug: 'analisis-soal-irt-utbk',
      title: 'Mengenal Sistem Penilaian IRT (Item Response Theory) di UTBK',
      excerpt: 'Sering dengar istilah IRT tapi bingung cara kerjanya? Kita kupas tuntas bagaimana nilai akhir kamu dihitung berdasarkan tingkat kesulitan soal...',
      author: 'Tim Akademik',
      date: '20 Apr 2026',
      category: 'Edukasi',
      image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&q=80&w=800',
      readTime: '8 min read'
   },
   {
      id: '3',
      slug: 'manajemen-waktu-belajar',
      title: '5 Teknik Manajemen Waktu Favorit Siswa Ambis untuk Belajar Mandiri',
      excerpt: 'Teknik Pomodoro saja tidak cukup? Cobalah metode Time Blocking dan Eat The Frog untuk meningkatkan produktivitas belajar harianmu...',
      author: 'Sasa Ambiga',
      date: '18 Apr 2026',
      category: 'Self Improvement',
      image: 'https://images.unsplash.com/photo-1454165833767-027ffea7e78b?auto=format&fit=crop&q=80&w=800',
      readTime: '4 min read'
   }
];

const BlogPage: React.FC = () => {
   const [search, setSearch] = useState('');

   return (
      <AppLayout>
         <div className="bg-surface-low/30 pt-32 pb-24 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

               {/* Header Section */}
               <div className="max-w-3xl mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <Text className="text-[10px] uppercase font-black tracking-[0.3em] text-primary block mb-4">Kantan Insight</Text>
                  <Title level={1} className="!text-5xl md:!text-6xl !font-manrope !font-black !m-0 !leading-[1.1]">
                     Berita & Insight <br /> Edukasi Terbaru
                  </Title>
                  <Paragraph className="text-xl text-on-surface/50 mt-6 leading-relaxed">
                     Temukan tips belajar, analisis soal, dan berita terbaru seputar dunia perguruan tinggi untuk menemanimu meraih mimpi.
                  </Paragraph>

                  <div className="mt-10 flex gap-4">
                     <Input
                        prefix={<SearchOutlined className="text-on-surface/30" />}
                        placeholder="Cari artikel..."
                        className="h-14 rounded-2xl border-none shadow-xl shadow-primary/5 px-6 text-lg"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                     />
                  </div>
               </div>

               {/* Featured Post (Visual Mockup) */}
               <Row gutter={[48, 48]}>
                  <Col xs={24}>
                     <Link to={`/blog/${mockPosts[0].slug}`}>
                        <Card
                           className="border-none group overflow-hidden rounded-[40px] shadow-2xl shadow-primary/5 bg-white p-0"
                           bodyStyle={{ padding: 0 }}
                        >
                           <Row gutter={0}>
                              <Col xs={24} lg={14}>
                                 <div className="aspect-video lg:aspect-auto lg:h-[500px] overflow-hidden">
                                    <img
                                       src={mockPosts[0].image}
                                       className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                       alt="Featured"
                                    />
                                 </div>
                              </Col>
                              <Col xs={24} lg={10}>
                                 <div className="p-8 md:p-12 h-full flex flex-col justify-center">
                                    <Space size="middle" className="mb-6">
                                       <Tag color="blue" className="rounded-full border-none px-4 font-bold uppercase tracking-widest text-[9px]">
                                          Featured Article
                                       </Tag>
                                       <Text className="text-xs text-on-surface/40">{mockPosts[0].readTime}</Text>
                                    </Space>
                                    <Title level={2} className="!font-manrope !font-black !mb-6 leading-tight group-hover:text-primary transition-colors">
                                       {mockPosts[0].title}
                                    </Title>
                                    <Paragraph className="text-on-surface/60 text-lg mb-8 line-clamp-3">
                                       {mockPosts[0].excerpt}
                                    </Paragraph>
                                    <div className="flex items-center justify-between mt-auto">
                                       <div className="flex items-center gap-3">
                                          <Badge dot status="processing">
                                             <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                                                {mockPosts[0].author[0]}
                                             </div>
                                          </Badge>
                                          <div>
                                             <Text className="block font-bold">{mockPosts[0].author}</Text>
                                             <Text className="text-xs text-on-surface/40">{mockPosts[0].date}</Text>
                                          </div>
                                       </div>
                                       <div className="w-12 h-12 rounded-full border border-on-surface/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                                          <ArrowRightOutlined className="text-on-surface/40 group-hover:text-white" />
                                       </div>
                                    </div>
                                 </div>
                              </Col>
                           </Row>
                        </Card>
                     </Link>
                  </Col>

                  {/* Other Posts */}
                  {mockPosts.slice(1).map((post) => (
                     <Col xs={24} md={12} key={post.id}>
                        <Link to={`/blog/${post.slug}`}>
                           <Card
                              className="border-none weightless-card rounded-[32px] overflow-hidden group h-full flex flex-col"
                              cover={
                                 <div className="aspect-[16/10] overflow-hidden">
                                    <img
                                       src={post.image}
                                       className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                       alt="Post"
                                    />
                                 </div>
                              }
                           >
                              <div className="flex flex-col h-full">
                                 <Space className="mb-4">
                                    <Tag className="rounded-full bg-primary/10 text-primary border-none font-bold text-[9px] px-3 uppercase tracking-tighter">
                                       {post.category}
                                    </Tag>
                                    <Text className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest">{post.date}</Text>
                                 </Space>
                                 <Title level={4} className="!font-manrope !font-black !mb-4 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                    {post.title}
                                 </Title>
                                 <Paragraph className="text-on-surface/60 line-clamp-2 mb-6">
                                    {post.excerpt}
                                 </Paragraph>
                                 <div className="mt-auto pt-6 border-t border-on-surface/5 flex items-center gap-3">
                                    <UserOutlined className="text-primary" />
                                    <Text className="font-bold text-xs">{post.author}</Text>
                                    <ClockCircleOutlined className="ml-auto text-on-surface/30" />
                                    <Text className="text-xs text-on-surface/30">{post.readTime}</Text>
                                 </div>
                              </div>
                           </Card>
                        </Link>
                     </Col>
                  ))}
               </Row>

               <div className="mt-20 flex justify-center">
                  <Pagination total={50} pageSize={9} showSizeChanger={false} className="weightless-pagination" />
               </div>
            </div>
         </div>
      </AppLayout>
   );
};

export default BlogPage;
