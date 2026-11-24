import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { Row, Col, Card, Typography, Tag, Button, Progress, Space, Divider, Spin, Modal, message } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ArrowLeftOutlined,
  ExpandOutlined,
  WarningOutlined,
  RightOutlined,
  LeftOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getExamSessionSummary,
  getExamSessionQuestionDetail,
  ReviewGroupSummary,
} from '../services/packageService';
import { useAuth } from '../context/AuthContext';
import { renderQuillHtml as renderLatex } from '../utils/renderContent';

const { Title, Text, Paragraph } = Typography;

interface TableRowDetail {
  id: string;
  question: string;
  discussion?: string;
  correct: number;
  points: number;
}

interface AnswerDetail {
  id: number;
  question_id: number;
  sub_question_id: number | null;
  selected_options: number[];
  is_correct: boolean;
  points_earned: number;
  max_points: number;
  question_text: string;
  question_title: string;
  question_type: string;
  scoring_method?: string;
  options: string[];
  correct_answers: number[];
  discussion: string;
  parent_question?: string;
  parent_title?: string;
  parent_type?: string;
  parent_options?: string[];
  rows?: TableRowDetail[];
  row_answers?: Record<string, number[]>;
}

interface GroupedQuestion {
  question_id: number;
  sub_question_id?: number | null;
  type: string;
  sub_type?: string;
  title: string;
  question_text: string;
  parent_question?: string;
  parent_title?: string;
  linkedSubIndex?: number;
  linkedGroupSize?: number;
  options?: string[];
  rows?: TableRowDetail[];
  row_answers?: Record<string, number[]>;
  scoring_method?: string;
  answers: AnswerDetail[];
}

const Review: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { payload, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, benar: 0, salah: 0, kosong: 0 });
  const [groupSummaries, setGroupSummaries] = useState<ReviewGroupSummary[]>([]);
  const [loadedGroupsCache, setLoadedGroupsCache] = useState<Record<string, GroupedQuestion>>({});
  const loadingGroupKeysRef = React.useRef<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [zoomDiscussion, setZoomDiscussion] = useState<{ title: string; html: string } | null>(null);

  // 1. Initial load: fetch ONLY lightweight session summary + stats + question map
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLoadedGroupsCache({});
    loadingGroupKeysRef.current.clear();
    setSelectedIndex(0);

    getExamSessionSummary(id)
      .then((data) => {
        if (!isAdmin() && payload?.user_id !== data.user?.id) {
          message.error('Anda tidak memiliki akses ke riwayat ujian ini');
          navigate('/riwayat');
          return;
        }
        setSession(data);
        setStats(data.stats || { total: 0, benar: 0, salah: 0, kosong: 0 });
        setGroupSummaries(data.groups || []);
      })
      .catch(() => message.error('Gagal memuat detail hasil ujian'))
      .finally(() => setLoading(false));
  }, [id]);

  // 2. Lazy-load ONLY the active question detail when entered; skip DB call if already cached
  const activeSummary = groupSummaries[selectedIndex];
  useEffect(() => {
    if (!id || !activeSummary) return;
    const cacheKey = activeSummary.key;
    if (loadedGroupsCache[cacheKey]) {
      setDetailLoading(false);
      return;
    }
    if (loadingGroupKeysRef.current.has(cacheKey)) {
      setDetailLoading(true);
      return;
    }

    let cancelled = false;
    loadingGroupKeysRef.current.add(cacheKey);
    setDetailLoading(true);

    getExamSessionQuestionDetail(id, activeSummary.question_id, activeSummary.sub_question_id)
      .then((res) => {
        if (cancelled) return;
        const raw: AnswerDetail[] = (res?.answers || []).map((a: any) => ({
          ...a,
          selected_options: a.selected_options || [],
          options: a.options || [],
          correct_answers: a.correct_answers || [],
        }));
        if (raw.length === 0) return;

        const first = raw[0];
        let grouped: GroupedQuestion;
        if (activeSummary.type === 'linked') {
          grouped = {
            question_id: first.question_id,
            sub_question_id: first.sub_question_id,
            type: 'linked',
            sub_type: first.question_type || 'single',
            title: first.question_title || first.parent_title || 'Soal Berhubungan',
            question_text: first.question_text,
            parent_question: first.parent_question || '',
            parent_title: first.parent_title || 'Teks Bacaan',
            linkedSubIndex: activeSummary.linked_sub_index ?? 0,
            linkedGroupSize: activeSummary.linked_group_size ?? 1,
            options: first.options,
            rows: first.rows,
            row_answers: first.row_answers,
            scoring_method: first.scoring_method,
            answers: [first],
          };
        } else if (activeSummary.type === 'table' || activeSummary.type === 'nested' || first.sub_question_id !== null) {
          const parentType = first.parent_type || activeSummary.type || 'nested';
          grouped = {
            question_id: first.question_id,
            type: parentType,
            title: first.parent_title || (parentType === 'table' ? 'Pernyataan' : 'Skenario'),
            question_text: first.parent_question || '',
            options: first.parent_options && first.parent_options.length > 0 ? first.parent_options : first.options || ['Benar', 'Salah'],
            answers: raw,
          };
        } else {
          grouped = {
            question_id: first.question_id,
            type: first.question_type || 'single',
            title: first.question_title || '',
            question_text: first.question_text,
            options: first.options,
            answers: [first],
          };
        }

        setLoadedGroupsCache((prev) => ({ ...prev, [cacheKey]: grouped }));
      })
      .catch(() => {
        if (!cancelled) {
          message.error('Gagal memuat detail soal');
        }
      })
      .finally(() => {
        loadingGroupKeysRef.current.delete(cacheKey);
        if (!cancelled) {
          setDetailLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, activeSummary, loadedGroupsCache]);

  if (loading) {
    return (
      <AppLayout hideBottomNav={true}>
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <Spin size="large" tip="Memuat riwayat ujian..." />
        </div>
      </AppLayout>
    );
  }

  if (!session || groupSummaries.length === 0) {
    return (
      <AppLayout hideBottomNav={true}>
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <Card className="text-center rounded-2xl border-none">
            <WarningOutlined className="text-4xl text-red-500 mb-4" />
            <Title level={4}>Data Tidak Ditemukan</Title>
            <Paragraph className="text-on-surface/60">Sesi ujian ini tidak memiliki data jawaban.</Paragraph>
            <Button onClick={() => navigate(-1)}>Kembali</Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const total = stats.total;
  const benar = stats.benar;
  const salah = stats.salah;
  const score = session.score || 0;

  const currentSummary = groupSummaries[selectedIndex];
  const currentGroup = currentSummary ? loadedGroupsCache[currentSummary.key] : undefined;

  const getSummaryStatusColor = (status: ReviewGroupSummary['status']) => {
    if (status === 'correct') return 'bg-green-500 text-white';
    if (status === 'partial') return 'bg-yellow-400 text-white';
    if (status === 'wrong') return 'bg-red-500 text-white';
    return 'bg-gray-200 text-gray-500';
  };

  return (
    <AppLayout hideBottomNav={true}>
      <style>{`
        .review-discussion-content {
          text-align: left !important;
          line-height: 1.75;
          overflow-x: auto;
          max-width: 100%;
          word-break: normal;
          overflow-wrap: break-word;
        }
        .review-discussion-content p,
        .review-discussion-content div,
        .review-discussion-content li {
          text-align: left !important;
        }
        .review-discussion-content p {
          margin: 0 0 0.65rem 0;
        }
        .review-discussion-content p:last-child {
          margin-bottom: 0;
        }
        .review-discussion-content table {
          width: max-content;
          min-width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          font-size: 0.875rem;
          background: #ffffff;
        }
        .review-discussion-content th,
        .review-discussion-content td {
          border: 1px solid rgba(59, 130, 246, 0.25);
          padding: 8px 12px;
          text-align: left !important;
          white-space: nowrap;
        }
        .review-discussion-content th {
          background: rgba(59, 130, 246, 0.08);
          font-weight: 700;
        }
        .review-discussion-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
        }
        .review-discussion-content .katex-display {
          overflow-x: auto;
          overflow-y: hidden;
          padding: 4px 0;
        }
      `}</style>
      <div className="bg-surface-low/30 min-h-screen pt-24 pb-28 sm:pb-12 lg:pt-32 lg:pb-12 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              className="text-on-surface/60 hover:text-primary transition-colors h-10 w-10 flex items-center justify-center rounded-full bg-surface-low hover:bg-primary/10"
            />
            <div>
              <Text className="text-[10px] sm:text-xs font-heavy uppercase tracking-[0.2em] text-on-surface/40 leading-none mb-1 block">
                {session.is_testing ? 'Ujian Testing Admin' : 'Riwayat Tryout'}
              </Text>
              <Title level={2} className="!m-0 !font-black !font-manrope !text-2xl sm:!text-3xl">
                Review Hasil Simulasi
                {session.package?.title && <span className="text-primary ml-2 text-lg font-bold">— {session.package.title}</span>}
              </Title>
            </div>
          </div>

          <Row gutter={[32, 32]}>
            {/* Left: Stats & Map */}
            <Col xs={24} lg={8}>
              <div className="space-y-6 lg:sticky lg:top-24">

                {/* Score Card */}
                <Card className="weightless-card border-none bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-x-[-20%] -translate-y-[20%]" />
                  <div className="relative z-10 text-center py-4">
                    <Text className="text-sm font-bold text-on-surface/60 block mb-2 uppercase tracking-widest">Skor Akhir</Text>
                    <div className="text-5xl font-black text-primary font-manrope">{score}</div>
                    {session.user?.nama && (
                      <Text className="text-xs text-on-surface/40 block mt-2">{session.user.nama}</Text>
                    )}
                  </div>
                </Card>

                {/* Accuracy Stats */}
                <Card className="weightless-card border-none" title={<span className="font-black font-manrope">Statistik Akurasi</span>}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-surface-low p-3 rounded-2xl">
                      <div className="text-2xl font-black text-on-surface">{total}</div>
                      <div className="text-[10px] uppercase font-bold text-on-surface/40 tracking-wider">Total</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-2xl">
                      <div className="text-2xl font-black text-green-600">{benar}</div>
                      <div className="text-[10px] uppercase font-bold text-green-600/60 tracking-wider">Benar</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-2xl">
                      <div className="text-2xl font-black text-red-600">{salah}</div>
                      <div className="text-[10px] uppercase font-bold text-red-600/60 tracking-wider">Salah</div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold text-on-surface/60 mb-2">
                      <span>Prosentase Akurasi</span>
                      <span>{total > 0 ? Math.round((benar / total) * 100) : 0}%</span>
                    </div>
                    <Progress
                      percent={total > 0 ? Math.round((benar / total) * 100) : 0}
                      showInfo={false}
                      strokeColor="#10b981"
                      trailColor="#fca5a5"
                      strokeWidth={8}
                    />
                  </div>
                </Card>

                {/* Answer Map */}
                <Card className="weightless-card border-none" title={<span className="font-black font-manrope">Peta Jawaban</span>}>
                  <div className="flex items-center gap-3 mb-4 flex-wrap text-xs font-semibold text-on-surface/70">
                    <span className="flex items-center gap-1.5"><CheckCircleFilled className="text-green-500" /> Benar</span>
                    <span className="flex items-center gap-1.5"><CloseCircleFilled className="text-red-500" /> Salah</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-400 rounded-full" /> Sebagian</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-200 rounded-full" /> Kosong</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" /> Berhubungan</span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2">
                    {groupSummaries.map((group, idx) => {
                      const isCurrent = selectedIndex === idx;
                      const tooltip = group.status === 'empty'
                        ? 'Tidak dijawab'
                        : group.status === 'correct'
                          ? 'Benar'
                          : group.status === 'partial'
                            ? 'Sebagian benar'
                            : 'Salah';
                      return (
                        <button
                          key={group.key}
                          onClick={() => setSelectedIndex(idx)}
                          title={`Soal ${idx + 1}: ${tooltip}${group.type === 'linked' ? ' (Soal Berhubungan)' : ''}`}
                          className={`
                            w-full aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all relative
                            ${getSummaryStatusColor(group.status)}
                            ${isCurrent ? 'ring-4 ring-primary/40 scale-110 shadow-lg' : 'hover:opacity-80 hover:scale-105'}
                          `}
                        >
                          {idx + 1}
                          {group.type === 'linked' && (
                            <span
                              title="Soal berhubungan"
                              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white ring-1 ring-black/20"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Card>

              </div>
            </Col>

            {/* Right: Question Detail */}
            <Col xs={24} lg={16}>
              <Card className="weightless-card border-none h-full p-2 sm:p-5 lg:p-8">
                <div className="animate-fade-in flex flex-col h-full">
                  
                  {/* General Header for the Question */}
                  <div className="flex items-center justify-between border-b border-on-surface/5 pb-6 mb-6">
                    <Space align="center" size="middle" wrap>
                      <Tag className="rounded-full px-4 py-1 text-sm font-black border-none bg-surface-low text-on-surface">
                        Soal #{selectedIndex + 1}
                      </Tag>
                      {(currentGroup?.type || currentSummary?.type) === 'nested' && (
                        <Tag color="blue" className="rounded-full border-none font-bold px-3">Skenario</Tag>
                      )}
                      {(currentGroup?.type || currentSummary?.type) === 'table' && (
                        <Tag color="blue" className="rounded-full border-none font-bold px-3">Tabel / Pernyataan</Tag>
                      )}
                      {(currentGroup?.type || currentSummary?.type) === 'linked' && (
                        <Tag color="green" className="rounded-full border-none font-bold px-3">
                          📖 Soal Berhubungan (Bagian {((currentGroup?.linkedSubIndex ?? currentSummary?.linked_sub_index) ?? 0) + 1}/{currentGroup?.linkedGroupSize ?? currentSummary?.linked_group_size ?? 1})
                        </Tag>
                      )}
                      {(currentGroup?.type || currentSummary?.type) === 'multiple' && (
                        <Tag color="blue" className="rounded-full border-none font-bold px-3">Pilih lebih dari satu</Tag>
                      )}
                    </Space>
                  </div>

                  {!currentGroup || detailLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3">
                      <Spin size="large" />
                      <Text className="text-xs font-bold text-on-surface/50">Memuat detail soal #{selectedIndex + 1}...</Text>
                    </div>
                  ) : currentGroup.type === 'linked' ? (
                    /* ── SOAL BERHUBUNGAN (PASSAGE): SINGLE COLUMN REVIEW ── */
                    <div className="flex flex-col gap-8 mb-8">
                      {/* Top: Passage */}
                      <div className="w-full bg-surface-lowest rounded-[2rem] p-6 lg:p-8 shadow-sm border border-surface-container">
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          <Tag color="green" className="rounded-full border-none font-bold px-3">
                            📖 {currentGroup.parent_title || 'Teks Bacaan'}
                          </Tag>
                          {currentGroup.linkedGroupSize && (
                            <Tag className="rounded-full border-none font-bold px-3 bg-surface-low text-on-surface/60">
                              Bagian {(currentGroup.linkedSubIndex ?? 0) + 1} dari {currentGroup.linkedGroupSize}
                            </Tag>
                          )}
                        </div>
                        <Title level={4} className="!font-manrope !font-black !text-xl mt-0 mb-4">Teks Bacaan / Passage</Title>
                        <div
                          className="prose prose-p:text-on-surface/85 prose-p:leading-loose max-w-none text-on-surface font-normal font-sans"
                          dangerouslySetInnerHTML={{ __html: renderLatex(currentGroup.parent_question || '') }}
                        />
                      </div>

                      {/* Bottom: Specific Sub-question review */}
                      <div className="w-full space-y-6">
                        {currentGroup.answers.map((current) => (
                          <div key={current.id} className="relative">
                            {/* Sub-question Status & Points */}
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              {current.selected_options.length === 0 ? (
                                <Tag className="rounded-full border-none px-3 font-bold text-gray-500 bg-gray-100">Tidak Dijawab</Tag>
                              ) : current.is_correct ? (
                                <Tag color="success" className="rounded-full border-none px-3 font-bold flex items-center gap-1">
                                  <CheckCircleFilled /> Benar
                                </Tag>
                              ) : (
                                <Tag color="error" className="rounded-full border-none px-3 font-bold flex items-center gap-1">
                                  <CloseCircleFilled /> Salah
                                </Tag>
                              )}
                              <Tag className="rounded-full border border-surface-container bg-white px-3 font-bold text-on-surface/60">
                                {current.points_earned % 1 === 0 ? current.points_earned : current.points_earned.toFixed(2)} / {current.max_points} poin
                              </Tag>
                            </div>

                            {/* Question Text */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-surface-container mb-4">
                              <Paragraph className="text-base leading-relaxed text-on-surface m-0">
                                <span dangerouslySetInnerHTML={{ __html: renderLatex(current.question_text) }} />
                              </Paragraph>
                            </div>

                            {current.question_type === 'table' && current.rows && current.rows.length > 0 ? (
                              /* Table Sub-Question Review */
                              <div className="space-y-6">
                                <div className="bg-white rounded-3xl shadow-sm border border-surface-container overflow-hidden">
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                      <thead>
                                        <tr className="bg-surface-low/80 border-b border-surface-container">
                                          <th className="p-3 sm:p-4 font-black text-xs text-on-surface">
                                            {current.question_title || 'Pernyataan'}
                                          </th>
                                          {(current.options && current.options.length > 0 ? current.options : ['Benar', 'Salah']).map((col, cIdx) => (
                                            <th key={cIdx} className="p-3 sm:p-4 font-black text-xs text-center text-on-surface w-20 sm:w-24 border-l border-surface-container/60">
                                              {col}
                                            </th>
                                          ))}
                                          <th className="p-3 sm:p-4 font-black text-xs text-center text-on-surface w-28 border-l border-surface-container/60">
                                            Jawaban Kamu
                                          </th>
                                          <th className="p-3 sm:p-4 font-black text-xs text-center text-on-surface w-28 border-l border-surface-container/60">
                                            Kunci
                                          </th>
                                          <th className="p-3 sm:p-4 font-black text-xs text-center text-on-surface w-20 border-l border-surface-container/60">
                                            Poin
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-surface-container/60">
                                        {current.rows.map((row, rIdx) => {
                                          const rowAnswers = current.row_answers || {};
                                          const userRowPick = (rowAnswers[row.id] && rowAnswers[row.id].length > 0) ? rowAnswers[row.id][0] : null;
                                          const correctKey = row.correct;
                                          const isRowCorrect = userRowPick !== null && userRowPick === correctKey;
                                          const colList = current.options && current.options.length > 0 ? current.options : ['Benar', 'Salah'];
                                          const rowBg = userRowPick === null ? '' : isRowCorrect ? 'bg-green-50/30' : 'bg-red-50/30';

                                          return (
                                            <tr key={row.id || rIdx} className={`transition-colors ${rowBg}`}>
                                              <td className="p-3 sm:p-4 align-middle">
                                                <div className="flex items-start gap-2">
                                                  <span className="font-black text-on-surface/30 text-xs mt-0.5 shrink-0">{rIdx + 1}.</span>
                                                  <div
                                                    className="font-normal font-sans text-on-surface text-xs leading-relaxed"
                                                    dangerouslySetInnerHTML={{ __html: renderLatex(row.question) }}
                                                  />
                                                </div>
                                              </td>
                                              {colList.map((_, cIdx) => {
                                                const isUserChoice = userRowPick === cIdx;
                                                const isCorrect = correctKey === cIdx;
                                                return (
                                                  <td key={cIdx} className="p-3 text-center align-middle border-l border-surface-container/60">
                                                    <div className="flex justify-center items-center">
                                                      {isUserChoice && isCorrect ? (
                                                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-black shadow" title="Benar">✓</div>
                                                      ) : isUserChoice && !isCorrect ? (
                                                        <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-black shadow" title="Salah">✗</div>
                                                      ) : isCorrect ? (
                                                        <div className="w-6 h-6 rounded-full border-2 border-green-500 bg-green-50 text-green-700 flex items-center justify-center text-[8px] font-black leading-tight" title="Kunci">KEY</div>
                                                      ) : (
                                                        <div className="w-2.5 h-2.5 rounded-full border border-on-surface/15 bg-surface-low/50" />
                                                      )}
                                                    </div>
                                                  </td>
                                                );
                                              })}
                                              <td className="p-3 text-center align-middle border-l border-surface-container/60">
                                                {userRowPick === null ? (
                                                  <Tag className="rounded-full border-none px-2 font-bold text-[11px] text-gray-400 bg-gray-100 m-0">Kosong</Tag>
                                                ) : isRowCorrect ? (
                                                  <Tag color="success" className="rounded-full border-none font-bold text-[11px] px-2 m-0">
                                                    ✓ {colList[userRowPick] ?? String.fromCharCode(65 + userRowPick)}
                                                  </Tag>
                                                ) : (
                                                  <Tag color="error" className="rounded-full border-none font-bold text-[11px] px-2 m-0">
                                                    ✗ {colList[userRowPick] ?? String.fromCharCode(65 + userRowPick)}
                                                  </Tag>
                                                )}
                                              </td>
                                              <td className="p-3 text-center align-middle border-l border-surface-container/60">
                                                <Tag className="rounded-full font-bold text-[11px] px-2 bg-green-50 text-green-700 border border-green-300 m-0">
                                                  {colList[correctKey] ?? String.fromCharCode(65 + correctKey)}
                                                </Tag>
                                              </td>
                                              <td className="p-3 text-center align-middle border-l border-surface-container/60">
                                                <span className={`text-xs font-black block ${isRowCorrect ? 'text-green-600' : userRowPick === null ? 'text-gray-400' : 'text-red-500'}`}>
                                                  {isRowCorrect ? row.points || 1 : 0} / {row.points || 1}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Row discussions */}
                                {current.rows.some(r => r.discussion && r.discussion.trim() !== '') && (
                                  <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 sm:p-5 space-y-4">
                                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-blue-200/60">
                                      <Title level={5} className="!m-0 !font-manrope !font-black !text-sm !text-blue-900">Pembahasan Baris</Title>
                                      <Button
                                        size="small"
                                        icon={<ExpandOutlined />}
                                        onClick={() => {
                                          const combinedHtml = (current.rows || [])
                                            .map((row, rIdx) => {
                                              if (!row.discussion || row.discussion.trim() === '') return '';
                                              return `<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #dbeafe;"><div style="font-weight:700;color:#1d4ed8;margin-bottom:4px;">Baris ${rIdx + 1}</div><div style="font-size:13px;color:#475569;margin-bottom:6px;">${renderLatex(row.question)}</div><div>${renderLatex(row.discussion)}</div></div>`;
                                            })
                                            .filter(Boolean)
                                            .join('');
                                          setZoomDiscussion({
                                            title: `Pembahasan Baris Soal #${selectedIndex + 1}`,
                                            html: combinedHtml,
                                          });
                                        }}
                                        className="rounded-xl font-bold text-xs border-blue-200 text-blue-700 hover:!text-blue-800 hover:!border-blue-400 bg-white shrink-0"
                                      >
                                        Zoom
                                      </Button>
                                    </div>
                                    {current.rows.map((row, rIdx) => {
                                      if (!row.discussion || row.discussion.trim() === '') return null;
                                      return (
                                        <div key={`disc-${rIdx}`} className="border-t border-blue-100 pt-3 first:border-0 first:pt-0 space-y-2">
                                          <Tag className="rounded-lg bg-blue-500 text-white border-none font-bold text-[11px] m-0">
                                            Baris {rIdx + 1}
                                          </Tag>
                                          <div className="text-xs font-bold text-blue-900/60 leading-snug" dangerouslySetInnerHTML={{ __html: renderLatex(row.question) }} />
                                          <div
                                            className="review-discussion-content text-sm text-blue-950/90 font-normal font-sans"
                                            dangerouslySetInnerHTML={{ __html: renderLatex(row.discussion) }}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Standard Options Review for Single / Multiple Choice */
                              <>
                                {/* Kamu Memilih */}
                                <div className="flex items-start gap-2 mb-5 px-1">
                                  <Text className="text-xs font-bold text-on-surface/40 uppercase tracking-wider shrink-0 mt-1">Kamu memilih:</Text>
                                  {current.selected_options.length > 0 ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {current.selected_options.sort((a, b) => a - b).map(optIdx => {
                                        const optLabel = String.fromCharCode(65 + optIdx);
                                        const isThisCorrect = (current.correct_answers || []).includes(optIdx);
                                        return (
                                          <span
                                            key={optIdx}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black ${
                                              isThisCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                            }`}
                                          >
                                            {optLabel} {isThisCorrect ? '✓' : '✗'}
                                          </span>
                                        );
                                      })}
                                      <Text className={`text-sm font-bold ${current.is_correct ? 'text-green-600' : 'text-red-500'}`}>
                                        {current.is_correct ? '— Benar!' : '— Salah'}
                                      </Text>
                                    </div>
                                  ) : (
                                    <Text className="text-sm font-bold text-gray-400 italic">— Tidak dijawab</Text>
                                  )}
                                </div>

                                {/* Options */}
                                <div className="space-y-3">
                                  <Text className="text-xs font-bold uppercase tracking-widest text-on-surface/40 pl-2">Pilihan Jawaban</Text>
                                  {current.options
                                    .map((opt, idx) => ({ opt, idx }))
                                    .filter(({ opt, idx }) => {
                                      const isCorrect = (current.correct_answers || []).includes(idx);
                                      return isCorrect || (opt && opt.trim() !== '');
                                    })
                                    .map(({ opt, idx }) => {
                                      const isCorrect = (current.correct_answers || []).includes(idx);
                                      const isUserPick = (current.selected_options || []).includes(idx);
                                      const label = String.fromCharCode(65 + idx);

                                      let wrapCls = 'border border-surface-container bg-white';
                                      let labelCls = 'bg-surface-low text-on-surface/60';
                                      let textCls = 'text-on-surface/80';
                                      let icon = null;

                                      if (isCorrect && isUserPick) {
                                        wrapCls = 'border-green-500 bg-green-50 ring-1 ring-green-500 shadow-sm';
                                        labelCls = 'bg-green-500 text-white';
                                        textCls = 'text-green-800 font-semibold';
                                        icon = <CheckCircleFilled className="text-green-500 text-xl shrink-0" />;
                                      } else if (isCorrect) {
                                        wrapCls = 'border-green-400 bg-green-50/60 ring-1 ring-green-400';
                                        labelCls = 'bg-green-400 text-white';
                                        textCls = 'text-green-800 font-semibold';
                                        icon = <CheckCircleFilled className="text-green-400 text-xl shrink-0" />;
                                      } else if (isUserPick && !isCorrect) {
                                        wrapCls = 'border-red-500 bg-red-50/60 ring-1 ring-red-500 shadow-sm';
                                        labelCls = 'bg-red-500 text-white';
                                        textCls = 'text-red-800';
                                        icon = <CloseCircleFilled className="text-red-500 text-xl shrink-0" />;
                                      }

                                      return (
                                        <div key={idx} className={`p-4 lg:p-5 rounded-2xl flex items-center justify-between transition-all ${wrapCls}`}>
                                          <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0 transition-colors ${labelCls}`}>
                                              {label}
                                            </div>
                                            {opt && opt.trim() !== '' ? (
                                              <span
                                                className={`text-base font-medium leading-relaxed ${textCls}`}
                                                dangerouslySetInnerHTML={{ __html: renderLatex(opt) }}
                                              />
                                            ) : (
                                              <span className={`text-base font-medium italic opacity-60 ${textCls}`}>
                                                (Data opsi tidak tersedia)
                                              </span>
                                            )}
                                          </div>
                                          {icon}
                                        </div>
                                      );
                                    })}
                                </div>
                              </>
                            )}

                            {/* Discussion */}
                            {current.discussion && (
                              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mt-6">
                                <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-blue-200/60">
                                  <Title level={5} className="!m-0 !text-blue-900 !font-black !font-manrope">
                                    Pembahasan
                                  </Title>
                                  <Button
                                    size="small"
                                    icon={<ExpandOutlined />}
                                    onClick={() =>
                                      setZoomDiscussion({
                                        title: `Pembahasan Soal #${selectedIndex + 1}`,
                                        html: renderLatex(current.discussion),
                                      })
                                    }
                                    className="rounded-xl font-bold text-xs border-blue-200 text-blue-700 hover:!text-blue-800 hover:!border-blue-400 bg-white shrink-0"
                                  >
                                    Zoom
                                  </Button>
                                </div>
                                <div
                                  className="review-discussion-content text-blue-950/90 text-sm sm:text-base font-normal font-sans"
                                  dangerouslySetInnerHTML={{ __html: renderLatex(current.discussion) }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Passage / Narrative Header (nested or table) */}
                      {(currentGroup.type === 'nested' || currentGroup.type === 'table') && (
                        <div className="bg-surface-lowest rounded-[2rem] p-6 lg:p-8 shadow-sm border border-surface-container mb-8">
                          {currentGroup.title && (
                            <Tag color="blue" className="mb-4 rounded-full border-none font-bold px-3">
                              {currentGroup.title}
                            </Tag>
                          )}
                          {currentGroup.type === 'nested' && (
                            <Title level={4} className="!font-manrope !font-black !text-xl mt-0">Skenario Kasus</Title>
                          )}
                          {currentGroup.question_text && (
                            <div
                              className="prose prose-lg prose-p:text-on-surface/90 prose-p:leading-loose max-w-none text-on-surface font-normal font-sans"
                              dangerouslySetInnerHTML={{ __html: renderLatex(currentGroup.question_text) }}
                            />
                          )}
                        </div>
                      )}

                  {currentGroup.type === 'table' ? (
                    /* ── TABLE QUESTION REVIEW ── */
                    <div className="space-y-8">

                      {/* Table: pernyataan + jawaban siswa + kunci */}
                      <div className="bg-white rounded-3xl shadow-sm border border-surface-container overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-surface-low/80 border-b border-surface-container">
                                <th className="p-4 sm:p-5 font-black text-sm text-on-surface">
                                  {currentGroup.title || 'Pernyataan'}
                                </th>
                                {(currentGroup.options && currentGroup.options.length > 0 ? currentGroup.options : ['Benar', 'Salah']).map((col, cIdx) => (
                                  <th key={cIdx} className="p-4 sm:p-5 font-black text-sm text-center text-on-surface w-24 sm:w-28 border-l border-surface-container/60">
                                    {col}
                                  </th>
                                ))}
                                <th className="p-4 sm:p-5 font-black text-sm text-center text-on-surface w-32 border-l border-surface-container/60">
                                  Jawaban Kamu
                                </th>
                                <th className="p-4 sm:p-5 font-black text-sm text-center text-on-surface w-32 border-l border-surface-container/60">
                                  Kunci Jawaban
                                </th>
                                <th className="p-4 sm:p-5 font-black text-sm text-center text-on-surface w-24 border-l border-surface-container/60">
                                  Poin
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-container/60">
                              {currentGroup.answers.map((ans, aIdx) => {
                                const userPick = ans.selected_options.length > 0 ? ans.selected_options[0] : null;
                                const correctKey = ans.correct_answers.length > 0 ? ans.correct_answers[0] : 0;
                                const colList = currentGroup.options && currentGroup.options.length > 0 ? currentGroup.options : ['Benar', 'Salah'];
                                const rowBg = userPick === null ? '' : ans.is_correct ? 'bg-green-50/30' : 'bg-red-50/30';
                                return (
                                  <tr key={`${ans.id}-${aIdx}`} className={`transition-colors ${rowBg}`}>
                                    {/* Statement text */}
                                    <td className="p-4 sm:p-5 align-middle">
                                      <div className="flex items-start gap-2">
                                        <span className="font-black text-on-surface/30 text-xs mt-1 shrink-0">{aIdx + 1}.</span>
                                        <div
                                          className="font-normal font-sans text-on-surface text-sm leading-relaxed"
                                          dangerouslySetInnerHTML={{ __html: renderLatex(ans.question_text) }}
                                        />
                                      </div>
                                    </td>

                                    {/* Option columns – radio indicators */}
                                    {colList.map((colName, cIdx) => {
                                      const isUserChoice = userPick === cIdx;
                                      const isCorrectKey = correctKey === cIdx;
                                      return (
                                        <td key={cIdx} className="p-4 text-center align-middle border-l border-surface-container/60">
                                          <div className="flex justify-center items-center">
                                            {isUserChoice && isCorrectKey ? (
                                              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-black shadow" title="Benar">✓</div>
                                            ) : isUserChoice && !isCorrectKey ? (
                                              <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-black shadow" title="Salah">✗</div>
                                            ) : isCorrectKey ? (
                                              <div className="w-8 h-8 rounded-full border-2 border-green-500 bg-green-50 text-green-700 flex items-center justify-center text-[9px] font-black leading-tight" title="Kunci">KEY</div>
                                            ) : (
                                              <div className="w-3 h-3 rounded-full border border-on-surface/15 bg-surface-low/50" />
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })}

                                    {/* Jawaban Siswa */}
                                    <td className="p-4 text-center align-middle border-l border-surface-container/60">
                                      {userPick === null ? (
                                        <Tag className="rounded-full border-none px-2.5 font-bold text-xs text-gray-400 bg-gray-100 m-0">Kosong</Tag>
                                      ) : ans.is_correct ? (
                                        <Tag color="success" className="rounded-full border-none font-bold text-xs px-2.5 m-0">
                                          ✓ {colList[userPick] ?? String.fromCharCode(65 + userPick)}
                                        </Tag>
                                      ) : (
                                        <Tag color="error" className="rounded-full border-none font-bold text-xs px-2.5 m-0">
                                          ✗ {colList[userPick] ?? String.fromCharCode(65 + userPick)}
                                        </Tag>
                                      )}
                                    </td>

                                    {/* Kunci Jawaban */}
                                    <td className="p-4 text-center align-middle border-l border-surface-container/60">
                                      <Tag className="rounded-full font-bold text-xs px-2.5 bg-green-50 text-green-700 border border-green-300 m-0">
                                        {colList[correctKey] ?? String.fromCharCode(65 + correctKey)}
                                      </Tag>
                                    </td>

                                    {/* Poin */}
                                    <td className="p-4 text-center align-middle border-l border-surface-container/60">
                                      <span className={`text-xs font-black block ${ans.points_earned > 0 ? 'text-green-600' : userPick === null ? 'text-gray-400' : 'text-red-500'}`}>
                                        {ans.points_earned} / {ans.max_points}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Pembahasan – satu per baris */}
                      {currentGroup.answers.some(a => a.discussion && a.discussion.trim() !== '') && (
                        <div className="bg-blue-50/60 border border-blue-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 space-y-4">
                          <div className="flex items-center justify-between gap-3 pb-3 border-b border-blue-200/60">
                            <Title level={5} className="!m-0 !font-manrope !font-black !text-blue-900">Pembahasan</Title>
                            <Button
                              size="small"
                              icon={<ExpandOutlined />}
                              onClick={() => {
                                const combinedHtml = currentGroup.answers
                                  .map((ans, aIdx) => {
                                    if (!ans.discussion || ans.discussion.trim() === '') return '';
                                    return `<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #dbeafe;"><div style="font-weight:700;color:#1d4ed8;margin-bottom:4px;">Baris ${aIdx + 1}</div><div style="font-size:13px;color:#475569;margin-bottom:6px;">${renderLatex(ans.question_text)}</div><div>${renderLatex(ans.discussion)}</div></div>`;
                                  })
                                  .filter(Boolean)
                                  .join('');
                                setZoomDiscussion({
                                  title: `Pembahasan Soal #${selectedIndex + 1}`,
                                  html: combinedHtml,
                                });
                              }}
                              className="rounded-xl font-bold text-xs border-blue-200 text-blue-700 hover:!text-blue-800 hover:!border-blue-400 bg-white shrink-0"
                            >
                              Zoom
                            </Button>
                          </div>
                          {currentGroup.answers.map((ans, aIdx) => {
                            if (!ans.discussion || ans.discussion.trim() === '') return null;
                            return (
                              <div key={`disc-${aIdx}`} className="border-t border-blue-100 pt-4 first:border-0 first:pt-0 space-y-2">
                                <Tag className="rounded-lg bg-blue-500 text-white border-none font-bold text-xs m-0">
                                  Baris {aIdx + 1}
                                </Tag>
                                <div className="text-xs font-bold text-blue-900/60 leading-snug" dangerouslySetInnerHTML={{ __html: renderLatex(ans.question_text) }} />
                                <div
                                  className="review-discussion-content text-sm sm:text-base text-blue-950/90 font-normal font-sans"
                                  dangerouslySetInnerHTML={{ __html: renderLatex(ans.discussion) }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                  <div className="space-y-12">
                    {/* Render each sub-question (or the single question) */}
                    {currentGroup.answers.map((current, ansIdx) => (
                      <div key={current.id} className="relative">
                        
                        {/* Sub-question Header (Points and Status) */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          {(currentGroup.type === 'nested' || currentGroup.type === 'linked') && (
                            <Tag className="rounded-full px-4 py-1 text-sm font-black border-none bg-surface-low text-on-surface">
                              Soal #{ansIdx + 1}
                            </Tag>
                          )}
                          {current.selected_options.length === 0 ? (
                            <Tag className="rounded-full border-none px-3 font-bold text-gray-500 bg-gray-100">Tidak Dijawab</Tag>
                          ) : current.is_correct ? (
                            <Tag color="success" className="rounded-full border-none px-3 font-bold flex items-center gap-1">
                              <CheckCircleFilled /> Benar
                            </Tag>
                          ) : (
                            <Tag color="error" className="rounded-full border-none px-3 font-bold flex items-center gap-1">
                              <CloseCircleFilled /> Salah
                            </Tag>
                          )}
                          <Tag className="rounded-full border border-surface-container bg-white px-3 font-bold text-on-surface/60">
                            {current.points_earned % 1 === 0 ? current.points_earned : current.points_earned.toFixed(2)} / {current.max_points} poin
                          </Tag>
                        </div>

                        {/* Question Text */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-surface-container mb-4">
                          <Paragraph className="text-base leading-relaxed text-on-surface m-0">
                            <span dangerouslySetInnerHTML={{ __html: renderLatex(current.question_text) }} />
                          </Paragraph>
                        </div>

                        {/* Kamu Memilih */}
                        <div className="flex items-start gap-2 mb-5 px-1">
                          <Text className="text-xs font-bold text-on-surface/40 uppercase tracking-wider shrink-0 mt-1">Kamu memilih:</Text>
                          {current.selected_options.length > 0 ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              {current.selected_options.sort((a, b) => a - b).map(optIdx => {
                                const optLabel = String.fromCharCode(65 + optIdx);
                                const isThisCorrect = (current.correct_answers || []).includes(optIdx);
                                return (
                                  <span
                                    key={optIdx}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black ${
                                      isThisCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                    }`}
                                  >
                                    {optLabel} {isThisCorrect ? '✓' : '✗'}
                                  </span>
                                );
                              })}
                              <Text className={`text-sm font-bold ${current.is_correct ? 'text-green-600' : 'text-red-500'}`}>
                                {current.is_correct ? '— Benar!' : '— Salah'}
                              </Text>
                            </div>
                          ) : (
                            <Text className="text-sm font-bold text-gray-400 italic">— Tidak dijawab</Text>
                          )}
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                          <Text className="text-xs font-bold uppercase tracking-widest text-on-surface/40 pl-2">Pilihan Jawaban</Text>
                          {current.options
                            .map((opt, idx) => ({ opt, idx }))
                            .filter(({ opt, idx }) => {
                              // Never hide the correct answer even if the text is empty
                              const isCorrect = (current.correct_answers || []).includes(idx);
                              return isCorrect || (opt && opt.trim() !== '');
                            })
                            .map(({ opt, idx }) => {
                              const isCorrect = (current.correct_answers || []).includes(idx);
                              const isUserPick = (current.selected_options || []).includes(idx);
                              const label = String.fromCharCode(65 + idx);

                              let wrapCls = 'border border-surface-container bg-white';
                              let labelCls = 'bg-surface-low text-on-surface/60';
                              let textCls = 'text-on-surface/80';
                              let icon = null;

                              if (isCorrect && isUserPick) {
                                // User picked correctly → full green
                                wrapCls = 'border-green-500 bg-green-50 ring-1 ring-green-500 shadow-sm';
                                labelCls = 'bg-green-500 text-white';
                                textCls = 'text-green-800 font-semibold';
                                icon = <CheckCircleFilled className="text-green-500 text-xl shrink-0" />;
                              } else if (isCorrect) {
                                // Correct but not picked → show green to reveal answer
                                wrapCls = 'border-green-400 bg-green-50/60 ring-1 ring-green-400';
                                labelCls = 'bg-green-400 text-white';
                                textCls = 'text-green-800 font-semibold';
                                icon = <CheckCircleFilled className="text-green-400 text-xl shrink-0" />;
                              } else if (isUserPick && !isCorrect) {
                                // User picked wrong → red
                                wrapCls = 'border-red-500 bg-red-50/60 ring-1 ring-red-500 shadow-sm';
                                labelCls = 'bg-red-500 text-white';
                                textCls = 'text-red-800';
                                icon = <CloseCircleFilled className="text-red-500 text-xl shrink-0" />;
                              }

                              return (
                                <div key={idx} className={`p-4 lg:p-5 rounded-2xl flex items-center justify-between transition-all ${wrapCls}`}>
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0 transition-colors ${labelCls}`}>
                                      {label}
                                    </div>
                                    {opt && opt.trim() !== '' ? (
                                      <span
                                        className={`text-base font-medium leading-relaxed ${textCls}`}
                                        dangerouslySetInnerHTML={{ __html: renderLatex(opt) }}
                                      />
                                    ) : (
                                      <span className={`text-base font-medium italic opacity-60 ${textCls}`}>
                                        (Data opsi tidak tersedia)
                                      </span>
                                    )}
                                  </div>
                                  {icon}
                                </div>
                              );
                            })}
                        </div>

                        {/* Discussion */}
                        {current.discussion && (
                          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mt-6">
                            <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-blue-200/60">
                              <Title level={5} className="!m-0 !text-blue-900 !font-black !font-manrope">
                                Pembahasan
                              </Title>
                              <Button
                                size="small"
                                icon={<ExpandOutlined />}
                                onClick={() =>
                                  setZoomDiscussion({
                                    title: `Pembahasan Soal #${selectedIndex + 1}`,
                                    html: renderLatex(current.discussion),
                                  })
                                }
                                className="rounded-xl font-bold text-xs border-blue-200 text-blue-700 hover:!text-blue-800 hover:!border-blue-400 bg-white shrink-0"
                              >
                                Zoom
                              </Button>
                            </div>
                            <div
                              className="review-discussion-content text-blue-950/90 text-sm sm:text-base font-normal font-sans"
                              dangerouslySetInnerHTML={{ __html: renderLatex(current.discussion) }}
                            />
                          </div>
                        )}
                        
                        {/* Divider between subquestions (if multiple) */}
                        {currentGroup.answers.length > 1 && ansIdx < currentGroup.answers.length - 1 && (
                          <Divider className="border-on-surface/10 my-10" />
                        )}
                      </div>
                    ))}
                  </div>
                  )}
                    </>
                  )}

                  <Divider className="border-on-surface/10 mt-10 mb-8" />

                  {/* Navigation Footer */}
                  <div className="mt-auto">
                    {/* Desktop View */}
                    <div className="hidden sm:flex items-center justify-between gap-4">
                      <Button
                        size="large"
                        type="text"
                        icon={<LeftOutlined />}
                        disabled={selectedIndex === 0}
                        onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                        className="w-auto h-12 rounded-xl font-bold bg-surface-low hover:bg-surface-low/80 text-on-surface/80"
                      >
                        Soal Sebelumnya
                      </Button>
                      <Button
                        size="large"
                        type="primary"
                        className="w-auto h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        disabled={selectedIndex === groupSummaries.length - 1}
                        onClick={() => setSelectedIndex(prev => Math.min(groupSummaries.length - 1, prev + 1))}
                      >
                        Soal Selanjutnya <RightOutlined />
                      </Button>
                    </div>
                    {/* Mobile View - Fixed Bottom Nav */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-surface-container px-4 py-3 pb-safe sm:hidden flex items-center justify-between gap-2 z-50">
                      <Button
                        size="large"
                        icon={<LeftOutlined />}
                        disabled={selectedIndex === 0}
                        onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                        className="flex-1 h-12 rounded-xl font-bold bg-surface-low hover:bg-surface-low/80 text-on-surface/80 border-none text-[11px]"
                      >
                        Sebelumnya
                      </Button>
                      <Button
                        size="large"
                        danger
                        icon={<LogoutOutlined />}
                        onClick={() => navigate('/riwayat')}
                        className="flex-1 h-12 rounded-xl font-bold text-[11px]"
                      >
                        Exit
                      </Button>
                      <Button
                        size="large"
                        type="primary"
                        className="flex-1 h-12 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-primary/20 text-[11px]"
                        disabled={selectedIndex === groupSummaries.length - 1}
                        onClick={() => setSelectedIndex(prev => Math.min(groupSummaries.length - 1, prev + 1))}
                      >
                        Selanjutnya <RightOutlined />
                      </Button>
                    </div>
                  </div>

                </div>
              </Card>
            </Col>
          </Row>

        </div>
      </div>

      {/* Full-Page Zoom Discussion Modal */}
      <Modal
        open={Boolean(zoomDiscussion)}
        onCancel={() => setZoomDiscussion(null)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setZoomDiscussion(null)}
            className="rounded-xl font-bold px-6"
          >
            Tutup
          </Button>,
        ]}
        title={
          <span className="font-black font-manrope text-base sm:text-lg text-blue-900">
            {zoomDiscussion?.title || 'Pembahasan'}
          </span>
        }
        width="100vw"
        style={{ top: 0, maxWidth: '100vw', paddingBottom: 0 }}
        styles={{
          body: { minHeight: 'calc(100dvh - 120px)', maxHeight: 'calc(100dvh - 120px)', overflowY: 'auto', padding: '16px 20px' },
        }}
      >
        {zoomDiscussion && (
          <div
            className="review-discussion-content max-w-4xl mx-auto text-blue-950/90 text-base sm:text-lg font-normal font-sans"
            dangerouslySetInnerHTML={{ __html: zoomDiscussion.html }}
          />
        )}
      </Modal>
    </AppLayout>
  );
};

export default Review;
