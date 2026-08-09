import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import KantanEditor from '../../components/atoms/KantanEditor';
import { renderContent, renderQuillHtml } from '../../utils/renderContent';
import {
  deletePackageMaterial,
  deletePackageVideo,
  getPackageMaterials,
  getPackageQuestions,
  getPackageVideos,
  savePackageMaterial,
  savePackageQuestion,
  savePackageQuestions,
  savePackageVideo,
} from '../../services/packageService';
import {
  Tabs, Card, Form, Input, Button, Upload, Typography, Tag,
  Space, Divider, Modal, message, Switch, Row, Col,
  Radio, Checkbox, Select, Badge, Empty, InputNumber,
} from 'antd';
import {
  ArrowLeftOutlined, ExperimentOutlined, FileSearchOutlined,
  VideoCameraOutlined, PlusOutlined, DeleteOutlined,
  FilePdfOutlined, SaveOutlined, EyeOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';

const { Title, Text } = Typography;

// ─── TYPES ──────────────────────────────────────────────────
type QuestionType = 'single' | 'multiple' | 'nested';
type ScoringMethod = 'all_or_nothing' | 'partial';

interface SubQuestion {
  id: string;
  type?: QuestionType;
  question: string;
  discussion: string;
  options: string[];
  correct: number;
  points: number;
}

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  question: string;
  discussion: string;
  options: string[];
  correct: number | number[];
  discussionRefs: string[];
  points: number;
  scoringMethod: ScoringMethod;
  subQuestions?: SubQuestion[];
}

interface Material {
  id: string;
  title: string;
  category: string;
  content: string;
  attachments?: string[];
}

interface VideoMaterial {
  id: string;
  title: string;
  duration: string;
  url: string;
  description: string;
  media_type?: string;
}

// ─── HELPERS ───────────────────

const stripHtml = (value: string): string =>
  value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

const hasPreviewContent = (value?: string): boolean => Boolean(value && stripHtml(value).length > 0);

const getCorrectIndexes = (correct: number | number[] | undefined): number[] => {
  if (Array.isArray(correct)) return correct.map(Number).filter(Number.isFinite);
  if (typeof correct === 'number' && Number.isFinite(correct)) return [correct];
  return [];
};

const normalizeCorrectForType = (type: QuestionType, correct: number | number[] | undefined): number | number[] => {
  const indexes = getCorrectIndexes(correct);
  if (type === 'multiple') return indexes;
  return indexes[0] ?? 0;
};

// ─── MAIN COMPONENT ──────────────────────────────────────────
const AdminPackageSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const packageName = id?.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') ?? 'Paket';

  // ── STATE: Questions ──
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', type: 'single', title: '', question: 'Contoh pertanyaan pertama...', discussion: '', options: ['', '', '', '', ''], correct: 0, discussionRefs: [], points: 1, scoringMethod: 'all_or_nothing' },
  ]);
  const [activeQIndex, setActiveQIndex] = useState(0);
  const activeQ = questions[activeQIndex];

  const getScenarioPoints = (question: Question) =>
    (question.subQuestions || []).reduce((sum, sub) => sum + (Number(sub.points) || 0), 0);

  const getEffectivePoints = (question: Question) =>
    question.type === 'nested' ? getScenarioPoints(question) : question.points;

  const serializeQuestion = (question: Question) => ({
    id: question.id,
    type: question.type,
    title: question.title,
    question: question.question,
    discussion: question.discussion,
    options: question.options,
    correct: normalizeCorrectForType(question.type, question.correct),
    discussion_refs: question.discussionRefs,
    points: getEffectivePoints(question),
    scoring_method: question.type === 'multiple' ? question.scoringMethod : 'all_or_nothing' as ScoringMethod,
    sub_questions: (question.subQuestions || []).map(sub => ({
      id: sub.id,
      type: sub.type || 'single' as QuestionType,
      question: sub.question,
      discussion: sub.discussion,
      options: sub.options,
      correct: normalizeCorrectForType(sub.type || 'single', sub.correct),
      points: sub.points,
    })),
  });

  const deserializeQuestion = (question: any): Question => ({
    id: question.id,
    type: question.type,
    title: question.title,
    question: question.question,
    discussion: question.discussion,
    options: question.options,
    correct: normalizeCorrectForType(question.type, question.correct),
    discussionRefs: question.discussion_refs,
    points: question.points,
    scoringMethod: question.scoring_method || 'all_or_nothing',
    subQuestions: (question.sub_questions || []).map((sub: any) => ({
      ...sub,
      type: sub.type || 'single',
      correct: normalizeCorrectForType(sub.type || 'single', sub.correct),
    })),
  });

  useEffect(() => {
    if (!id) return;
    getPackageQuestions(id)
      .then(data => {
        if (data.length > 0) {
          setQuestions(data.map(deserializeQuestion));
          setActiveQIndex(0);
        }
      })
      .catch(() => {
        message.warning('Belum bisa mengambil data soal dari backend. Editor memakai data lokal sementara.');
      });

    getPackageMaterials(id)
      .then(data => {
        if (data.length > 0) {
          setMaterials(data);
          setActiveMIndex(0);
        }
      })
      .catch(() => {
        message.warning('Belum bisa mengambil data materi dari backend. Editor memakai data lokal sementara.');
      });

    getPackageVideos(id)
      .then(data => {
        if (data.length > 0) {
          setVideos(data);
          setActiveVIndex(0);
        }
      })
      .catch(() => {
        message.warning('Belum bisa mengambil data video dari backend. Editor memakai data lokal sementara.');
      });
  }, [id]);

  // ── STATE: Materials ──
  // const [materials] = useState<Material[]>([
  //   { id: 'm1', title: 'Konsep Turunan Dasar' },
  //   { id: 'm2', title: 'Aplikasi Integral dalam Luas' },
  //   { id: 'm3', title: 'Strategi Eliminasi Jawaban' },
  // ]);

  // ── ACTIONS: Questions ──
  const addQuestion = () => {
    const newQ: Question = {
      id: Date.now().toString(),
      type: 'single',
      title: '',
      question: '',
      discussion: '',
      options: ['', '', '', '', ''],
      correct: 0,
      discussionRefs: [],
      points: 1,
      scoringMethod: 'all_or_nothing',
    };
    setQuestions([...questions, newQ]);
    setActiveQIndex(questions.length);
  };

  const updateActiveQ = (changes: Partial<Question>) => {
    setQuestions(prev => prev.map((q, i) => i === activeQIndex ? { ...q, ...changes } : q));
  };

  const addSubQuestion = () => {
    const sub: SubQuestion = { id: Date.now().toString(), type: 'single', question: '', discussion: '', options: ['', '', '', '', ''], correct: 0, points: 1 };
    updateActiveQ({ subQuestions: [...(activeQ.subQuestions || []), sub] });
  };

  const saveActiveQuestion = async () => {
    if (!id) return;
    try {
      const saved = await savePackageQuestion(id, serializeQuestion(activeQ));
      updateActiveQ(deserializeQuestion(saved));
      message.success(`Soal #${activeQIndex + 1} berhasil disimpan!`);
    } catch {
      message.error('Gagal menyimpan soal ke backend.');
    }
  };

  const saveAllQuestions = async () => {
    if (!id) return;
    try {
      const saved = await savePackageQuestions(id, questions.map(serializeQuestion));
      setQuestions(saved.map(deserializeQuestion));
      message.success('Semua soal berhasil disimpan ke backend.');
    } catch {
      message.error('Gagal menyimpan semua soal ke backend.');
    }
  };

  const confirmRemoveQuestion = () => {
    if (questions.length === 1) return;
    Modal.confirm({
      title: `Hapus Soal ${activeQIndex + 1}?`,
      content: 'Yakin ingin menghapus soal ini? Perubahan akan tersimpan setelah kamu klik Simpan Semua.',
      okText: 'Ya, hapus',
      cancelText: 'Batal',
      okButtonProps: { danger: true },
      onOk: () => {
        const next = questions.filter((_, i) => i !== activeQIndex);
        setQuestions(next);
        setActiveQIndex(Math.max(0, activeQIndex - 1));
      },
    });
  };

  const updateOption = (optIndex: number, val: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== activeQIndex) return q;
      return {
        ...q,
        options: q.options.map((option, optionIndex) => optionIndex === optIndex ? val : option),
      };
    }));
  };

  const toggleCorrect = (index: number) => {
    if (activeQ.type === 'single') {
      updateActiveQ({ correct: index });
    } else if (activeQ.type === 'multiple') {
      const current = getCorrectIndexes(activeQ.correct);
      const next = current.includes(index) ? current.filter(i => i !== index) : [...current, index];
      updateActiveQ({ correct: next });
    }
  };

  // ── TAB 2: Materials State ──
  const [materials, setMaterials] = useState<Material[]>([
    { id: 'm1', title: 'Konsep Turunan Dasar', category: 'Matematika', content: '## Materi Pembahasan\n\nTulis di sini...' },
  ]);
  const [activeMIndex, setActiveMIndex] = useState(0);
  const activeM = materials[activeMIndex];
  const [previewMode, setPreviewMode] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<UploadFile[]>([]);

  const addMaterial = () => {
    const newM: Material = {
      id: Date.now().toString(),
      title: 'Materi Baru',
      category: 'Umum',
      content: '',
    };
    setMaterials([...materials, newM]);
    setActiveMIndex(materials.length);
  };

  const updateActiveM = (changes: Partial<Material>) => {
    setMaterials(prev => prev.map((m, i) => i === activeMIndex ? { ...m, ...changes } : m));
  };

  const saveActiveMaterial = async () => {
    if (!id || !activeM) return;
    try {
      const saved = await savePackageMaterial(id, activeM);
      setMaterials(prev => prev.map((m, i) => i === activeMIndex ? saved : m));
      message.success('Materi pembahasan berhasil disimpan!');
    } catch {
      message.error('Gagal menyimpan materi ke backend.');
    }
  };

  const removeMaterial = async (index: number) => {
    const material = materials[index];
    const next = materials.filter((_, i) => i !== index);
    setMaterials(next);
    setActiveMIndex(Math.max(0, index - 1));
    if (!id || !material) return;
    try {
      await deletePackageMaterial(id, material.id);
    } catch {
      message.error('Gagal menghapus materi dari backend.');
    }
  };

  const confirmRemoveMaterial = (index: number) => {
    const material = materials[index];
    Modal.confirm({
      title: 'Hapus Materi?',
      content: `Yakin ingin menghapus "${material?.title || 'Materi ini'}"?`,
      okText: 'Ya, hapus',
      cancelText: 'Batal',
      okButtonProps: { danger: true },
      onOk: () => removeMaterial(index),
    });
  };

  // ── TAB 3: Video State ──
  const [videos, setVideos] = useState<VideoMaterial[]>([
    { id: '1', title: 'Video Pengenalan', duration: '05:00', url: '', description: 'Tulis deskripsi video di sini...', media_type: 'video' }
  ]);
  const [activeVIndex, setActiveVIndex] = useState(0);
  const activeV = videos[activeVIndex];
  const addVideo = () => {
    const newV = { id: Date.now().toString(), title: 'Video Baru', duration: '', url: '', description: '', media_type: 'video' };
    setVideos([...videos, newV]);
    setActiveVIndex(videos.length);
  };
  const updateActiveV = (changes: any) => {
    setVideos(prev => prev.map((v, i) => i === activeVIndex ? { ...v, ...changes } : v));
  };
  const saveActiveVideo = async () => {
    if (!id || !activeV) return;
    try {
      const saved = await savePackageVideo(id, activeV);
      setVideos(prev => prev.map((v, i) => i === activeVIndex ? saved : v));
      message.success('Video berhasil diperbarui!');
    } catch {
      message.error('Gagal menyimpan video ke backend.');
    }
  };

  const removeVideo = async (index: number) => {
    const video = videos[index];
    const next = videos.filter((_, i) => i !== index);
    setVideos(next);
    setActiveVIndex(Math.max(0, index - 1));
    if (!id || !video) return;
    try {
      await deletePackageVideo(id, video.id);
    } catch {
      message.error('Gagal menghapus video dari backend.');
    }
  };

  const confirmRemoveVideo = (index: number) => {
    const video = videos[index];
    Modal.confirm({
      title: 'Hapus Video?',
      content: `Yakin ingin menghapus "${video?.title || 'Video ini'}"?`,
      okText: 'Ya, hapus',
      cancelText: 'Batal',
      okButtonProps: { danger: true },
      onOk: () => removeVideo(index),
    });
  };

  // ── COMPONENT: Sub-Question Editor ──
  const SubQuestionEditor: React.FC<{ sub: SubQuestion, index: number }> = ({ sub, index }) => (
    <div className="p-5 bg-white dark:bg-zinc-800/80 rounded-xl border border-on-surface/5 mb-6 relative group shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Tag className="rounded-lg bg-primary text-white border-none font-black px-4 py-1">Pertanyaan {index + 1}</Tag>
          <div className="flex items-center gap-2 px-3 py-1 bg-on-surface/5 rounded-lg border border-on-surface/10">
            <Text className="text-[10px] font-black uppercase text-on-surface/40">Poin</Text>
            <InputNumber
              size="small"
              min={0}
              value={sub.points}
              onChange={val => {
                const next = activeQ.subQuestions?.map(s => s.id === sub.id ? { ...s, points: Number(val) || 0 } : s);
                updateActiveQ({ subQuestions: next });
              }}
              className="w-16 rounded-lg font-bold text-xs"
              controls={false}
            />
          </div>
        </div>
        <Button danger type="text" icon={<DeleteOutlined />} size="small" className="hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => {
          updateActiveQ({ subQuestions: activeQ.subQuestions?.filter(s => s.id !== sub.id) });
        }} />
      </div>

      <div className="mb-6">
        <KantanEditor
          value={sub.question}
          onChange={val => {
            const next = activeQ.subQuestions?.map(s => s.id === sub.id ? { ...s, question: val } : s);
            updateActiveQ({ subQuestions: next });
          }}
          placeholder="Tulis pertanyaan sub-soal di sini..."
          rows={3}
          label={`Pertanyaan #${index + 1}`}
        />
        {sub.question && (
            <div className="mt-3 p-3 rounded-lg bg-surface-low/20 dark:bg-zinc-900/30 border border-dashed border-on-surface/10">
            <div className="prose prose-xs dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderContent(sub.question) }} />
          </div>
        )}
      </div>

      <div className="mb-6">
        <Text className="text-[10px] font-black uppercase text-on-surface/40 block mb-2">Pembahasan Singkat Sub-Soal</Text>
        <KantanEditor
          value={sub.discussion}
          onChange={val => {
            const next = activeQ.subQuestions?.map(s => s.id === sub.id ? { ...s, discussion: val } : s);
            updateActiveQ({ subQuestions: next });
          }}
          placeholder="Tulis pembahasan singkat sub-soal di sini..."
          rows={3}
          label={`Pembahasan #${index + 1}`}
        />
        {sub.discussion && (
            <div className="mt-3 p-3 rounded-lg bg-green-500/5 dark:bg-green-900/10 border border-dashed border-green-500/20">
            <div className="prose prose-xs dark:prose-invert max-w-none text-green-700 dark:text-green-300" dangerouslySetInnerHTML={{ __html: renderContent(sub.discussion) }} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sub.options.map((opt, oi) => (
          <div key={oi} className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <div
                onClick={() => {
                  const next = activeQ.subQuestions?.map(s => s.id === sub.id ? { ...s, correct: oi } : s);
                  updateActiveQ({ subQuestions: next });
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs cursor-pointer border-2 shadow-sm transition-all shrink-0 mt-1
                  ${sub.correct === oi ? 'bg-green-500 border-green-500 text-white' : 'bg-white dark:bg-zinc-700 border-on-surface/10 text-on-surface/40'}`}
              >
                {String.fromCharCode(65 + oi)}
              </div>
              <KantanEditor
                value={opt}
                onChange={val => {
                  const next = activeQ.subQuestions?.map(s => s.id === sub.id ? {
                    ...s, options: s.options.map((o, idx) => idx === oi ? val : o)
                  } : s);
                  updateActiveQ({ subQuestions: next });
                }}
                placeholder={`Opsi ${String.fromCharCode(65 + oi)}`}
                rows={2}
                className="flex-1"
              />
            </div>
            {(opt.includes('$') || opt.includes('<')) && (
              <div className="ml-10 px-3 py-1 bg-primary/5 rounded-lg border-l-2 border-primary/20 text-[11px] prose-tight" dangerouslySetInnerHTML={{ __html: renderContent(opt) }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const tabItems = [
    {
      key: 'soal',
      label: <span className="flex items-center gap-2"><ExperimentOutlined /> Soal ({questions.length})</span>,
      children: (
        <div className="py-6 px-1">
          <Row gutter={24}>
            <Col xs={24} md={6}>
              <Card className="weightless-card border-none bg-surface-low/30 dark:bg-zinc-900 shadow-sm rounded-3xl p-3">
                <div className="flex items-center justify-between px-2 mb-4">
                  <Text className="text-[10px] uppercase font-black tracking-widest text-on-surface/40">Daftar Soal</Text>
                  <Button type="primary" ghost size="small" icon={<PlusOutlined />} onClick={addQuestion} className="rounded-lg font-bold text-[10px] h-7">Tambah</Button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, i) => (
                    <div
                      key={q.id}
                      onClick={() => setActiveQIndex(i)}
                      className={`h-10 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer transition-all border-2
                        ${activeQIndex === i
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                          : 'bg-white dark:bg-zinc-800 border-transparent text-on-surface/60 hover:border-primary/30'}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                  <div onClick={addQuestion} className="h-10 rounded-xl border-2 border-dashed border-primary/20 flex items-center justify-center text-primary/40 hover:text-primary hover:border-primary/40 cursor-pointer transition-all">
                    <PlusOutlined />
                  </div>
                </div>
                <Divider className="my-4 border-on-surface/5" />
                <div className="space-y-4 px-2">
                  <div className="flex items-center justify-between">
                    <Text className="text-xs text-on-surface/60">Tipe Aktif</Text>
                    <Tag className="rounded-lg border-none bg-primary/10 text-primary font-bold capitalize m-0">{activeQ.type}</Tag>
                  </div>
                  <Button danger ghost block icon={<DeleteOutlined />} size="small" className="rounded-lg font-bold h-9"
                    onClick={confirmRemoveQuestion}>
                    Hapus Soal {activeQIndex + 1}
                  </Button>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={18}>
              <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-md rounded-[2.5rem] p-4 lg:p-8">
                <Row gutter={20} className="mb-8">
                  <Col span={8}>
                    <Text className="text-xs font-black uppercase tracking-widest text-on-surface/40 block mb-2">Tipe Soal</Text>
                    <Select
                      className="w-full rounded-xl"
                      style={{ height: 44 }}
                        value={activeQ.type}
                        onChange={val => updateActiveQ({
                          type: val as QuestionType,
                        correct: val === 'multiple' ? getCorrectIndexes(activeQ.correct) : normalizeCorrectForType(val as QuestionType, activeQ.correct),
                        points: val === 'nested' ? getScenarioPoints(activeQ) : activeQ.points || 1,
                        scoringMethod: val === 'multiple' ? activeQ.scoringMethod : 'all_or_nothing',
                        subQuestions: val === 'nested' ? [{ id: '1', type: 'single', question: '', discussion: '', options: ['', '', '', '', ''], correct: 0, points: 1 }] : undefined
                      })}
                      options={[
                        { value: 'single', label: 'Single Choice' },
                        { value: 'multiple', label: 'Multiple Choice' },
                        { value: 'nested', label: 'Scenario Based' },
                      ]}
                    />
                  </Col>
                  <Col span={8}>
                    <Text className="text-xs font-black uppercase tracking-widest text-on-surface/40 block mb-2">Poin Soal</Text>
                    <InputNumber
                      className="w-full rounded-xl font-bold"
                      style={{ height: 44, display: 'flex', alignItems: 'center' }}
                      value={getEffectivePoints(activeQ)}
                      min={0}
                      disabled={activeQ.type === 'nested'}
                      onChange={val => updateActiveQ({ points: Number(val) || 0 })}
                      addonAfter={activeQ.type === 'nested' ? 'auto' : undefined}
                      placeholder="1"
                    />
                    {activeQ.type === 'nested' && (
                      <Text className="text-[10px] text-on-surface/40 font-bold mt-1 block">
                        Total otomatis: {getScenarioPoints(activeQ)} poin dari sub-soal.
                      </Text>
                    )}
                    {activeQ.type === 'multiple' && (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-low/50 dark:bg-zinc-800 px-3 py-2">
                        <Text className="text-[10px] font-black uppercase text-on-surface/50">Gunakan Poin Parsial</Text>
                        <Switch
                          size="small"
                          checked={activeQ.scoringMethod === 'partial'}
                          onChange={checked => updateActiveQ({ scoringMethod: checked ? 'partial' : 'all_or_nothing' })}
                        />
                      </div>
                    )}
                  </Col>
                  <Col span={8}>
                    <Text className="text-xs font-black uppercase tracking-widest text-on-surface/40 block mb-2">Referensi Pembahasan</Text>
                    <Select
                      mode="multiple"
                      className="w-full rounded-xl"
                      style={{ height: 44 }}
                      placeholder="Pilih materi..."
                      value={activeQ.discussionRefs}
                      onChange={v => updateActiveQ({ discussionRefs: v })}
                      options={materials.map(m => ({ label: m.title, value: m.id }))}
                      maxTagCount="responsive"
                    />
                  </Col>
                </Row>

                <div className="mb-8">
                  <Text className="text-xs font-black uppercase tracking-widest text-on-surface/40 block mb-2">
                    {activeQ.type === 'nested' ? 'Isi Cerita / Skenario' : 'Pertanyaan'}
                  </Text>
                  <KantanEditor
                    value={activeQ.question}
                    onChange={(val) => updateActiveQ({ question: val })}
                    placeholder={activeQ.type === 'nested' ? 'Tuliskan cerita, paragraf, atau skenario di sini...' : 'Tuliskan teks pertanyaan...'}
                    rows={activeQ.type === 'nested' ? 10 : 5}
                    label="Rich Question Editor"
                  />
                  {activeQ.question && (
                    <div className="mt-4 p-4 rounded-2xl bg-surface-low/30 dark:bg-zinc-800/50 border border-on-surface/5">
                      <Text className="text-[10px] font-black uppercase text-on-surface/30 block mb-2">Live Preview Pertanyaan</Text>
                      <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderContent(activeQ.question) }} />
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <Text className="text-xs font-black uppercase tracking-widest text-on-surface/40 block mb-2">Pembahasan Singkat Soal</Text>
                  <KantanEditor
                    value={activeQ.discussion}
                    onChange={(val) => updateActiveQ({ discussion: val })}
                    placeholder="Tuliskan pembahasan singkat atau kunci penjelasan di sini..."
                    rows={4}
                    label="Discussion Editor"
                  />
                  <div className="mt-4 p-4 rounded-2xl bg-green-500/5 dark:bg-green-900/10 border border-green-500/20 min-h-[88px]">
                    <Text className="text-[10px] font-black uppercase text-green-600/50 block mb-2">Preview Pembahasan</Text>
                    {hasPreviewContent(activeQ.discussion) ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-green-700 dark:text-green-300" dangerouslySetInnerHTML={{ __html: renderContent(activeQ.discussion) }} />
                    ) : (
                      <Text className="text-xs text-on-surface/40 font-bold">Preview pembahasan akan muncul di sini.</Text>
                    )}
                  </div>
                </div>

                {activeQ.type !== 'nested' ? (
                  <div className="space-y-4">
                    <Text className="text-xs font-black uppercase tracking-widest text-on-surface/40 block mb-2">Opsi Jawaban & Kunci</Text>
                    <div className="grid grid-cols-1 gap-4">
                      {activeQ.options.map((opt, i) => (
                        <div key={i} className="flex items-start gap-4 group">
                          {activeQ.type === 'single' ? (
                            <Radio
                              checked={activeQ.correct === i}
                              onChange={() => toggleCorrect(i)}
                              className="scale-125 mt-3"
                            />
                          ) : (
                            <Checkbox
                              checked={getCorrectIndexes(activeQ.correct).includes(i)}
                              onChange={() => toggleCorrect(i)}
                              className="scale-125 mt-3"
                            />
                          )}
                          <div className={`flex-1 flex flex-col p-1 rounded-lg border-2 transition-all 
                            ${(activeQ.type === 'single' ? activeQ.correct === i : getCorrectIndexes(activeQ.correct).includes(i))
                              ? 'bg-green-50/50 dark:bg-green-900/10 border-green-500/50'
                              : 'bg-surface-low/50 dark:bg-zinc-800 border-transparent hover:border-on-surface/5'}`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm shrink-0 border-2 mt-1
                                 ${(activeQ.type === 'single' ? activeQ.correct === i : getCorrectIndexes(activeQ.correct).includes(i))
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'bg-white dark:bg-zinc-700 border-on-surface/10 text-on-surface/40'}`}>
                                {String.fromCharCode(65 + i)}
                              </div>
                              <KantanEditor
                                value={opt}
                                onChange={val => updateOption(i, val)}
                                placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                                rows={2}
                                className="flex-1"
                              />
                            </div>
                            {(opt.includes('$') || opt.includes('<')) && (
                              <div className="mx-4 mb-2 p-2 bg-white/40 dark:bg-black/20 rounded-lg border border-primary/5 text-sm prose-sm" dangerouslySetInnerHTML={{ __html: renderContent(opt) }} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <Title level={5} className="!m-0 !font-manrope !font-black">Sub-Pertanyaan</Title>
                      <Button type="primary" ghost icon={<PlusOutlined />} onClick={addSubQuestion} className="rounded-xl font-bold">Tambah Sub-Soal</Button>
                    </div>
                    <div className="space-y-4">
                      {activeQ.subQuestions?.map((sub, si) => (
                        <SubQuestionEditor key={sub.id} sub={sub} index={si} />
                      ))}
                    </div>
                  </div>
                )}

                <Divider className="my-10 border-on-surface/5" />

                <div className="flex items-center justify-between">
                  <Space>
                    <Button icon={<CopyOutlined />} className="rounded-xl font-bold h-11 px-6">Duplikat</Button>
                    <Button icon={<EyeOutlined />} className="rounded-xl font-bold h-11 px-6">Pratinjau</Button>
                  </Space>
                  <Button type="primary" icon={<SaveOutlined />} size="large" className="rounded-2xl h-12 px-10 font-black shadow-xl shadow-primary/20"
                    onClick={saveActiveQuestion}>
                    Simpan Soal {activeQIndex + 1}
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'materi',
      label: <span className="flex items-center gap-2"><FileSearchOutlined /> Materi Pembahasan ({materials.length})</span>,
      children: (
        <div className="py-6">
          <Row gutter={24}>
            {/* ── LEFT: Material Sidebar ── */}
            <Col xs={24} md={6}>
              <Card className="weightless-card border-none bg-surface-low/30 dark:bg-zinc-900 shadow-sm rounded-3xl p-3">
                <div className="flex items-center justify-between px-2 mb-4">
                  <Text className="text-[10px] uppercase font-black tracking-widest text-on-surface/40">Daftar Materi</Text>
                  <Button type="primary" ghost size="small" icon={<PlusOutlined />} onClick={addMaterial} className="rounded-lg font-bold text-[10px] h-7">Tambah</Button>
                </div>
                <div className="space-y-2">
                  {materials.map((m, i) => (
                    <div
                      key={m.id}
                      onClick={() => setActiveMIndex(i)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border-2 group relative
                        ${activeMIndex === i
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                          : 'bg-white dark:bg-zinc-800 border-transparent text-on-surface/60 hover:border-primary/30'}`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <Text className={`text-[9px] font-black uppercase tracking-tighter ${activeMIndex === i ? 'text-white/60' : 'text-primary'}`}>
                          {m.category || 'TANPA KATEGORI'}
                        </Text>
                        <Text className={`font-bold text-xs truncate pr-4 ${activeMIndex === i ? 'text-white' : 'text-on-surface'}`}>
                          {m.title || 'Judul Kosong'}
                        </Text>
                      </div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button danger type="text" size="small" icon={<DeleteOutlined className="text-[10px]" />} onClick={(e) => { e.stopPropagation(); confirmRemoveMaterial(i); }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            {/* ── RIGHT: Material Editor ── */}
            <Col xs={24} md={18}>
              {activeM ? (
                <div className="space-y-4">
                  <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-sm rounded-3xl p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Form.Item label="Judul Materi" className="mb-0">
                        <Input
                          className="rounded-xl h-11"
                          placeholder="Cth: Pembahasan Turunan Dasar"
                          value={activeM.title}
                          onChange={e => updateActiveM({ title: e.target.value })}
                        />
                      </Form.Item>
                      <Form.Item label="Kategori" className="mb-0">
                        <Input
                          className="rounded-xl h-11"
                          placeholder="Matematika"
                          value={activeM.category}
                          onChange={e => updateActiveM({ category: e.target.value })}
                        />
                      </Form.Item>
                    </div>
                  </Card>

                  <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-2">
                      <Text className="font-bold">Rich Content Editor</Text>
                      <Tag color="cyan" className="rounded-lg border-none text-[9px] font-black uppercase">Materi #{activeMIndex + 1}</Tag>
                    </div>
                    <div className="flex items-center gap-2">
                      <EyeOutlined />
                      <Text className="text-xs font-bold text-on-surface/60">Preview</Text>
                      <Switch size="small" checked={previewMode} onChange={setPreviewMode} />
                    </div>
                  </div>

                  <Row gutter={20}>
                    <Col xs={24} lg={previewMode ? 12 : 24}>
                      <KantanEditor
                        value={activeM.content}
                        onChange={(val) => updateActiveM({ content: val })}
                        rows={20}
                        placeholder="Tulis materi pembahasan di sini..."
                        label={`Editing: ${activeM.title}`}
                      />
                    </Col>
                    {previewMode && (
                      <Col xs={24} lg={12}>
                        <Card className="sticky top-6 rounded-[2rem] border-none shadow-2xl p-6 bg-white dark:bg-zinc-900 shadow-primary/5 h-[600px] overflow-y-auto">
                          <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderContent(activeM.content) }} />
                        </Card>
                      </Col>
                    )}
                  </Row>

                  <Divider className="my-8 border-on-surface/5" />

                  {/* Additional Files Upload Section */}
                  <Card className="rounded-3xl border-2 border-dashed border-on-surface/10 bg-transparent p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <FilePdfOutlined className="text-xl" />
                      </div>
                      <div>
                        <Text className="font-black block leading-none">Lampiran & File Pendukung</Text>
                        <Text className="text-[10px] text-on-surface/40 uppercase font-bold tracking-widest leading-none">Upload lebih dari satu file (PDF, Doc, dll)</Text>
                      </div>
                    </div>
                    
                    <Upload.Dragger
                      multiple
                      fileList={pdfFiles}
                      onChange={({ fileList }) => setPdfFiles(fileList)}
                      beforeUpload={() => false} // Prevent auto-upload for demo
                      className="bg-white/50 dark:bg-zinc-800/50 rounded-2xl border-none p-8"
                    >
                      <p className="ant-upload-drag-icon">
                        <PlusOutlined className="text-primary/40 text-4xl" />
                      </p>
                      <p className="font-bold text-on-surface/80">Klik atau geser file ke sini untuk mengunggah</p>
                      <p className="text-xs text-on-surface/40 mt-1 max-w-sm mx-auto">
                        Gunakan ini untuk menyertakan ringkasan PDF, tabel rumus, atau materi pengayaan lainnya.
                      </p>
                    </Upload.Dragger>

                    {pdfFiles.length === 0 && (
                      <div className="mt-4 flex flex-col items-center justify-center py-6">
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-on-surface/40 text-xs font-bold uppercase">Belum ada lampiran</span>} />
                      </div>
                    )}
                  </Card>

                  <Button type="primary" block size="large" className="h-14 rounded-2xl font-black shadow-xl shadow-primary/20 mt-8" onClick={saveActiveMaterial}>
                    Simpan Materi: {activeM.title}
                  </Button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-[3rem] shadow-sm">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div className="flex flex-col items-center gap-4">
                        <Text className="text-on-surface/40 font-bold uppercase tracking-widest text-xs">Belum Ada Materi Pembahasan</Text>
                        <Button type="primary" icon={<PlusOutlined />} onClick={addMaterial} className="rounded-xl font-bold h-11 px-8">
                          Tambah Materi Pertama
                        </Button>
                      </div>
                    }
                  />
                </div>
              )}
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'video',
      label: <span className="flex items-center gap-2"><VideoCameraOutlined /> Video & Multimedia ({videos.length})</span>,
      children: (
        <div className="py-6">
          <Row gutter={24}>
            {/* ── LEFT: Video Sidebar ── */}
            <Col xs={24} md={6}>
              <Card className="weightless-card border-none bg-surface-low/30 dark:bg-zinc-900 shadow-sm rounded-3xl p-3">
                <div className="flex items-center justify-between px-2 mb-4">
                  <Text className="text-[10px] uppercase font-black tracking-widest text-on-surface/40">Daftar Video</Text>
                  <Button type="primary" ghost size="small" icon={<PlusOutlined />} onClick={addVideo} className="rounded-lg font-bold text-[10px] h-7">Tambah</Button>
                </div>
                <div className="space-y-2">
                  {videos.map((v, i) => (
                    <div
                      key={v.id}
                      onClick={() => setActiveVIndex(i)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border-2 group relative
                        ${activeVIndex === i
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                          : 'bg-white dark:bg-zinc-800 border-transparent text-on-surface/60 hover:border-primary/30'}`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <Text className={`text-[9px] font-black uppercase tracking-tighter ${activeVIndex === i ? 'text-white/60' : 'text-primary'}`}>
                            {v.duration || '00:00'}
                          </Text>
                          <VideoCameraOutlined className={activeVIndex === i ? 'text-white/40' : 'text-on-surface/20'} />
                        </div>
                        <Text className={`font-bold text-xs truncate pr-6 ${activeVIndex === i ? 'text-white' : 'text-on-surface'}`}>
                          {v.title || 'Judul Video'}
                        </Text>
                      </div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button danger type="text" size="small" icon={<DeleteOutlined className="text-[10px]" />} onClick={(e) => { e.stopPropagation(); confirmRemoveVideo(i); }} />
                      </div>
                    </div>
                  ))}
                  {videos.length === 0 && (
                    <div className="py-10 text-center opacity-40">
                      <VideoCameraOutlined className="text-4xl mb-2" />
                      <Text className="text-[10px] block font-black uppercase tracking-widest leading-none">Belum ada video</Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>

            {/* ── RIGHT: Video Editor ── */}
            <Col xs={24} md={18}>
              {activeV ? (
                <div className="space-y-6">
                  <Card className="weightless-card border-none bg-white dark:bg-zinc-900 shadow-sm rounded-3xl p-6">
                    <Row gutter={[16, 24]}>
                      <Col span={18}>
                        <Form.Item label={<Text className="text-xs font-bold">Judul Video</Text>} className="mb-0">
                          <Input 
                            value={activeV.title} 
                            onChange={e => updateActiveV({ title: e.target.value })} 
                            placeholder="Cth: Penjelasan Konsep Turunan" 
                            className="rounded-xl h-11" 
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label={<Text className="text-xs font-bold">Durasi</Text>} className="mb-0">
                          <Input 
                            value={activeV.duration} 
                            onChange={e => updateActiveV({ duration: e.target.value })} 
                            placeholder="05:30" 
                            className="rounded-xl h-11 text-center" 
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label={<Text className="text-xs font-bold">URL Video (YouTube / GDrive / MP4)</Text>} className="mb-1">
                          <Input 
                            value={activeV.url} 
                            onChange={e => updateActiveV({ url: e.target.value })} 
                            placeholder="https://www.youtube.com/watch?v=..." 
                            className="rounded-xl h-11" 
                            prefix={<VideoCameraOutlined className="text-primary/40" />}
                          />
                        </Form.Item>
                        <Text className="text-[10px] text-on-surface/40 italic">Pastikan URL valid agar dapat diputar oleh player.</Text>
                      </Col>
                    </Row>
                  </Card>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                       <Text className="text-xs font-black uppercase tracking-widest text-on-surface/40">Deskripsi & Penjelasan Video</Text>
                       <Tag color="blue" className="rounded-lg border-none text-[9px] font-black uppercase">Video #{activeVIndex + 1}</Tag>
                    </div>
                    <KantanEditor
                      value={activeV.description}
                      onChange={(val) => updateActiveV({ description: val })}
                      rows={12}
                      placeholder="Tuliskan ringkasan, bab yang dibahas, atau poin-poin penting dari video ini..."
                      label={`Editing Description: ${activeV.title}`}
                    />
                    {activeV.description && (
                      <div className="mt-4 p-5 rounded-[2rem] bg-surface-low/30 dark:bg-zinc-800/50 border border-on-surface/5">
                        <Text className="text-[10px] font-black uppercase text-on-surface/30 block mb-3">Pratinjau Deskripsi</Text>
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderContent(activeV.description) }} />
                      </div>
                    )}
                  </div>

                  <Button type="primary" block size="large" className="h-14 rounded-2xl font-black shadow-xl shadow-primary/20 mt-4" onClick={saveActiveVideo}>
                    Simpan Perubahan Video
                  </Button>
                </div>
              ) : (
                <div className="h-[500px] flex flex-col items-center justify-center bg-white dark:bg-zinc-900 rounded-[3rem] shadow-sm">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div className="flex flex-col items-center gap-4">
                        <Text className="text-on-surface/40 font-bold uppercase tracking-widest text-xs">Belum Ada Video Multimedia</Text>
                        <Button type="primary" icon={<PlusOutlined />} onClick={addVideo} className="rounded-xl font-bold h-11 px-8">
                          Tambah Video Pertama
                        </Button>
                      </div>
                    }
                  />
                </div>
              )}
            </Col>
          </Row>
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="bg-surface-low/30 dark:bg-zinc-950 py-10 min-h-full transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/admin/packages')}
              className="rounded-full w-10 h-10 border-none bg-white dark:bg-zinc-800 shadow-sm"
            />
            <div>
              <Text className="text-[10px] uppercase font-black text-primary tracking-widest block mb-0.5">Settings · {id}</Text>
              <Title level={2} className="!m-0 !font-manrope !font-black !text-2xl dark:text-zinc-100">{packageName}</Title>
            </div>
            <div className="ml-auto">
              <Space>
                <Badge dot status="processing" offset={[-2, 5]}>
                  <Tag color="blue" className="rounded-lg font-bold border-none px-3 py-0.5">Backend aktif</Tag>
                </Badge>
                <Button type="primary" icon={<SaveOutlined />} onClick={saveAllQuestions} className="rounded-xl font-bold">
                  Simpan Semua
                </Button>
              </Space>
            </div>
          </div>

          <Tabs defaultActiveKey="soal" className="weightless-tabs" items={tabItems} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPackageSettings;
