import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Typography, Button, Card, Row, Col, Space, Tag, Modal, Drawer, Checkbox
} from 'antd';
import { 
  ClockCircleOutlined, 
  CloseOutlined, 
  LeftOutlined, 
  RightOutlined,
  AppstoreOutlined,
  WarningOutlined,
  CheckCircleFilled,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const ExamSimulation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State Management
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(14 * 60 + 55); // 14:55
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const totalQuestions = 40;

  // Mock answers map (storing array of selected option indexes)
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [doubtfulQuestions, setDoubtfulQuestions] = useState<Record<number, boolean>>({});

  const mockQuestions = [
    {
      id: 1,
      type: "single",
      passage: [
        "Perkembangan teknologi informasi yang begitu pesat telah mengubah wajah literasi di Indonesia. Jika dahulu literasi hanya dimaknai sebagai kemampuan membaca dan menulis di atas kertas, kini cakupannya meluas hingga ke ranah digital.",
        "Namun, fenomena ini membawa tantangan baru berupa \"banjir informasi\" atau information overload. Masyarakat seringkali kesulitan membedakan antara opini subjektif, fakta ilmiah, dan berita bohong (hoaks).",
        "Berdasarkan konteks tersebut, penguatan literasi kritis menjadi sangat krusial untuk membangun ekosistem digital yang sehat dan produktif."
      ],
      question: "Manakah simpulan yang paling tepat berdasarkan paragraf tersebut mengenai urgensi literasi kritis di era digital?",
      options: [
        'Masyarakat memilih untuk menghindari penggunaan internet', 
        'Kemampuan memfilter hoaks adalah bentuk mitigasi krisis', 
        'Literasi kertas tidak lagi relevan dengan perkembangan zaman', 
        'Opini subjektif lebih cepat berkembang daripada fakta', 
        'Information overload terjadi hanya karena media sosial'
      ]
    },
    {
      id: 2,
      type: "multiple",
      passage: [
        "Literasi digital tidak sekadar tentang kemampuan menggunakan perangkat keras dan mencari informasi. Di era modern ini, elemen utama dari literasi digital mencakup kemampuan kognitif dan teknikal.",
        "Hal ini termasuk kecakapan memilah informasi yang valid, memahami etika digital privasi data (netiket), serta kemampuan memproduksi konten bermakna secara aman.",
        "Individu yang cakap digital bukan hanya konsumen pasif, tetapi dituntut menjadi prosumer (produsen dan konsumen) yang beretika."
      ],
      question: "Berdasarkan teks di atas, manakah hal-hal yang menunjukkan praktik literasi digital yang komprehensif? (Bisa pilih lebih dari satu)",
      options: [
        'Hampir setiap hari mencari informasi viral tanpa melakukan pengecekan sumber',
        'Memverifikasi kebenaran sebuah berita kesehatan ke portal resmi sebelum membagikannya',
        'Menggunakan kata sandi yang sama di semua platform untuk kemudahan akses',
        'Membuat desain grafis positif yang mengedukasi pelestarian lingkungan di media sosial',
        'Secara konsisten menjaga privasi data diri dengan mengatur preferensi keamanan di aplikasi navigasi'
      ]
    }
  ];

  const currentData = mockQuestions.find(q => q.id === currentQuestion) || mockQuestions[0];

  // Countdown Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Time Helper
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (index: number) => {
    setAnswers(prev => {
      const currentAnsArr = prev[currentQuestion] || [];
      if (currentData.type === 'single') {
        return { ...prev, [currentQuestion]: [index] };
      } else {
        // Toggle for multiple choice
        if (currentAnsArr.includes(index)) {
          return { ...prev, [currentQuestion]: currentAnsArr.filter(i => i !== index) };
        } else {
          return { ...prev, [currentQuestion]: [...currentAnsArr, index] };
        }
      }
    });
  };

  const handleToggleDoubtful = (e: any) => {
    setDoubtfulQuestions(prev => ({ ...prev, [currentQuestion]: e.target.checked }));
  };

  const finishExam = () => {
    Modal.confirm({
      title: 'Kumpulkan Jawaban?',
      icon: <ExclamationCircleOutlined />,
      content: 'Pastikan Anda telah mengisi seluruh jawaban dengan yakin. Apakah Anda ingin mengumpulkan sekarang?',
      okText: 'Kumpulkan Sekarang',
      cancelText: 'Kembali Ujian',
      onOk() {
        navigate('/riwayat/1/review'); // Route to review
      },
    });
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans transition-colors duration-500">
      
      {/* EXAM HEADER */}
      <header className="bg-white border-b border-surface-container h-16 flex items-center justify-between px-4 sm:px-8 shrink-0 relative z-30">
        <div className="flex items-center gap-4">
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            className="text-on-surface/40 hover:text-red-500 hover:bg-red-50"
            onClick={() => setIsExitModalVisible(true)}
          />
          <div className="hidden sm:block">
            <Text className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block leading-tight">SNBT Prep</Text>
            <Text className="font-bold text-on-surface block leading-tight">Literasi Bahasa</Text>
          </div>
        </div>

        {/* Timer UI: Critical to user focus */}
        <div className="bg-primary/5 border border-primary/20 px-4 flex items-center justify-center rounded-xl h-10 gap-2">
          <ClockCircleOutlined className="text-primary font-bold" />
          <Text className="font-mono font-bold text-primary tracking-wider text-lg">
            {formatTime(timeRemaining)}
          </Text>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            type="text" 
            className="hidden sm:flex font-bold text-on-surface/60 items-center"
            onClick={() => setIsMapVisible(true)}
            icon={<AppstoreOutlined />}
          >
            Peta Soal
          </Button>
          <Button type="primary" onClick={finishExam} className="font-bold shadow-md shadow-primary/20 rounded-lg">
            Selesai
          </Button>
        </div>
      </header>

      {/* EXAM BODY */}
      <main className="flex-grow overflow-auto">
        <div className="max-w-7xl mx-auto h-full flex flex-col lg:flex-row">
          
          {/* Left Column (Passage) */}
          <div className="lg:w-1/2 p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-surface-container overflow-y-auto bg-white/50">
            <Tag color="green" className="mb-4 rounded-full border-none font-bold px-3">Teks Kontemporer</Tag>
            <Title level={3} className="!font-manrope !font-black !text-2xl mt-0">
              Transformasi Literasi Digital
            </Title>
            <div className="prose prose-lg prose-p:text-on-surface/80 prose-p:leading-loose">
              {currentData.passage.map((pg, i) => (
                <Paragraph key={i}>{pg}</Paragraph>
              ))}
            </div>
          </div>

          {/* Right Column (Question & Options) */}
          <div className="lg:w-1/2 p-6 lg:p-10 bg-white overflow-y-auto flex flex-col">
            
            <div className="flex items-center justify-between mb-6">
              <Tag className="rounded-full px-4 py-1 text-sm font-black border-none bg-surface-low text-on-surface">
                Soal #{currentQuestion} {currentData.type === 'multiple' ? '(Multi Jawaban)' : ''}
              </Tag>
              <Button type="text" className="text-on-surface/40 hover:text-primary font-bold text-xs uppercase" icon={<WarningOutlined />}>Lapor Soal</Button>
            </div>

            <Paragraph className="text-xl leading-relaxed text-on-surface font-medium mb-10">
              {currentData.question}
            </Paragraph>

            <div className="space-y-4 mb-8">
              {currentData.options.map((opt, idx) => {
                const currentAnsArr = answers[currentQuestion] || [];
                const isSelected = currentAnsArr.includes(idx);
                const label = String.fromCharCode(65 + idx);
                
                return (
                  <div 
                    key={idx} 
                    onClick={() => handleSelectOption(idx)}
                    className={`
                      p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border 
                      ${isSelected 
                        ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(0,83,221,0.2)]' 
                        : 'border-surface-container bg-surface-lowest hover:border-primary/50'
                      }
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 transition-colors
                      ${isSelected ? 'bg-primary text-white' : 'bg-surface-low text-on-surface/60'}
                    `}>
                      {label}
                    </div>
                    <Text className={`text-base font-medium ${isSelected ? 'text-primary' : 'text-on-surface/80'}`}>
                      {opt}
                    </Text>
                  </div>
                );
              })}
            </div>

            <div className="bg-surface-low/30 border border-surface-container rounded-xl p-4 mt-auto">
              <Checkbox 
                checked={doubtfulQuestions[currentQuestion] || false} 
                onChange={handleToggleDoubtful}
                className="font-bold text-on-surface/60 hover:text-on-surface"
              >
                Ragu-ragu (Tandai untuk diperiksa kembali)
              </Checkbox>
            </div>

          </div>

        </div>
      </main>

      {/* EXAM FOOTER */}
      <footer className="bg-white border-t border-surface-container p-4 shrink-0 relative z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button 
            size="large"
            type="text"
            icon={<LeftOutlined />}
            disabled={currentQuestion === 1}
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            className="font-bold text-on-surface/80"
          >
            Kembali
          </Button>

          {/* Mobile Peta Soal Trigger */}
          <Button 
            type="dashed"
            className="sm:hidden font-bold"
            onClick={() => setIsMapVisible(true)}
            icon={<AppstoreOutlined />}
          >
            Peta Soal
          </Button>

          <Button 
            size="large"
            type="primary"
            icon={<RightOutlined />}
            iconPosition="end"
            onClick={() => setCurrentQuestion(prev => prev < totalQuestions ? prev + 1 : prev)}
            disabled={currentQuestion === totalQuestions}
            className="rounded-xl font-bold shadow-xl shadow-primary/20 h-12 px-6"
          >
            Selanjutnya
          </Button>
        </div>
      </footer>

      {/* DRAWER: PETA SOAL */}
      <Drawer
        title={<span className="font-black font-manrope">Peta Soal</span>}
        placement="right"
        onClose={() => setIsMapVisible(false)}
        open={isMapVisible}
        width={320}
      >
        <div className="flex gap-4 items-center mb-6 text-xs text-on-surface/60">
           <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-primary rounded-full"></div> Selesai</span>
           <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-400 rounded-full"></div> Ragu-ragu</span>
           <span className="flex items-center gap-1.5"><div className="w-3 h-3 border border-surface-container rounded-full"></div> Kosong</span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: totalQuestions }).map((_, i) => {
            const num = i + 1;
            const currentAnsArr = answers[num] || [];
            const isAnswered = currentAnsArr.length > 0;
            const isDoubtful = doubtfulQuestions[num];
            const isCurrent = currentQuestion === num;
            
            return (
              <button
                key={num}
                onClick={() => {
                  setCurrentQuestion(num);
                  setIsMapVisible(false);
                }}
                className={`
                  aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all
                  ${isCurrent ? 'ring-2 ring-primary scale-110 shadow-md' : ''}
                  ${isDoubtful ? 'bg-yellow-400 text-yellow-900 border-yellow-500' 
                    : isAnswered ? 'bg-primary text-white border-primary' 
                    : 'bg-white text-on-surface border border-surface-container hover:bg-surface-low'
                  }
                `}
              >
                {num}
              </button>
            );
          })}
        </div>
      </Drawer>

      {/* MODAL: EXIT CONFIRMATION */}
      <Modal
        title={null}
        open={isExitModalVisible}
        onCancel={() => setIsExitModalVisible(false)}
        footer={null}
        centered
        className="rounded-[2rem] overflow-hidden"
      >
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <WarningOutlined className="text-red-500 text-3xl" />
          </div>
          <Title level={4} className="!font-black !font-manrope mb-2">Akhiri Simulasi?</Title>
          <Paragraph className="text-on-surface/60 mb-8">
            Waktu Anda masih tersisa. Jika Anda keluar sekarang, progres saat ini akan disimpan dan skor akan dikalkulasi sesuai jawaban yang sudah masuk.
          </Paragraph>
          <Space size="middle" className="flex justify-center">
            <Button size="large" className="rounded-xl font-bold" onClick={() => setIsExitModalVisible(false)}>
              Batal
            </Button>
            <Button size="large" type="primary" danger className="rounded-xl font-bold shadow-lg shadow-red-500/20" onClick={() => navigate('/latihan')}>
              Ya, Akhiri Ujian
            </Button>
          </Space>
        </div>
      </Modal>

    </div>
  );
};

export default ExamSimulation;
