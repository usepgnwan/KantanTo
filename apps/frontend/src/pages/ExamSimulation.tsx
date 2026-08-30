import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography, Button, Card, Row, Col, Space, Tag, Modal, Drawer, Checkbox, Spin, message, Alert
} from 'antd';
import {
  ClockCircleOutlined,
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  AppstoreOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { getPackageQuestions, submitExam, PackageQuestionPayload, getPackageBySlug } from '../services/packageService';
import { useAuth } from '../context/AuthContext';
import { renderQuillHtml as renderLatex } from '../utils/renderContent';

const { Title, Paragraph, Text } = Typography;

const ExamSimulation: React.FC = () => {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { payload, isAdmin } = useAuth();

  const [questions, setQuestions] = useState<PackageQuestionPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const [textSize, setTextSize] = useState<number>(16);

  // localStorage keys scoped per exam slug
  const lsKey = (suffix: string) => `exam_${slug}_${suffix}`;

  // Restore state from localStorage (if a previous session exists for this slug)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => {
    try { return Number(localStorage.getItem(`exam_${slug}_index`) ?? 0); } catch { return 0; }
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`exam_${slug}_time`);
      return saved !== null ? Number(saved) : 15 * 60;
    } catch { return 15 * 60; }
  });

  // Map of questionId -> array of selected option indexes
  // For table questions, key is namespaced as "parentId_subId"
  const [answers, setAnswers] = useState<Record<string, number[]>>(() => {
    try {
      const saved = localStorage.getItem(`exam_${slug}_answers`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const answersRef = React.useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const [doubtfulQuestions, setDoubtfulQuestions] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`exam_${slug}_doubtful`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const getSizeClasses = (size: number) => {
    switch (size) {
      case 16: return {
        containerPadding: 'p-5 gap-5',
        circleSize: 'w-11 h-11 text-base',
        nestedPadding: 'p-4 gap-4',
        nestedCircleSize: 'w-8 h-8 text-sm',
      };
      case 14: return {
        containerPadding: 'p-4 gap-4',
        circleSize: 'w-9 h-9 text-sm',
        nestedPadding: 'p-3 gap-3',
        nestedCircleSize: 'w-7 h-7 text-xs',
      };
      case 12: return {
        containerPadding: 'p-3 gap-3',
        circleSize: 'w-8 h-8 text-xs',
        nestedPadding: 'p-2 gap-2',
        nestedCircleSize: 'w-6 h-6 text-[10px]',
      };
      default: return {
        containerPadding: 'p-5 gap-5',
        circleSize: 'w-11 h-11 text-base',
        nestedPadding: 'p-4 gap-4',
        nestedCircleSize: 'w-8 h-8 text-sm',
      };
    }
  };
  const sizeClasses = getSizeClasses(textSize);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    Promise.all([
      getPackageQuestions(slug),
      getPackageBySlug(slug)
    ])
      .then(([questionsData, packageData]) => {
        setQuestions(questionsData);
        // Only set duration from backend if there's no saved timer in localStorage
        const savedTime = localStorage.getItem(lsKey('time'));
        if (!savedTime && packageData && packageData.duration > 0) {
          setTimeRemaining(packageData.duration * 60);
        }
      })
      .catch(() => message.error('Gagal memuat soal ujian'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome to show native prompt
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [loading, questions.length]);

  // Persist answers to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(lsKey('answers'), JSON.stringify(answers)); } catch { }
  }, [answers]);

  // Persist doubtful marks
  useEffect(() => {
    try { localStorage.setItem(lsKey('doubtful'), JSON.stringify(doubtfulQuestions)); } catch { }
  }, [doubtfulQuestions]);

  // Persist current question index
  useEffect(() => {
    try { localStorage.setItem(lsKey('index'), String(currentQuestionIndex)); } catch { }
  }, [currentQuestionIndex]);

  // Persist time remaining (updated every second)
  useEffect(() => {
    try { localStorage.setItem(lsKey('time'), String(timeRemaining)); } catch { }
  }, [timeRemaining]);

  // Countdown Timer Effect
  useEffect(() => {
    if (loading || questions.length === 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishExam(true); // Auto submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, questions]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (qId: string, qType: string, optIndex: number) => {
    setAnswers(prev => {
      const currentAnsArr = prev[qId] || [];
      if (qType === 'single') {
        return { ...prev, [qId]: [optIndex] };
      } else {
        // Toggle for multiple choice
        if (currentAnsArr.includes(optIndex)) {
          return { ...prev, [qId]: currentAnsArr.filter(i => i !== optIndex) };
        } else {
          return { ...prev, [qId]: [...currentAnsArr, optIndex] };
        }
      }
    });
  };

  const handleToggleDoubtful = (qId: string, e: any) => {
    setDoubtfulQuestions(prev => ({ ...prev, [qId]: e.target.checked }));
  };

  const toggleDoubtful = (qId: string) => {
    setDoubtfulQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Clear all persisted exam state from localStorage
  const clearPersistedState = () => {
    try {
      ['answers', 'doubtful', 'index', 'time'].forEach(suffix =>
        localStorage.removeItem(lsKey(suffix))
      );
    } catch { }
  };

  const submitToBackend = async () => {
    if (!slug || !payload) return;
    setSubmitting(true);

    // Format answers map for backend
    const formattedAnswers: Record<string, number[]> = {};
    Object.keys(answersRef.current).forEach(k => {
      formattedAnswers[k] = answersRef.current[k];
      const parts = k.split('_');
      const lastPart = parts[parts.length - 1];
      if (lastPart && !formattedAnswers[lastPart]) {
        formattedAnswers[lastPart] = answersRef.current[k];
      }
    });

    try {
      const res = await submitExam(slug, {
        client_id: 'client', // Placeholder if needed
        user_id: payload?.user_id ?? 0,
        is_testing: isAdmin(),
        answers: formattedAnswers
      });
      clearPersistedState(); // clear saved state after successful submit
      message.success('Ujian berhasil dikumpulkan');
      navigate(`/riwayat/${res.session_id}/review`);
    } catch (err) {
      message.error('Gagal mengumpulkan jawaban');
      setSubmitting(false);
    }
  };

  const finishExam = (isTimeout = false) => {
    if (isTimeout) {
      message.warning('Waktu habis! Jawaban Anda akan otomatis dikumpulkan.');
      submitToBackend();
      return;
    }

    Modal.confirm({
      title: 'Kumpulkan Jawaban?',
      icon: <ExclamationCircleOutlined />,
      content: 'Pastikan Anda telah mengisi seluruh jawaban dengan yakin. Apakah Anda ingin mengumpulkan sekarang?',
      okText: 'Kumpulkan Sekarang',
      cancelText: 'Kembali Ujian',
      onOk: submitToBackend,
    });
  };

  // ── FLAT QUESTION LIST: expand 'linked' into individual numbered entries ──
  type FlatQuestion = {
    id: string;                  // sub-question id (for linked) or question id
    type: string;
    question: string;
    options: string[];
    title: string;
    discussion: string;
    sub_questions?: any[];
    rows?: any[];
    scoring_method?: string;
    // for linked type:
    isLinked: boolean;
    linkedPassage?: string;
    linkedPassageTitle?: string;
    linkedParentId?: string;
    linkedSubIndex?: number;
    linkedGroupSize?: number;
    linkedGroupStart?: number;  // flat index of the first question in this linked group
  };

  const flatQuestions: FlatQuestion[] = React.useMemo(() => {
    const result: FlatQuestion[] = [];
    for (const q of questions) {
      if (q.type === 'linked' && q.sub_questions && q.sub_questions.length > 0) {
        const groupStart = result.length;
        q.sub_questions.forEach((sub: any, subIdx: number) => {
          result.push({
            id: String(sub.id),
            type: sub.type || 'single',
            question: sub.question || '',
            options: (sub.options as string[]) || (sub.type === 'table' ? ['Benar', 'Salah'] : []),
            title: (sub as any).title || '',
            discussion: sub.discussion || '',
            rows: (sub as any).rows || [],
            scoring_method: (sub as any).scoring_method || 'all_or_nothing',
            isLinked: true,
            linkedPassage: q.question,
            linkedPassageTitle: q.title,
            linkedParentId: String(q.id),
            linkedSubIndex: subIdx,
            linkedGroupSize: q.sub_questions!.length,
            linkedGroupStart: groupStart,
          });
        });
      } else {
        result.push({
          id: String(q.id),
          type: q.type,
          question: q.question,
          options: q.options,
          title: q.title,
          discussion: q.discussion,
          sub_questions: q.sub_questions,
          isLinked: false,
        });
      }
    }
    return result;
  }, [questions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Spin size="large" tip="Memuat soal ujian..." />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Card className="text-center rounded-2xl shadow-sm max-w-md w-full p-8 border-none bg-surface-low">
          <WarningOutlined className="text-red-500 text-4xl mb-4 block" />
          <Title level={4}>Belum ada soal</Title>
          <Paragraph className="text-on-surface/60 mb-6">Ujian ini belum memiliki soal yang dapat dikerjakan.</Paragraph>
          <Button type="primary" onClick={() => navigate(-1)} className="rounded-full">Kembali</Button>
        </Card>
      </div>
    );
  }

  const currentData = flatQuestions[currentQuestionIndex] || flatQuestions[0];
  // Also keep access to the original question for table/nested rendering (non-linked)
  const currentOriginal = questions[currentQuestionIndex];
  const totalQuestionsCount = flatQuestions.length;

  return (
    <div className="h-[100dvh] bg-surface flex flex-col font-sans transition-colors duration-500">

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
            <Text className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest block leading-tight">Simulasi Ujian</Text>
            <Text className="font-bold text-on-surface block leading-tight">Tryout {slug}</Text>
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
          <div className="hidden sm:flex items-center bg-surface-low border border-surface-container rounded-lg p-1 mr-2">
            <Button
              type={textSize === 16 ? 'primary' : 'text'}
              size="small"
              className="font-bold !text-[16px] w-8 h-8 flex items-center justify-center p-0"
              onClick={() => setTextSize(16)}
            >A</Button>
            <Button
              type={textSize === 14 ? 'primary' : 'text'}
              size="small"
              className="font-bold !text-[14px] w-8 h-8 flex items-center justify-center p-0"
              onClick={() => setTextSize(14)}
            >A</Button>
            <Button
              type={textSize === 12 ? 'primary' : 'text'}
              size="small"
              className="font-bold !text-[12px] w-8 h-8 flex items-center justify-center p-0"
              onClick={() => setTextSize(12)}
            >A</Button>
          </div>
          <Button
            type="text"
            className="flex font-bold text-on-surface/60 items-center px-2 sm:px-4"
            onClick={() => setIsMapVisible(true)}
            icon={<AppstoreOutlined />}
          >
            <span className="hidden sm:inline">Peta Soal</span>
          </Button>
          <Button type="primary" onClick={() => finishExam(false)} loading={submitting} className="font-bold shadow-md shadow-primary/20 rounded-lg">
            Selesai
          </Button>
        </div>
      </header>

      {/* EXAM BODY */}
      <main className="flex-grow overflow-y-auto flex flex-col">

        {currentData.isLinked ? (
          /* ── LINKED (PASSAGE) ── split layout: passage left, single sub-question right */
          <div key={currentData.id + '_' + currentQuestionIndex} className="flex-grow flex flex-col lg:flex-row">

            {/* Left: Passage — sticky, independent scroll */}
            <div className="lg:w-1/2 p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-surface-container bg-white/50 shrink-0 lg:shrink lg:sticky lg:top-0 lg:self-start lg:max-h-[100%] lg:overflow-y-auto">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Tag color="green" className="rounded-full border-none font-bold px-3">📖 {currentData.linkedPassageTitle || 'Teks Bacaan'}</Tag>
                {currentData.linkedGroupSize && currentData.linkedGroupSize > 1 && (
                  <Tag className="rounded-full border-none font-bold px-3 bg-surface-low text-on-surface/60">
                    Soal #{(currentData.linkedGroupStart ?? 0) + 1}–{(currentData.linkedGroupStart ?? 0) + currentData.linkedGroupSize}
                  </Tag>
                )}
              </div>
              <Title level={4} className="!font-manrope !font-black !text-xl mt-0">Teks Bacaan</Title>
              <div
                className="prose prose-p:text-on-surface/80 prose-p:leading-loose font-normal font-sans"
                style={{ fontSize: `${textSize}px` }}
                dangerouslySetInnerHTML={{ __html: renderLatex(currentData.linkedPassage || '') }}
              />
            </div>

            {/* Right: Single sub-question — independent scroll */}
            <div className="lg:w-1/2 p-6 lg:p-10 bg-white flex flex-col">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Tag className="rounded-full px-4 py-1 text-sm font-black border-none bg-surface-low text-on-surface">
                    Soal #{currentQuestionIndex + 1} <span className="opacity-60">(Teks Berhubungan {(currentData.linkedSubIndex ?? 0) + 1}/{currentData.linkedGroupSize})</span>
                  </Tag>
                  <Tag color={currentData.type === 'table' ? 'blue' : currentData.type === 'multiple' ? 'purple' : 'default'} className="rounded-full border-none font-bold text-xs">
                    {currentData.type === 'table' ? 'Tabel / Pernyataan' : currentData.type === 'multiple' ? 'Pilihan Ganda Kompleks' : 'Pilihan Ganda'}
                  </Tag>
                </div>
                <Button type="text" className="text-on-surface/40 hover:text-primary font-bold text-xs uppercase" icon={<WarningOutlined />}>Lapor Soal</Button>
              </div>

              {/* Sub-question text / prompt */}
              {currentData.question && (
                <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-surface-container mb-6">
                  <div
                    className="prose prose-p:text-on-surface/90 prose-p:leading-loose max-w-none text-on-surface font-normal font-sans"
                    style={{ fontSize: `${textSize}px` }}
                    dangerouslySetInnerHTML={{ __html: renderLatex(currentData.question) }}
                  />
                </div>
              )}

              {/* IF SUB QUESTION IS TABLE */}
              {currentData.type === 'table' ? (
                <div className="bg-white rounded-3xl shadow-sm border border-surface-container overflow-hidden mb-6">
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-surface-low/95 backdrop-blur-sm shadow-sm border-b border-surface-container">
                        <tr>
                          <th className="p-4 sm:p-5 font-black text-sm sm:text-base text-on-surface">
                            {currentData.title || 'Pernyataan'}
                          </th>
                          {(currentData.options && currentData.options.length > 0 ? currentData.options : ['Benar', 'Salah']).map((col, cIdx) => (
                            <th key={cIdx} className="p-4 sm:p-5 font-black text-sm sm:text-base text-center text-on-surface w-28 sm:w-36 border-l border-surface-container/60">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container/60">
                        {(currentData.rows || []).map((row: any, rIdx: number) => {
                          const answerKey = `${currentData.id}_${row.id || rIdx}`;
                          const currentAnsArr = answers[answerKey] || [];
                          const colList = currentData.options && currentData.options.length > 0 ? currentData.options : ['Benar', 'Salah'];
                          return (
                            <tr
                              key={row.id || rIdx}
                              className={`transition-colors ${rIdx % 2 === 0 ? 'bg-white' : 'bg-surface-lowest/50'} hover:bg-surface-low/50`}
                            >
                              <td className="p-4 sm:p-5 align-middle">
                                <div
                                  className="prose prose-p:text-on-surface/90 font-medium font-sans text-sm sm:text-base"
                                  style={{ fontSize: `${textSize}px` }}
                                  dangerouslySetInnerHTML={{ __html: renderLatex(row.question || `Pernyataan #${rIdx + 1}`) }}
                                />
                              </td>
                              {colList.map((_, cIdx) => {
                                const isSelected = currentAnsArr.includes(cIdx);
                                return (
                                  <td
                                    key={cIdx}
                                    onClick={() => handleSelectOption(answerKey, 'single', cIdx)}
                                    className={`p-4 sm:p-5 text-center align-middle border-l border-surface-container/60 cursor-pointer transition-all ${isSelected ? 'bg-primary/10' : 'hover:bg-surface-low'}`}
                                  >
                                    <div className="flex justify-center items-center">
                                      <div
                                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                                          isSelected
                                            ? 'border-primary bg-primary text-white shadow-sm'
                                            : 'border-on-surface/30 bg-white hover:border-primary/60'
                                        }`}
                                      >
                                        {isSelected && (
                                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white" />
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : currentData.type === 'multiple' ? (
                /* MULTIPLE CHOICE OPTIONS */
                <div className="space-y-4">
                  {(currentData.options || []).filter(opt => opt && opt.trim() !== '').map((opt, idx) => {
                    const currentAnsArr = answers[currentData.id] || [];
                    const isSelected = currentAnsArr.includes(idx);
                    const label = String.fromCharCode(65 + idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectOption(currentData.id, 'multiple', idx)}
                        className={`rounded-xl flex items-center cursor-pointer transition-all border ${sizeClasses.nestedPadding} ${isSelected ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(0,83,221,0.2)]' : 'border-surface-container bg-surface-lowest hover:border-primary/50'}`}
                      >
                        <div className={`rounded-md flex items-center justify-center font-bold shrink-0 transition-colors ${sizeClasses.nestedCircleSize} ${isSelected ? 'bg-primary text-white' : 'bg-surface-low text-on-surface/60'}`}>
                          {isSelected ? '✓' : label}
                        </div>
                        <span
                          className={`font-normal font-sans ml-3 ${isSelected ? 'text-primary font-medium' : 'text-on-surface/80'}`}
                          style={{ fontSize: `${textSize}px` }}
                          dangerouslySetInnerHTML={{ __html: renderLatex(opt) }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* SINGLE CHOICE OPTIONS */
                <div className="space-y-4">
                  {(currentData.options || []).filter(opt => opt && opt.trim() !== '').map((opt, idx) => {
                    const currentAnsArr = answers[currentData.id] || [];
                    const isSelected = currentAnsArr.includes(idx);
                    const label = String.fromCharCode(65 + idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectOption(currentData.id, 'single', idx)}
                        className={`rounded-xl flex items-center cursor-pointer transition-all border ${sizeClasses.nestedPadding} ${isSelected ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(0,83,221,0.2)]' : 'border-surface-container bg-surface-lowest hover:border-primary/50'}`}
                      >
                        <div className={`rounded-full flex items-center justify-center font-bold shrink-0 transition-colors ${sizeClasses.nestedCircleSize} ${isSelected ? 'bg-primary text-white' : 'bg-surface-low text-on-surface/60'}`}>
                          {label}
                        </div>
                        <span
                          className={`font-normal font-sans ml-3 ${isSelected ? 'text-primary font-medium' : 'text-on-surface/80'}`}
                          style={{ fontSize: `${textSize}px` }}
                          dangerouslySetInnerHTML={{ __html: renderLatex(opt) }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        ) : currentData.type === 'table' ? (
          /* ── TABLE / MATRIX ── split 40/60 layout */
          <div key={currentData.id} className="flex-grow flex flex-col lg:flex-row">

            {/* Left: Question text / prompt (40% width, sticky/independent scroll) */}
            <div className="lg:w-[40%] p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-surface-container bg-white/50 flex flex-col">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Tag className="rounded-full px-4 py-1 text-sm font-black border-none bg-surface-low text-on-surface">
                  Soal #{currentQuestionIndex + 1}
                </Tag>
                <Tag color="blue" className="rounded-full border-none font-bold px-3">Tabel / Pernyataan</Tag>
                {currentData.title && (
                  <Tag color="cyan" className="rounded-full border-none font-bold px-3">{currentData.title}</Tag>
                )}
              </div>

              <Title level={4} className="!font-manrope !font-black !text-xl mt-0 mb-4">Pertanyaan</Title>

              <div
                className="prose prose-p:text-on-surface/90 prose-p:leading-loose text-on-surface font-normal font-sans"
                style={{ fontSize: `${textSize}px` }}
                dangerouslySetInnerHTML={{ __html: renderLatex(currentData.question) }}
              />
            </div>

            {/* Right: Interactive Table (60% width) */}
            <div className="lg:w-[60%] p-6 lg:p-10 bg-white flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <Text className="text-xs font-black uppercase tracking-wider text-on-surface/50">
                  Pilih salah satu jawaban untuk tiap baris pernyataan:
                </Text>
                <Button type="text" className="text-on-surface/40 hover:text-primary font-bold text-xs uppercase" icon={<WarningOutlined />}>Lapor Soal</Button>
              </div>

              {/* Interactive Table */}
              <div key={currentData.id} className="bg-white rounded-3xl shadow-sm border border-surface-container overflow-hidden mb-6">
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-surface-low/95 backdrop-blur-sm shadow-sm border-b border-surface-container">
                      <tr>
                        <th className="p-4 sm:p-5 font-black text-sm sm:text-base text-on-surface">
                          {currentData.title || 'Pernyataan'}
                        </th>
                        {(currentData.options && currentData.options.length > 0 ? currentData.options : ['Benar', 'Salah']).map((col, cIdx) => (
                          <th key={cIdx} className="p-4 sm:p-5 font-black text-sm sm:text-base text-center text-on-surface w-28 sm:w-36 border-l border-surface-container/60">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container/60">
                      {currentData.sub_questions?.map((sub, sIdx) => {
                        // Namespace key: "parentId_subId" to avoid collision when different table questions share sub IDs
                        const answerKey = `${currentData.id}_${sub.id || sIdx}`;
                        const currentAnsArr = answers[answerKey] || [];
                        const colList = currentData.options && currentData.options.length > 0 ? currentData.options : ['Benar', 'Salah'];
                        return (
                          <tr key={answerKey} className="hover:bg-surface-low/20 transition-colors">
                            {/* Statement Cell */}
                            <td className="p-4 sm:p-5 align-middle">
                              <div
                                className="font-normal text-on-surface/90 leading-relaxed font-sans"
                                style={{ fontSize: `${textSize}px` }}
                                dangerouslySetInnerHTML={{ __html: renderLatex(sub.question) }}
                              />
                            </td>

                            {/* Radio Options Cells */}
                            {colList.map((colName, cIdx) => {
                              const isSelected = currentAnsArr.includes(cIdx);
                              return (
                                <td
                                  key={cIdx}
                                  onClick={() => handleSelectOption(answerKey, 'single', cIdx)}
                                  className={`p-4 sm:p-5 text-center align-middle cursor-pointer transition-all border-l border-surface-container/60 ${isSelected ? 'bg-primary/5' : 'hover:bg-surface-low/40'
                                    }`}
                                >
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    <div
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all border-2 ${isSelected
                                          ? 'border-primary bg-primary text-white shadow-md shadow-primary/20 scale-105'
                                          : 'border-on-surface/20 bg-surface-lowest text-on-surface/40 hover:border-primary/50'
                                        }`}
                                    >
                                      {isSelected ? (
                                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                      ) : (
                                        <span className="text-[10px] font-bold sm:hidden">{String.fromCharCode(65 + cIdx)}</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>


            </div>
          </div>

        ) : currentData.type === 'nested' ? (
          /* ── SCENARIO / NESTED ── split layout with sticky left panel */
          <div className="flex-grow flex flex-col lg:flex-row">

            {/* Left: Scenario passage — sticky, independent scroll */}
            <div className="lg:w-1/2 p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-surface-container bg-white/50 shrink-0 lg:shrink lg:sticky lg:top-0 lg:self-start lg:max-h-[100%] lg:overflow-y-auto">
              <Tag color="blue" className="mb-4 rounded-full border-none font-bold px-3">{currentData.title || 'Skenario'}</Tag>
              <Title level={4} className="!font-manrope !font-black !text-xl mt-0">Skenario Kasus</Title>
              <div
                className="prose prose-p:text-on-surface/80 prose-p:leading-loose font-normal font-sans"
                style={{ fontSize: `${textSize}px` }}
                dangerouslySetInnerHTML={{ __html: renderLatex(currentData.question) }}
              />
            </div>

            {/* Right: Sub-questions — independent scroll */}
            <div className="lg:w-1/2 p-6 lg:p-10 bg-white flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <Tag className="rounded-full px-4 py-1 text-sm font-black border-none bg-surface-low text-on-surface">
                  Soal #{currentQuestionIndex + 1} <span className="opacity-60">(Skenario)</span>
                </Tag>
                <Button type="text" className="text-on-surface/40 hover:text-primary font-bold text-xs uppercase" icon={<WarningOutlined />}>Lapor Soal</Button>
              </div>

              <div className="space-y-12">
                {currentData.sub_questions?.map((sub, sIndex) => {
                  const currentAnsArr = answers[sub.id] || [];
                  return (
                    <div key={sub.id} className="border-b border-surface-container pb-8 last:border-0">
                      <div className="flex items-start gap-2 leading-relaxed text-on-surface font-normal mb-6 font-sans" style={{ fontSize: `${textSize}px` }}>
                        <div className="font-black mt-[0.1em]">{sIndex + 1}.</div>
                        <div className="flex-1 min-w-0 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: renderLatex(sub.question) }} />
                      </div>
                      <div className="space-y-3 mb-4">
                        {sub.options.map((opt: string, idx: number) => ({ opt, idx })).filter(({ opt }: { opt: string }) => opt && opt.trim() !== '').map(({ opt, idx }: { opt: string; idx: number }) => {
                          const isSelected = currentAnsArr.includes(idx);
                          const label = String.fromCharCode(65 + idx);
                          return (
                            <div
                              key={idx}
                              onClick={() => handleSelectOption(sub.id, sub.type || 'single', idx)}
                              className={`rounded-xl flex items-center cursor-pointer transition-all border ${sizeClasses.nestedPadding} ${isSelected ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(0,83,221,0.2)]' : 'border-surface-container bg-surface-lowest hover:border-primary/50'}`}
                            >
                              <div className={`rounded-full flex items-center justify-center font-bold shrink-0 transition-colors ${sizeClasses.nestedCircleSize} ${isSelected ? 'bg-primary text-white' : 'bg-surface-low text-on-surface/60'}`}>
                                {label}
                              </div>
                              <span
                                className={`font-normal font-sans ${isSelected ? 'text-primary font-medium' : 'text-on-surface/80'}`}
                                style={{ fontSize: `${textSize}px` }}
                                dangerouslySetInnerHTML={{ __html: renderLatex(opt) }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>


            </div>
          </div>

        ) : (
          /* ── SINGLE / MULTIPLE ── full-width single column, scrollable */
          <div className="overflow-y-auto flex-grow">
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 lg:py-12 flex flex-col gap-8">
              {/* Question header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tag className="rounded-full px-4 py-1 text-sm font-black border-none bg-surface-low text-on-surface">
                    Soal #{currentQuestionIndex + 1}
                  </Tag>
                  {currentData.type === 'multiple' && (
                    <Tag color="blue" className="rounded-full border-none font-bold px-3">Pilih lebih dari satu</Tag>
                  )}
                </div>
                <Button type="text" className="text-on-surface/40 hover:text-primary font-bold text-xs uppercase" icon={<WarningOutlined />}>Lapor Soal</Button>
              </div>

              {currentData.type === 'multiple' && (
                <Alert
                  message="Perhatian"
                  description="Jawaban bisa lebih dari satu. Pilih semua jawaban yang menurut Anda benar."
                  type="info"
                  showIcon
                  closable={true}
                  className="rounded-[1rem] font-bold border-blue-200 bg-blue-50/50"
                />
              )}

              {/* Question text – full width, large */}
              <div className="bg-white rounded-[2rem] p-6 lg:p-10 shadow-sm border border-surface-container">
                {currentData.title && (
                  <Tag color="blue" className="mb-4 rounded-full border-none font-bold px-3">{currentData.title}</Tag>
                )}
                <div
                  className="prose prose-p:text-on-surface/90 prose-p:leading-loose max-w-none text-on-surface font-normal font-sans"
                  style={{ fontSize: `${textSize}px` }}
                  dangerouslySetInnerHTML={{ __html: renderLatex(currentData.question) }}
                />
              </div>

              {/* Options – full width */}
              <div className="space-y-4">
                {currentData.options.map((opt, idx) => ({ opt, idx })).filter(({ opt }) => opt && opt.trim() !== '').map(({ opt, idx }) => {
                  const currentAnsArr = answers[currentData.id] || [];
                  const isSelected = currentAnsArr.includes(idx);
                  const label = String.fromCharCode(65 + idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectOption(currentData.id, currentData.type, idx)}
                      className={`
                      rounded-2xl flex items-center cursor-pointer transition-all border-2 ${sizeClasses.containerPadding}
                      ${isSelected
                          ? 'border-primary bg-primary/5 shadow-[0_0_0_3px_rgba(0,83,221,0.15)]'
                          : 'border-surface-container bg-white hover:border-primary/40 hover:bg-primary/[0.02]'
                        }
                    `}
                    >
                      <div className={`
                      flex items-center justify-center font-black shrink-0 transition-colors ${sizeClasses.circleSize}
                      ${currentData.type === 'multiple' ? 'rounded-lg' : 'rounded-full'}
                      ${isSelected ? 'bg-primary text-white' : 'bg-surface-low text-on-surface/60'}
                    `}>
                        {isSelected && currentData.type === 'multiple' ? '✓' : label}
                      </div>
                      <span
                        className={`font-normal font-sans leading-relaxed ${isSelected ? 'text-primary font-medium' : 'text-on-surface/80'}`}
                        style={{ fontSize: `${textSize}px` }}
                        dangerouslySetInnerHTML={{ __html: renderLatex(opt) }}
                      />
                    </div>
                  );
                })}
              </div>


            </div>

          </div>
        )}

      </main>


      {/* EXAM FOOTER — fixed bottom bar */}
      <footer className="bg-white border-t border-surface-container p-4 shrink-0 relative z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Button
            size="large"
            type="text"
            icon={<LeftOutlined />}
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className="font-bold text-on-surface/80"
          >
            Kembali
          </Button>

          {/* Center: Ragu-ragu + mobile Peta Soal */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => toggleDoubtful(currentData.id)}
              className={`flex items-center gap-2.5 cursor-pointer rounded-xl border-2 px-4 py-2 transition-all select-none ${doubtfulQuestions[currentData.id]
                  ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                  : 'border-surface-container bg-surface-low/40 text-on-surface/60 hover:border-yellow-300 hover:bg-yellow-50/50'
                }`}
            >
              <span className={`text-lg transition-transform ${doubtfulQuestions[currentData.id] ? 'scale-110' : ''
                }`}>🚩</span>
              <span className="font-bold text-sm hidden sm:inline">
                {doubtfulQuestions[currentData.id] ? 'Ditandai Ragu-ragu' : 'Tandai Ragu-ragu'}
              </span>
            </div>

          </div>

          <Button
            size="large"
            type="primary"
            icon={<RightOutlined />}
            iconPosition="end"
            onClick={() => setCurrentQuestionIndex(prev => prev < totalQuestionsCount - 1 ? prev + 1 : prev)}
            disabled={currentQuestionIndex === totalQuestionsCount - 1}
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
        <div className="flex gap-4 items-center mb-6 text-xs text-on-surface/60 flex-wrap">
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-primary rounded-full"></div> Selesai</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-400 rounded-full"></div> Ragu-ragu</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 border border-surface-container rounded-full"></div> Kosong</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-400 rounded-full"></div> Teks Berhubungan</span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {flatQuestions.map((q, i) => {
            const num = i + 1;

            // Check if answered
            let isAnswered = false;
            if (!q.isLinked && (q.type === 'nested' || q.type === 'table') && q.sub_questions) {
              isAnswered = q.sub_questions.some((sq: any, sqIdx: number) => (answers[`${q.id}_${sq.id || sqIdx}`] || []).length > 0);
            } else if (q.isLinked && q.type === 'table' && q.rows && q.rows.length > 0) {
              isAnswered = q.rows.some((r: any, rIdx: number) => (answers[`${q.id}_${r.id || rIdx}`] || []).length > 0);
            } else {
              isAnswered = (answers[q.id] || []).length > 0;
            }

            const isDoubtful = doubtfulQuestions[q.id];
            const isCurrent = currentQuestionIndex === i;
            // Visual grouping: linked questions get a green outline
            const isLinkedQ = q.isLinked;
            const isFirstInGroup = isLinkedQ && q.linkedSubIndex === 0;
            const isLastInGroup = isLinkedQ && q.linkedSubIndex === (q.linkedGroupSize! - 1);

            return (
              <button
                key={q.id + '_' + i}
                onClick={() => {
                  setCurrentQuestionIndex(i);
                  setIsMapVisible(false);
                }}
                title={isLinkedQ ? `Teks Berhubungan — ${q.linkedPassageTitle || 'Passage'}` : undefined}
                className={`
                  aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all relative
                  ${isCurrent ? 'ring-2 ring-primary scale-110 shadow-md' : ''}
                  ${isDoubtful ? 'bg-yellow-400 text-yellow-900 border-yellow-500'
                    : isAnswered ? (isLinkedQ ? 'bg-green-500 text-white' : 'bg-primary text-white border-primary')
                      : isLinkedQ ? 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100'
                        : 'bg-white text-on-surface border border-surface-container hover:bg-surface-low'
                  }
                `}
              >
                {num}
                {isLinkedQ && !isAnswered && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-white" />
                )}
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
          <Space size="middle" className="flex justify-center flex-wrap">
            <Button size="large" className="rounded-xl font-bold" onClick={() => setIsExitModalVisible(false)}>
              Batal
            </Button>
            <Button 
              size="large" 
              className="rounded-xl font-bold border-primary text-primary hover:bg-primary/5" 
              onClick={() => {
                setIsExitModalVisible(false);
                message.info("Sesi ujian disimpan secara otomatis. Anda bisa melanjutkannya nanti.");
                navigate('/');
              }}
            >
              Simpan & Lanjut Nanti
            </Button>
            <Button size="large" type="primary" danger className="rounded-xl font-bold shadow-lg shadow-red-500/20" onClick={() => {
              setIsExitModalVisible(false);
              finishExam(false);
            }}>
              Akhiri & Kumpulkan
            </Button>
          </Space>
        </div>
      </Modal>

    </div>
  );
};

export default ExamSimulation;
