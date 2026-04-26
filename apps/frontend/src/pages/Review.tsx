import React, { useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import { Row, Col, Card, Typography, Tag, Button, Progress, Space, Divider } from 'antd';
import { 
  CheckCircleFilled, 
  CloseCircleFilled, 
  MinusCircleFilled,
  ArrowLeftOutlined,
  BulbOutlined,
  WarningOutlined,
  BookOutlined,
  RightOutlined,
  LeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const Review: React.FC = () => {
  const navigate = useNavigate();
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(1);

  // Mock data based on the Stitch design requirements
  const stats = {
    total: 40,
    benar: 30,
    salah: 10,
    kosong: 0,
    score: 750
  };

  // Generate mock answer map
  const answerMap = Array.from({ length: 40 }, (_, i) => ({
    id: i + 1,
    status: i < 30 ? 'correct' : i < 40 ? 'incorrect' : 'empty', // 30 correct, 10 incorrect
  }));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'correct': return 'bg-green-500 text-white border-green-500';
      case 'incorrect': return 'bg-red-500 text-white border-red-500';
      case 'empty': return 'bg-gray-200 text-gray-500 border-gray-300';
      default: return 'bg-white border-gray-200';
    }
  };

  const currentQuestionData = {
    text: "Diketahui sebuah segitiga ABC dengan panjang sisi AB=8, BC=10. Jika sudut B adalah 60 derajat, berapakah luas segitiga tersebut?",
    options: ["20√3", "40", "20", "40√3", "10√3"],
    userAnswer: "40", // User answered incorrectly
    correctAnswer: "20√3",
    explanation: "Pertanyaan ini membutuhkan pemahaman mendalam tentang trigonometri dasar. Gunakan rumus luas segitiga L = 1/2 * a * b * sin(C). Substitusikan nilai: 1/2 * 8 * 10 * sin(60). Nilai sin(60) adalah 1/2 √3. Maka hasilnya adalah 20√3 unit persegi. Kesalahan umum terletak pada ketidaktelitian menggunakan nilai sinus sudut."
  };

  return (
    <AppLayout>
      <div className="bg-surface-low/30 min-h-screen py-8 lg:py-12 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Bar */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
              className="text-on-surface/60 hover:text-primary transition-colors h-10 w-10 flex items-center justify-center rounded-full bg-surface-low hover:bg-primary/10"
            />
            <div>
              <Text className="text-[10px] sm:text-xs font-heavy uppercase tracking-[0.2em] text-on-surface/40 leading-none mb-1 block">
                Riwayat Tryout
              </Text>
              <Title level={2} className="!m-0 !font-black !font-manrope !text-2xl sm:!text-3xl">Review Hasil Simulasi</Title>
            </div>
          </div>

          <Row gutter={[32, 32]}>
            {/* Left Column: Stats & Map */}
            <Col xs={24} lg={8}>
              <div className="space-y-6">
                
                {/* Score Summary */}
                <Card className="weightless-card border-none bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-x-[-20%] -translate-y-[20%]" />
                   <div className="relative z-10 text-center py-4">
                     <Text className="text-sm font-bold text-on-surface/60 block mb-2 uppercase tracking-widest">Skor Akhir</Text>
                     <div className="text-5xl font-black text-primary font-manrope">{stats.score}</div>
                   </div>
                </Card>

                {/* Accuracy Stats */}
                <Card className="weightless-card border-none" title={<span className="font-black font-manrope">Statistik Akurasi</span>}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-surface-low p-3 rounded-2xl">
                      <div className="text-2xl font-black text-on-surface">{stats.total}</div>
                      <div className="text-[10px] uppercase font-bold text-on-surface/40 tracking-wider">Total</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-2xl">
                      <div className="text-2xl font-black text-green-600">{stats.benar}</div>
                      <div className="text-[10px] uppercase font-bold text-green-600/60 tracking-wider">Benar</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-2xl">
                      <div className="text-2xl font-black text-red-600">{stats.salah}</div>
                      <div className="text-[10px] uppercase font-bold text-red-600/60 tracking-wider">Salah</div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold text-on-surface/60 mb-2">
                      <span>Prosentase Akurasi</span>
                      <span>{Math.round((stats.benar / stats.total) * 100)}%</span>
                    </div>
                    <Progress 
                      percent={Math.round((stats.benar / stats.total) * 100)} 
                      showInfo={false}
                      strokeColor="#10b981" // green-500
                      trailColor="#fca5a5" // red-300
                      strokeWidth={8}
                    />
                  </div>
                </Card>

                {/* Answer Map */}
                <Card className="weightless-card border-none" title={<span className="font-black font-manrope">Peta Jawaban</span>}>
                  <div className="flex items-center gap-4 mb-4 text-xs">
                    <span className="flex items-center gap-1.5"><CheckCircleFilled className="text-green-500" /> Benar</span>
                    <span className="flex items-center gap-1.5"><CloseCircleFilled className="text-red-500" /> Salah</span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2">
                    {answerMap.map((ans) => (
                      <button
                        key={ans.id}
                        onClick={() => setSelectedQuestion(ans.id)}
                        className={`
                          w-full aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all
                          ${getStatusColor(ans.status)}
                          ${selectedQuestion === ans.id ? 'ring-4 ring-primary/30 scale-110 shadow-lg' : 'hover:opacity-80'}
                        `}
                      >
                        {ans.id}
                      </button>
                    ))}
                  </div>
                </Card>

              </div>
            </Col>

            {/* Right Column: Question Review */}
            <Col xs={24} lg={16}>
              <Card className="weightless-card border-none h-full p-2 lg:p-6">
                {selectedQuestion ? (
                  <div className="animate-fade-in">
                    <div className="flex items-center justify-between border-b border-on-surface/5 pb-6 mb-6">
                      <Space align="center" size="middle">
                        <Tag className="rounded-full px-4 py-1 text-sm font-black border-none bg-surface-low text-on-surface">
                          Soal #{selectedQuestion}
                        </Tag>
                        {answerMap[selectedQuestion - 1]?.status === 'correct' ? (
                          <Tag color="success" className="rounded-full border-none px-3 font-bold flex items-center gap-1">
                            <CheckCircleFilled /> Benar
                          </Tag>
                        ) : (
                          <Tag color="error" className="rounded-full border-none px-3 font-bold flex items-center gap-1">
                            <CloseCircleFilled /> Salah
                          </Tag>
                        )}
                      </Space>
                      
                      <Button type="text" className="text-primary font-bold">Laporkan Soal</Button>
                    </div>

                    <div className="space-y-8">
                      {/* Question Text */}
                      <div>
                        <Paragraph className="text-lg leading-relaxed text-on-surface">
                          {currentQuestionData.text}
                        </Paragraph>
                      </div>

                      {/* Options Review */}
                      <div className="space-y-3">
                        <Text className="text-xs font-bold uppercase tracking-widest text-on-surface/40">Pilihan Jawaban</Text>
                        {currentQuestionData.options.map((opt, idx) => {
                          const isCorrectOption = opt === currentQuestionData.correctAnswer;
                          const isUserOption = opt === currentQuestionData.userAnswer;
                          
                          let containerClass = "border border-on-surface/10 bg-white text-on-surface/80";
                          let icon = null;

                          if (isCorrectOption) {
                            containerClass = "border-green-500 bg-green-50/50 text-green-700 ring-1 ring-green-500";
                            icon = <CheckCircleFilled className="text-green-500 text-lg" />;
                          } else if (isUserOption && !isCorrectOption) {
                            containerClass = "border-red-500 bg-red-50/50 text-red-700 ring-1 ring-red-500";
                            icon = <CloseCircleFilled className="text-red-500 text-lg" />;
                          }

                          const label = String.fromCharCode(65 + idx); // A, B, C...

                          return (
                            <div key={idx} className={`p-4 rounded-2xl flex items-center justify-between transition-all ${containerClass}`}>
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-black/5`}>
                                  {label}
                                </div>
                                <Text className="font-semibold">{opt}</Text>
                              </div>
                              {icon}
                            </div>
                          );
                        })}
                      </div>

                      {/* Detailed Explanation */}
                      <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-6 lg:p-8 relative mt-12">
                        <div className="flex gap-4">
                          <div className="shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 text-xl">
                              <BulbOutlined />
                            </div>
                          </div>
                          <div className="w-full">
                            <Title level={4} className="!text-blue-900 !font-black !font-manrope !mb-4 mt-1 tracking-tight">
                              Pembahasan Mendalam
                            </Title>
                            
                            <div className="border-l-4 border-blue-300 pl-4 mb-6">
                              <Text className="text-blue-900/80 italic leading-relaxed text-sm block">
                                "Kunci utama dari soal ini adalah ketelitian dalam menggunakan rumus dan memasukkan nilai ke dalam fungsi trigonometri dasar."
                              </Text>
                            </div>

                            <Paragraph className="text-blue-900/80 leading-loose mb-8 text-base font-medium">
                              {currentQuestionData.explanation}
                            </Paragraph>
                            
                            {/* Related Material Banner */}
                            <div className="bg-white rounded-2xl p-4 border border-blue-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-default">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                                  <BookOutlined className="text-lg" />
                                </div>
                                <div>
                                  <Text className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block mb-0.5">Materi Terkait</Text>
                                  <Text className="font-bold text-on-surface">Konsep Trigonometri Dasar</Text>
                                </div>
                              </div>
                              <Button 
                                type="primary" 
                                ghost 
                                shape="round" 
                                className="font-bold border-blue-200 text-blue-600 hover:bg-blue-50 ml-4 shrink-0"
                                onClick={() => navigate('/materi/1')}
                              >
                                Pelajari <RightOutlined />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Divider className="border-on-surface/10 mt-10 mb-8" />
                      
                      {/* Refined Navigation */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                        <Button 
                          size="large"
                          type="text"
                          icon={<LeftOutlined />}
                          disabled={selectedQuestion === 1}
                          onClick={() => setSelectedQuestion(prev => (prev ? prev - 1 : 1))}
                          className="w-full sm:w-auto h-12 rounded-xl font-bold bg-surface-low hover:bg-surface-low/80 text-on-surface/80"
                        >
                          Soal Sebelumnya
                        </Button>
                        <Button 
                          size="large"
                          type="primary"
                          className="w-full sm:w-auto h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                          disabled={selectedQuestion === stats.total}
                          onClick={() => setSelectedQuestion(prev => (prev ? prev + 1 : 1))}
                        >
                          Soal Selanjutnya <RightOutlined />
                        </Button>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-on-surface/40 space-y-4 py-20">
                    <WarningOutlined className="text-4xl" />
                    <Text>Pilih soal dari peta jawaban untuk melihat detail pembahasan.</Text>
                  </div>
                )}
              </Card>
            </Col>

          </Row>
        </div>
      </div>
    </AppLayout>
  );
};

export default Review;
