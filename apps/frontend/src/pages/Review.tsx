import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import { Row, Col, Card, Typography, Tag, Button, Progress, Space, Divider, Spin, message } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ArrowLeftOutlined,
  BulbOutlined,
  WarningOutlined,
  RightOutlined,
  LeftOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getExamSession } from '../services/packageService';
import { useAuth } from '../context/AuthContext';
import { renderQuillHtml as renderLatex } from '../utils/renderContent';

const { Title, Text, Paragraph } = Typography;

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
  options: string[];
  correct_answers: number[];
  discussion: string;
  parent_question?: string;
  parent_title?: string;
  parent_type?: string;
  parent_options?: string[];
}

interface GroupedQuestion {
  question_id: number;
  type: string;
  title: string;
  question_text: string;
  options?: string[];
  answers: AnswerDetail[];
}

const Review: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { payload, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [answers, setAnswers] = useState<AnswerDetail[]>([]);
  const [groupedQuestions, setGroupedQuestions] = useState<GroupedQuestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getExamSession(id)
      .then((data) => {
        if (!isAdmin() && payload?.user_id !== data.user?.id) {
          message.error('Anda tidak memiliki akses ke riwayat ujian ini');
          navigate('/riwayat');
          return;
        }

        setSession(data);
        const raw: AnswerDetail[] = (data.answers || []).map((a: any, idx: number) => ({
          ...a,
          selected_options: a.selected_options || [],
          options: a.options || [],
          correct_answers: a.correct_answers || [],
        }));
        setAnswers(raw);

        // Group by question_id so nested or table questions appear on the same page
        const groups: GroupedQuestion[] = [];
        const map = new Map<number, GroupedQuestion>();

        raw.forEach(a => {
          const isSub = a.sub_question_id !== null && a.sub_question_id !== undefined;
          if (isSub) { // It's a sub-question (nested or table)
            const parentType = a.parent_type || (a.question_type === 'table' ? 'table' : 'nested');
            if (!map.has(a.question_id)) {
              const g: GroupedQuestion = {
                question_id: a.question_id,
                type: parentType,
                title: a.parent_title || (parentType === 'table' ? 'Pernyataan' : 'Skenario'),
                question_text: a.parent_question || '',
                options: a.parent_options && a.parent_options.length > 0 ? a.parent_options : a.options || ['Benar', 'Salah'],
                answers: []
              };
              map.set(a.question_id, g);
              groups.push(g);
            }
            map.get(a.question_id)!.answers.push(a);
          } else { // Single or multiple
            groups.push({
              question_id: a.question_id,
              type: a.question_type || 'single',
              title: a.question_title || '',
              question_text: a.question_text,
              options: a.options,
              answers: [a]
            });
          }
        });
        setGroupedQuestions(groups);
      })
      .catch(() => message.error('Gagal memuat detail hasil ujian'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppLayout hideBottomNav={true}>
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <Spin size="large" tip="Memuat riwayat ujian..." />
        </div>
      </AppLayout>
    );
  }

  if (!session || answers.length === 0 || groupedQuestions.length === 0) {
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

  const total = answers.length;
  const benar = answers.filter(a => a.is_correct).length;
  const kosong = answers.filter(a => a.selected_options.length === 0).length;
  const salah = total - benar - kosong;
  const score = session.score || 0;
  
  const currentGroup = groupedQuestions[selectedIndex];

  const getGroupStatusColor = (group: GroupedQuestion) => {
    if (group.answers.length === 0) return 'bg-gray-200 text-gray-500';
    const allEmpty = group.answers.every(a => a.selected_options.length === 0);
    if (allEmpty) return 'bg-gray-200 text-gray-500';
    const allCorrect = group.answers.every(a => a.is_correct);
    if (allCorrect) return 'bg-green-500 text-white';
    const anyCorrect = group.answers.some(a => a.is_correct);
    if (anyCorrect) return 'bg-yellow-400 text-white'; // Mixed: some correct, some wrong
    return 'bg-red-500 text-white';
  };

  return (
    <AppLayout hideBottomNav={true}>
      <div className="bg-surface-low/30 min-h-screen pt-24 pb-8 lg:pt-32 lg:pb-12 transition-colors duration-500">
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
                  <div className="flex items-center gap-3 mb-4 flex-wrap text-xs">
                    <span className="flex items-center gap-1.5"><CheckCircleFilled className="text-green-500" /> Benar</span>
                    <span className="flex items-center gap-1.5"><CloseCircleFilled className="text-red-500" /> Salah</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-400 rounded-full" /> Sebagian</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-200 rounded-full" /> Kosong</span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2">
                    {groupedQuestions.map((group, idx) => {
                      const isCurrent = selectedIndex === idx;
                      const allEmpty = group.answers.every(a => a.selected_options.length === 0);
                      const allCorrect = !allEmpty && group.answers.every(a => a.is_correct);
                      const anyCorrect = !allEmpty && !allCorrect && group.answers.some(a => a.is_correct);
                      const tooltip = allEmpty ? 'Tidak dijawab' : allCorrect ? 'Semua benar' : anyCorrect ? 'Sebagian benar' : 'Salah';
                      return (
                        <button
                          key={group.question_id}
                          onClick={() => setSelectedIndex(idx)}
                          title={`Soal ${idx + 1}: ${tooltip}`}
                          className={`
                            w-full aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all
                            ${getGroupStatusColor(group)}
                            ${isCurrent ? 'ring-4 ring-primary/30 scale-110 shadow-lg' : 'hover:opacity-80 hover:scale-105'}
                          `}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </Card>

              </div>
            </Col>

            {/* Right: Question Detail */}
            <Col xs={24} lg={16}>
              <Card className="weightless-card border-none h-full p-4 lg:p-8">
                <div className="animate-fade-in flex flex-col h-full">
                  
                  {/* General Header for the Question Group */}
                  <div className="flex items-center justify-between border-b border-on-surface/5 pb-6 mb-6">
                    <Space align="center" size="middle">
                      <Tag className="rounded-full px-4 py-1 text-sm font-black border-none bg-surface-low text-on-surface">
                        Bagian #{selectedIndex + 1}
                      </Tag>
                      {currentGroup.type === 'nested' && (
                        <Tag color="blue" className="rounded-full border-none font-bold px-3">Skenario</Tag>
                      )}
                      {currentGroup.type === 'table' && (
                        <Tag color="blue" className="rounded-full border-none font-bold px-3">Tabel / Pernyataan</Tag>
                      )}
                      {currentGroup.type === 'multiple' && (
                        <Tag color="blue" className="rounded-full border-none font-bold px-3">Pilih lebih dari satu</Tag>
                      )}
                    </Space>
                  </div>

                  {/* Scenario or Table Header Narrative */}
                  {(currentGroup.type === 'nested' || currentGroup.type === 'table') && (
                    <div className="bg-surface-lowest rounded-[2rem] p-6 lg:p-8 shadow-sm border border-surface-container mb-8">
                      {currentGroup.title && (
                        <Tag color="blue" className="mb-4 rounded-full border-none font-bold px-3">{currentGroup.title}</Tag>
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
                        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 lg:p-8 space-y-5">
                          <div className="flex gap-3 items-center mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 text-lg shrink-0">
                              <BulbOutlined />
                            </div>
                            <Title level={5} className="!m-0 !font-manrope !font-black !text-blue-900">Pembahasan</Title>
                          </div>
                          {currentGroup.answers.map((ans, aIdx) => {
                            if (!ans.discussion || ans.discussion.trim() === '') return null;
                            return (
                              <div key={`disc-${aIdx}`} className="border-t border-blue-100 pt-4 first:border-0 first:pt-0">
                                <div className="flex items-start gap-3">
                                  <Tag className="rounded-lg bg-blue-500 text-white border-none font-bold text-xs shrink-0 mt-0.5">
                                    Baris {aIdx + 1}
                                  </Tag>
                                  <div className="flex-1 space-y-1">
                                    <div className="text-xs font-bold text-blue-900/50 leading-snug" dangerouslySetInnerHTML={{ __html: renderLatex(ans.question_text) }} />
                                    <div
                                      className="text-sm text-blue-950/90 font-normal font-sans leading-relaxed"
                                      dangerouslySetInnerHTML={{ __html: renderLatex(ans.discussion) }}
                                    />
                                  </div>
                                </div>
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
                          {currentGroup.type === 'nested' && (
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
                          <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 lg:p-8 mt-6">
                            <div className="flex gap-4">
                              <div className="shrink-0">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 text-xl">
                                  <BulbOutlined />
                                </div>
                              </div>
                              <div className="w-full">
                                <Title level={5} className="!text-blue-900 !font-black !font-manrope !mb-3 mt-1">
                                  Pembahasan
                                </Title>
                                <Paragraph className="text-blue-900/80 leading-loose text-base font-medium mb-0">
                                  <span dangerouslySetInnerHTML={{ __html: renderLatex(current.discussion) }} />
                                </Paragraph>
                              </div>
                            </div>
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
                        Bagian Sebelumnya
                      </Button>
                      <Button
                        size="large"
                        type="primary"
                        className="w-auto h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        disabled={selectedIndex === groupedQuestions.length - 1}
                        onClick={() => setSelectedIndex(prev => Math.min(groupedQuestions.length - 1, prev + 1))}
                      >
                        Bagian Selanjutnya <RightOutlined />
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
                        disabled={selectedIndex === groupedQuestions.length - 1}
                        onClick={() => setSelectedIndex(prev => Math.min(groupedQuestions.length - 1, prev + 1))}
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
    </AppLayout>
  );
};

export default Review;
