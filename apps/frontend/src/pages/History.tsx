import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { Typography, Row, Col, Card, Tag, Table, Button, Badge, Space, message } from 'antd';
import {
  HistoryOutlined,
  BarChartOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TrophyOutlined,
  DeleteOutlined,
  RobotOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageLoader from '../components/atoms/PageLoader';
import Paragraph from 'antd/es/typography/Paragraph';
import { useAuth } from '../context/AuthContext';
import { getAdminExamSessions, getProgressAnalysis, generateProgressAnalysis, deleteProgressAnalysis } from '../services/packageService';
import { Modal, Drawer, Checkbox, Spin } from 'antd';
import { renderContent } from '../utils/renderContent';

const { Title, Text } = Typography;

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { payload } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  // Progress Analysis states
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalysisDrawerVisible, setIsAnalysisDrawerVisible] = useState(false);
  const [isSelectModalVisible, setIsSelectModalVisible] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<number[]>([]);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [deletingAnalysis, setDeletingAnalysis] = useState(false);

  useEffect(() => {
    if (!payload?.user_id) return;
    setLoading(true);
    getAdminExamSessions(false, 1, 100, '', payload.user_id)
      .then((res) => {
        setData(res.items || []);
      })
      .catch(() => message.error('Gagal memuat riwayat ujian'))
      .finally(() => setLoading(false));

    // Fetch existing analysis
    getProgressAnalysis(payload.user_id).then((res) => {
      if (res) {
        setAnalysisData(res);
      }
    }).catch(() => {});
  }, [payload?.user_id]);

  const handleAnalisisClick = () => {
    if (analysisData) {
      setIsAnalysisDrawerVisible(true);
    } else {
      setIsSelectModalVisible(true);
    }
  };

  const handleGenerateAnalysis = async () => {
    if (selectedSessionIds.length === 0 || selectedSessionIds.length > 2) {
      message.error("Pilih 1 atau maksimal 2 riwayat tryout.");
      return;
    }
    setGeneratingAnalysis(true);
    try {
      const result = await generateProgressAnalysis(payload!.user_id, selectedSessionIds);
      setAnalysisData(result);
      message.success("Analisis berhasil dibuat!");
      setIsSelectModalVisible(false);
      setIsAnalysisDrawerVisible(true);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Gagal membuat analisis.");
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const handleDeleteAnalysis = async () => {
    if (!analysisData) return;
    Modal.confirm({
      title: 'Hapus Analisis?',
      content: 'Apakah Anda yakin ingin menghapus analisis ini? Anda bisa membuat yang baru setelahnya.',
      okText: 'Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        setDeletingAnalysis(true);
        try {
          await deleteProgressAnalysis(analysisData.id, payload!.user_id);
          message.success("Analisis berhasil dihapus.");
          setAnalysisData(null);
          setIsAnalysisDrawerVisible(false);
        } catch (error: any) {
          message.error(error?.response?.data?.message || "Gagal menghapus analisis.");
        } finally {
          setDeletingAnalysis(false);
        }
      }
    });
  };

  const columns = [
    {
      title: 'Tryout',
      dataIndex: 'package',
      key: 'package',
      render: (pkg: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
            <FileTextOutlined className="text-primary" />
          </div>
          <div>
            <div className="font-bold text-on-surface">{pkg?.title || 'Unknown'}</div>
            <div className="text-[10px] text-on-surface/40 uppercase tracking-widest font-heavy">{pkg?.category || 'Umum'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Tanggal',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => <Text className="font-medium text-on-surface/60">{new Date(text).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>,
    },
    {
      title: 'Skor Akhir',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-primary">{score || 0}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: () => (
        <Badge
          count="Selesai"
          style={{ backgroundColor: '#10b981', fontWeight: 'bold', fontSize: '10px' }}
          className="rounded-full"
        />
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (record: any) => (
        <Button
          type="text"
          icon={<ArrowRightOutlined />}
          onClick={() => navigate(`/riwayat/${record.id}/review`)}
          className="hover:text-primary font-bold flex items-center gap-2"
        >
          Lihat Detail
        </Button>
      ),
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <AppLayout>
      <div className="bg-surface-low/30 pt-32 pb-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <HistoryOutlined />
                <span className="text-[10px] uppercase font-heavy tracking-widest">Aktivitas Belajar</span>
              </div>
              <Title level={1} className="!font-manrope !m-0 !font-black tracking-tight !text-4xl md:!text-5xl">Riwayat Tryout</Title>
              <Paragraph className="text-on-surface/60 max-w-lg m-0">Lacak perkembangan skormu dan tinjau kembali hasil pengerjaan tryout sebelumnya untuk evaluasi yang lebih baik.</Paragraph>
            </div>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              size="large"
              className="rounded-2xl h-14 px-8 font-bold shadow-lg shadow-primary/20"
              onClick={handleAnalisisClick}
            >
              Analisis Progress
            </Button>
          </header>

          <Row gutter={[32, 32]}>
            <Col xs={24} lg={18}>
              <Card className="border-none bg-white rounded-[40px] shadow-2xl shadow-primary/5 p-4 md:p-8 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                <Table
                  columns={columns}
                  dataSource={data}
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 'max-content' }}
                  className="weightless-table"
                />
              </Card>
            </Col>

            <Col xs={24} lg={6}>
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                <Card className="border-none bg-primary text-white rounded-[32px] p-6 shadow-xl shadow-primary/20 overflow-hidden relative">
                  <div className="relative z-10 space-y-6">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <TrophyOutlined className="text-2xl" />
                    </div>
                    <div className="space-y-1">
                      <Text className="text-white/60 text-xs font-bold uppercase tracking-widest">Skor Tertinggi</Text>
                      <div className="text-4xl font-black">{data.length > 0 ? Math.max(...data.map(d => d.score || 0)) : 0}</div>
                    </div>
                    <div className="pt-2">
                      <Button ghost className="rounded-xl border-white/30 text-white font-bold h-10">Bandingkan</Button>
                    </div>
                  </div>
                  {/* Decorative element */}
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                </Card>

                <Card className="border-none bg-white rounded-[32px] p-6 shadow-xl shadow-primary/5">
                  <Title level={5} className="mb-6 !font-manrope">Ringkasan Statistik</Title>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <Space align="center" size="middle">
                        <CheckCircleOutlined className="text-green-500" />
                        <Text className="font-bold">Selesai</Text>
                      </Space>
                      <Text className="font-black">{data.length}</Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Space align="center" size="middle">
                        <ClockCircleOutlined className="text-yellow-500" />
                        <Text className="font-bold">Berjalan</Text>
                      </Space>
                      <Text className="font-black">0</Text>
                    </div>
                    <div className="h-px bg-on-surface/5" />
                    <div className="pt-2">
                      <Text className="text-xs text-on-surface/40 leading-relaxed block">
                        Kamu telah menyelesaikan <b>{data.length}</b> simulasi ujian. Tetap semangat!
                      </Text>
                    </div>
                  </div>
                </Card>
              </div>
            </Col>
          </Row>

          {/* Modal Select Sessions */}
          <Modal
            title="Pilih Riwayat Tryout"
            open={isSelectModalVisible}
            onCancel={() => setIsSelectModalVisible(false)}
            footer={null}
            centered
          >
            <div className="space-y-4 my-6">
              <Paragraph className="text-on-surface/60">
                Pilih 1 atau maksimal 2 riwayat tryout terakhir yang ingin Anda analisis kesalahannya menggunakan AI.
              </Paragraph>
              {data.length === 0 ? (
                <div className="text-center text-on-surface/40 p-4">Belum ada riwayat tryout.</div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {data.map((session: any) => (
                    <div key={session.id} className="flex items-center gap-3 p-3 border border-surface-on/10 rounded-xl hover:bg-surface-low transition-colors">
                      <Checkbox 
                        checked={selectedSessionIds.includes(session.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (selectedSessionIds.length >= 2) {
                              message.warning('Maksimal 2 riwayat yang dapat dipilih.');
                              return;
                            }
                            setSelectedSessionIds([...selectedSessionIds, session.id]);
                          } else {
                            setSelectedSessionIds(selectedSessionIds.filter(id => id !== session.id));
                          }
                        }}
                      />
                      <div>
                        <div className="font-bold">{session.package?.title || 'Unknown'}</div>
                        <div className="text-xs text-on-surface/60">Skor: {session.score} • {new Date(session.created_at).toLocaleDateString('id-ID')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                type="primary" 
                block 
                size="large" 
                className="mt-4 rounded-xl font-bold"
                onClick={handleGenerateAnalysis}
                disabled={selectedSessionIds.length === 0 || generatingAnalysis}
              >
                {generatingAnalysis ? <Spin className="mr-2" /> : <RobotOutlined />}
                {generatingAnalysis ? 'AI sedang menganalisis...' : 'Mulai Analisis AI'}
              </Button>
            </div>
          </Modal>

          {/* Drawer Analysis */}
          <Drawer
            title={
              <div className="flex items-center gap-2">
                <RobotOutlined className="text-primary" />
                <span className="font-bold">Saran & Analisis AI</span>
              </div>
            }
            placement="right"
            width={600}
            onClose={() => setIsAnalysisDrawerVisible(false)}
            open={isAnalysisDrawerVisible}
            footer={
              <div className="flex justify-between items-center p-2">
                <Text className="text-xs text-on-surface/40">
                  {!analysisData?.can_delete && <><WarningOutlined /> Analisis baru dapat dihapus 1 minggu setelah pembuatan.</>}
                </Text>
                <Button 
                  danger 
                  type="text" 
                  icon={<DeleteOutlined />} 
                  onClick={handleDeleteAnalysis}
                  disabled={!analysisData?.can_delete}
                  loading={deletingAnalysis}
                >
                  Hapus Analisis
                </Button>
              </div>
            }
          >
            {analysisData && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                  <Text className="text-primary font-bold text-xs uppercase tracking-widest block mb-2">Insight Guru AI</Text>
                  <Paragraph className="m-0 text-sm opacity-80">
                    Berikut adalah analisis pola kesalahan dari ujian yang telah kamu pilih. Jadikan acuan untuk memperdalam materi belajar!
                  </Paragraph>
                </div>
                <div 
                  className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-manrope prose-headings:font-bold prose-a:text-primary"
                  dangerouslySetInnerHTML={{ __html: renderContent(analysisData.analysis_text) }}
                />
                <div className="text-xs text-on-surface/40 mt-10 text-center">
                  Dibuat pada: {new Date(analysisData.created_at).toLocaleString('id-ID')}
                </div>
              </div>
            )}
          </Drawer>

        </div>
      </div>
    </AppLayout>
  );
};

export default HistoryPage;
