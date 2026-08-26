import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../layouts/AppLayout';
import { Typography, Row, Col, Card, Tag, Input, Badge, Button, Pagination, Space, Spin } from 'antd';
import { SearchOutlined, ClockCircleOutlined, UserOutlined, ArrowRightOutlined, StarFilled } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { getArtikel, Artikel } from '../services/artikelService';

const { Title, Text, Paragraph } = Typography;

const backendUrl = process.env.REACT_APP_LINK_BACKEND?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:3026';

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<Artikel[]>([]);
  const [headline, setHeadline] = useState<Artikel | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getArtikel(currentPage, 9, search, 'publish');
      setHeadline(res.headline);
      setPosts(res.list?.rows || []);
      setTotal(res.list?.total || 0);
    } catch {
      // fail silently for public page
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 400);
    return () => clearTimeout(t);
  }, [fetchData]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  };

  const thumbnailUrl = (path: string) => path ? `${backendUrl}${path}` : '/logo-rifaya.png';

  // Non-headline posts (exclude headline from list on first page to avoid duplicate)
  const otherPosts = (currentPage === 1 && headline)
    ? posts.filter(p => p.id !== headline.id)
    : posts;

  return (
    <AppLayout>
      <div className="bg-surface-low/30 pt-32 pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="max-w-3xl mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Text className="text-[10px] uppercase font-black tracking-[0.3em] text-primary block mb-4">Kantan Insight</Text>
            <Title level={1} className="!text-5xl md:!text-6xl !font-manrope !font-black !m-0 !leading-[1.1]">
              Berita &amp; Insight <br /> Edukasi Terbaru
            </Title>
            <Paragraph className="text-xl text-on-surface/50 mt-6 leading-relaxed">
              Temukan tips belajar, analisis soal, dan berita terbaru seputar dunia perguruan tinggi.
            </Paragraph>
            <div className="mt-10">
              <Input
                prefix={<SearchOutlined className="text-on-surface/30" />}
                placeholder="Cari artikel..."
                className="h-14 rounded-2xl border-none shadow-xl shadow-primary/5 px-6 text-lg max-w-lg"
                value={search}
                onChange={e => setSearch(e.target.value)}
                allowClear
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64"><Spin size="large" /></div>
          ) : (
            <Row gutter={[48, 48]}>
              {/* Featured / Headline - Only show on Page 1 */}
              {currentPage === 1 && headline && (
                <Col xs={24}>
                  <Link to={`/blog/${headline.slug}`}>
                    <Card className="border-none group overflow-hidden rounded-[40px] shadow-2xl shadow-primary/5 bg-white p-0" bodyStyle={{ padding: 0 }}>
                      <Row gutter={0}>
                        <Col xs={24} lg={14}>
                          <div className="aspect-video lg:aspect-auto lg:h-[500px] overflow-hidden relative">
                            <img src={thumbnailUrl(headline.thumbnail)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={headline.judul} />
                            <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1">
                              <StarFilled className="text-[8px]" /> Pilihan Redaksi
                            </div>
                          </div>
                        </Col>
                        <Col xs={24} lg={10}>
                          <div className="p-8 md:p-12 h-full flex flex-col justify-center">
                            <Space size="middle" className="mb-6">
                              <Tag color="blue" className="rounded-full border-none px-4 font-bold uppercase tracking-widest text-[9px]">
                                {headline.category?.title || 'Featured'}
                              </Tag>
                            </Space>
                            <Title level={2} className="!font-manrope !font-black !mb-6 leading-tight group-hover:text-primary transition-colors">
                              {headline.judul}
                            </Title>
                            <Paragraph className="text-on-surface/60 text-lg mb-8 line-clamp-3">
                              {headline.deskripsi}
                            </Paragraph>
                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-3">
                                <Badge dot status="processing">
                                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                                    {(headline.user?.name || 'A')[0]}
                                  </div>
                                </Badge>
                                <div>
                                  <Text className="block font-bold">{headline.user?.name || 'Admin'}</Text>
                                  <Text className="text-xs text-on-surface/40">{formatDate(headline.created_at)}</Text>
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
              )}

              {/* Other Posts */}
              {otherPosts.map((post) => (
                <Col xs={24} md={12} key={post.id}>
                  <Link to={`/blog/${post.slug}`}>
                    <Card className="border-none weightless-card rounded-[32px] overflow-hidden group h-full flex flex-col"
                      cover={
                        <div className="aspect-[16/10] overflow-hidden">
                          <img src={thumbnailUrl(post.thumbnail)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={post.judul} />
                        </div>
                      }>
                      <div className="flex flex-col h-full">
                        <Space className="mb-4">
                          <Tag className="rounded-full bg-primary/10 text-primary border-none font-bold text-[9px] px-3 uppercase tracking-tighter">
                            {post.category?.title || 'Umum'}
                          </Tag>
                          <Text className="text-[10px] text-on-surface/40 font-bold uppercase tracking-widest">
                            {formatDate(post.created_at)}
                          </Text>
                        </Space>
                        <Title level={4} className="!font-manrope !font-black !mb-4 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {post.judul}
                        </Title>
                        <Paragraph className="text-on-surface/60 line-clamp-2 mb-6">{post.deskripsi}</Paragraph>
                        <div className="mt-auto pt-6 border-t border-on-surface/5 flex items-center gap-3">
                          <UserOutlined className="text-primary" />
                          <Text className="font-bold text-xs">{post.user?.name || 'Admin'}</Text>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </Col>
              ))}

              {posts.length === 0 && !headline && !loading && (
                <Col span={24}>
                  <div className="text-center py-20 text-on-surface/30">
                    <Text className="font-bold text-lg block">Belum ada artikel yang dipublikasikan</Text>
                  </div>
                </Col>
              )}
            </Row>
          )}

          {total > 9 && (
            <div className="mt-20 flex justify-center">
              <Pagination
                total={total}
                pageSize={9}
                current={currentPage}
                onChange={setCurrentPage}
                showSizeChanger={false}
                className="weightless-pagination"
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default BlogPage;
