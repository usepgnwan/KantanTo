import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import KantanEditor from '../../components/atoms/KantanEditor';
import { renderContent } from '../../utils/renderContent';
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
  CopyOutlined, CheckCircleFilled,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';

const { Title, Text } = Typography;

// ─── TYPES ──────────────────────────────────────────────────
type QuestionType = 'single' | 'multiple' | 'nested' | 'table' | 'linked';
type ScoringMethod = 'all_or_nothing' | 'partial';

export interface SubQuestionTableRow {
  id: string;
  question: string;
  discussion?: string;
  correct: number;
  points: number;
}

interface SubQuestion {
  id: string;
  type?: QuestionType;
  title?: string;
  question: string;
  discussion: string;
  options: string[];
  correct: number | number[];
  rows?: SubQuestionTableRow[];
  scoringMethod?: ScoringMethod;
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

const hasPreviewContent = (value?: string): boolean => {
  if (!value) return false;
  if (value.includes('ql-formula') || value.includes('<img')) return true;
  if (value.includes('$$')) return true;
  return stripHtml(value).length > 0;
};

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

// ─── COMPONENT: Table Matrix Editor (Reusable) ───────────────
interface TableMatrixEditorProps {
  title: string;
  columns: string[];
  rows: SubQuestionTableRow[];
  onChangeTitle: (newTitle: string) => void;
  onChangeColumns: (nextCols: string[]) => void;
  onChangeRows: (nextRows: SubQuestionTableRow[]) => void;
}

const TableMatrixEditor: React.FC<TableMatrixEditorProps> = React.memo(({
  title,
  columns,
  rows,
  onChangeTitle,
  onChangeColumns,
  onChangeRows,
}) => {
  const handleUpdateColumnTitle = (colIdx: number, newTitle: string) => {
    const nextCols = [...columns];
    nextCols[colIdx] = newTitle;
    onChangeColumns(nextCols);
  };

  const handleAddColumn = () => {
    const nextCols = [...columns, `Pilihan ${String.fromCharCode(65 + columns.length)}`];
    onChangeColumns(nextCols);
  };

  const handleRemoveColumn = (colIdx: number) => {
    if (columns.length <= 2) {
      message.warning('Minimal harus ada 2 kolom pilihan');
      return;
    }
    const nextCols = columns.filter((_, idx) => idx !== colIdx);
    const nextRows = rows.map(sub => {
      const currentCorrect = typeof sub.correct === 'number' ? sub.correct : 0;
      let newCorrect = currentCorrect;
      if (currentCorrect === colIdx) {
        newCorrect = 0;
      } else if (currentCorrect > colIdx) {
        newCorrect = currentCorrect - 1;
      }
      return { ...sub, correct: newCorrect };
    });
    onChangeColumns(nextCols);
    onChangeRows(nextRows);
  };

  const handleAddRow = () => {
    const newRow: SubQuestionTableRow = {
      id: Date.now().toString(),
      question: '',
      discussion: '',
      correct: 0,
      points: 1,
    };
    onChangeRows([...rows, newRow]);
  };

  const handleUpdateRow = (rowIdx: number, updatedRow: Partial<SubQuestionTableRow>) => {
    const nextRows = rows.map((r, idx) => (idx === rowIdx ? { ...r, ...updatedRow } : r));
    onChangeRows(nextRows);
  };

  const handleDeleteRow = (rowIdx: number) => {
    if (rows.length <= 1) {
      message.warning('Minimal harus ada 1 baris pernyataan');
      return;
    }
    const nextRows = rows.filter((_, idx) => idx !== rowIdx);
    onChangeRows(nextRows);
  };

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER & KOLOM CONFIGURATION ── */}
      <div className="p-5 bg-surface-low/50 dark:bg-zinc-800/60 rounded-3xl border border-on-surface/10 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <Title level={5} className="!m-0 !font-manrope !font-black text-on-surface">
              Pengaturan Kolom Tabel
            </Title>
            <Text className="text-xs text-on-surface/50">
              Sesuaikan judul kolom pernyataan dan nama-nama opsi kolom jawaban secara dinamis.
            </Text>
          </div>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            size="small"
            onClick={handleAddColumn}
            className="rounded-xl font-bold text-xs"
          >
            Tambah Kolom Opsi
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={10}>
            <Text className="text-[10px] font-black uppercase tracking-wider text-on-surface/50 block mb-1">
              Judul Kolom Pernyataan
            </Text>
            <Input
              value={title}
              onChange={e => onChangeTitle(e.target.value)}
              placeholder="Contoh: Pernyataan, Karakteristik, dll."
              className="rounded-xl font-semibold h-10 bg-white dark:bg-zinc-700"
            />
          </Col>

          <Col xs={24} sm={14}>
            <Text className="text-[10px] font-black uppercase tracking-wider text-on-surface/50 block mb-1">
              Kolom Pilihan Jawaban ({columns.length} Kolom)
            </Text>
            <div className="flex flex-wrap gap-2">
              {columns.map((colName, cIdx) => (
                <div key={cIdx} className="flex items-center gap-1.5 bg-white dark:bg-zinc-700 p-1 pl-3 rounded-xl border border-on-surface/10 shadow-sm">
                  <span className="font-black text-xs text-primary">{String.fromCharCode(65 + cIdx)}.</span>
                  <Input
                    value={colName}
                    onChange={e => handleUpdateColumnTitle(cIdx, e.target.value)}
                    placeholder={`Opsi ${String.fromCharCode(65 + cIdx)}`}
                    className="border-none shadow-none font-bold text-xs h-8 w-24 px-1"
                  />
                  {columns.length > 2 && (
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveColumn(cIdx)}
                      className="text-xs p-1 h-7 w-7"
                    />
                  )}
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </div>

      {/* ── 2. DAFTAR BARIS PERNYATAAN / SUB-SOAL ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <Title level={5} className="!m-0 !font-manrope !font-black text-on-surface">
              Daftar Baris Pernyataan ({rows.length} Baris)
            </Title>
            <Text className="text-xs text-on-surface/50">
              Tuliskan teks setiap baris pernyataan dan tentukan kolom jawaban yang benar.
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddRow}
            className="rounded-xl font-bold shadow-md shadow-primary/20"
          >
            Tambah Baris Pernyataan
          </Button>
        </div>

        <div className="space-y-5">
          {rows.map((row, rIdx) => {
            const currentCorrect = typeof row.correct === 'number' ? row.correct : 0;
            return (
              <div
                key={row.id || String(rIdx)}
                className="p-5 bg-white dark:bg-zinc-800/80 rounded-2xl border border-on-surface/10 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-on-surface/5">
                  <div className="flex items-center gap-3">
                    <Tag className="rounded-xl bg-primary text-white border-none font-black text-xs px-3 py-1">
                      Baris #{rIdx + 1}
                    </Tag>
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-low dark:bg-zinc-700 rounded-xl border border-on-surface/5">
                      <Text className="text-[10px] font-black uppercase text-on-surface/50">Poin</Text>
                      <InputNumber
                        size="small"
                        min={0}
                        value={row.points}
                        onChange={val => handleUpdateRow(rIdx, { points: Number(val) || 0 })}
                        className="w-16 rounded-lg font-bold text-xs"
                        controls={false}
                      />
                    </div>
                  </div>

                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    size="small"
                    onClick={() => handleDeleteRow(rIdx)}
                    className="hover:bg-red-50 dark:hover:bg-red-900/20 font-bold"
                  >
                    Hapus Baris
                  </Button>
                </div>

                <div>
                  <Text className="text-[10px] font-black uppercase tracking-wider text-on-surface/40 block mb-1">
                    Teks Pernyataan #{rIdx + 1}
                  </Text>
                  <KantanEditor
                    value={row.question}
                    onChange={val => handleUpdateRow(rIdx, { question: val })}
                    placeholder={`Tuliskan pernyataan untuk baris ke-${rIdx + 1}...`}
                    rows={3}
                    label={`Pernyataan #${rIdx + 1}`}
                  />
                  {hasPreviewContent(row.question) && (
                    <div className="mt-3 p-4 rounded-xl bg-surface-low/30 dark:bg-zinc-900/40 border border-on-surface/5">
                      <div className="flex items-center justify-between mb-2">
                        <Text className="text-[10px] font-black uppercase text-primary tracking-wider">Preview Pernyataan (KaTeX)</Text>
                        <Tag color="blue" className="rounded-full border-none text-[8px] font-black uppercase m-0">KaTeX</Tag>
                      </div>
                      <div className="blog-content kantan-quill-preview prose prose-sm dark:prose-invert max-w-none text-on-surface/90 dark:text-zinc-200 font-sans" dangerouslySetInnerHTML={{ __html: renderContent(row.question) }} />
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-surface-low/40 dark:bg-zinc-900/50 border border-on-surface/5">
                  <Text className="text-[10px] font-black uppercase tracking-wider text-on-surface/50 block mb-3">
                    Kunci Jawaban Benar Baris #{rIdx + 1}:
                  </Text>
                  <div className="flex flex-wrap items-center gap-3">
                    {columns.map((colName, cIdx) => {
                      const isSelected = currentCorrect === cIdx;
                      return (
                        <div
                          key={cIdx}
                          onClick={() => handleUpdateRow(rIdx, { correct: cIdx })}
                          className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-green-500/10 border-green-500 shadow-sm text-green-700 dark:text-green-300 font-bold'
                              : 'bg-white dark:bg-zinc-800 border-on-surface/10 text-on-surface/70 hover:border-primary/40'
                          }`}
                        >
                          <Radio
                            checked={isSelected}
                            onChange={() => handleUpdateRow(rIdx, { correct: cIdx })}
                          />
                          <span className="text-sm font-bold">
                            {colName || `Opsi ${String.fromCharCode(65 + cIdx)}`}
                          </span>
                          {isSelected && (
                            <Tag color="success" className="rounded-full border-none text-[9px] font-black uppercase m-0">
                              Kunci
                            </Tag>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Text className="text-[10px] font-black uppercase tracking-wider text-on-surface/40 block mb-1">
                    Pembahasan Baris #{rIdx + 1} (Opsional)
                  </Text>
                  <KantanEditor
                    value={row.discussion || ''}
                    onChange={val => handleUpdateRow(rIdx, { discussion: val })}
                    placeholder="Tuliskan alasan atau pembahasan untuk baris ini..."
                    rows={2}
                    label={`Pembahasan #${rIdx + 1}`}
                  />
                  {hasPreviewContent(row.discussion) && (
                    <div className="mt-3 p-4 rounded-xl bg-green-500/5 dark:bg-green-900/10 border border-green-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <Text className="text-[10px] font-black uppercase text-green-600 dark:text-green-400 tracking-wider">Preview Pembahasan (KaTeX)</Text>
                        <Tag color="green" className="rounded-full border-none text-[8px] font-black uppercase m-0">KaTeX</Tag>
                      </div>
                      <div className="blog-content kantan-quill-preview prose prose-sm dark:prose-invert max-w-none text-green-800 dark:text-green-300 font-sans" dangerouslySetInnerHTML={{ __html: renderContent(row.discussion || '') }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ─── COMPONENT: Table Question Editor (Parent) ──────────────
interface TableQuestionEditorProps {
  question: Question;
  onUpdate: (updatedQuestion: Partial<Question>) => void;
}

const TableQuestionEditor: React.FC<TableQuestionEditorProps> = React.memo(({
  question,
  onUpdate,
}) => {
  const columns = question.options && question.options.length >= 2 ? question.options : ['Benar', 'Salah'];
  const statementTitle = question.title || 'Pernyataan';
  const rows: SubQuestionTableRow[] = (question.subQuestions || []).map((s, idx) => ({
    id: s.id || String(idx + 1),
    question: s.question || '',
    discussion: s.discussion || '',
    correct: typeof s.correct === 'number' ? s.correct : 0,
    points: s.points || 1,
  }));

  return (
    <TableMatrixEditor
      title={statementTitle}
      columns={columns}
      rows={rows}
      onChangeTitle={newTitle => onUpdate({ title: newTitle })}
      onChangeColumns={nextCols => onUpdate({ options: nextCols })}
      onChangeRows={nextRows => onUpdate({
        subQuestions: nextRows.map(r => ({
          id: r.id,
          type: 'single',
          question: r.question,
          discussion: r.discussion || '',
          options: [],
          correct: r.correct,
          points: r.points,
        }))
      })}
    />
  );
});

// ─── COMPONENT: Sub-Question Editor ─────────────────────────
interface SubQuestionEditorProps {
  sub: SubQuestion;
  index: number;
  onUpdate: (updatedSub: SubQuestion) => void;
  onDelete: () => void;
}

const SubQuestionEditor: React.FC<SubQuestionEditorProps> = React.memo(({
  sub,
  index,
  onUpdate,
  onDelete,
}) => {
  const subType: QuestionType = sub.type || 'single';
  const options = (sub.options && sub.options.length > 0) ? sub.options : ['', '', '', '', ''];
  const correctIndexes = getCorrectIndexes(sub.correct);
  const rows: SubQuestionTableRow[] = (sub.rows && sub.rows.length > 0)
    ? sub.rows
    : [
        { id: '1', question: '', discussion: '', correct: 0, points: 1 },
        { id: '2', question: '', discussion: '', correct: 1, points: 1 },
      ];
  const tableCols = (sub.options && sub.options.length >= 2) ? sub.options : ['Benar', 'Salah'];

  const handleTypeChange = (newType: QuestionType) => {
    if (newType === 'table') {
      const defaultRows: SubQuestionTableRow[] = (sub.rows && sub.rows.length > 0) ? sub.rows : [
        { id: '1', question: '', discussion: '', correct: 0, points: 1 },
        { id: '2', question: '', discussion: '', correct: 1, points: 1 },
      ];
      const defaultCols = (sub.options && sub.options.length >= 2) ? sub.options : ['Benar', 'Salah'];
      const totalPts = defaultRows.reduce((s, r) => s + (Number(r.points) || 0), 0);
      onUpdate({
        ...sub,
        type: 'table',
        title: sub.title || 'Pernyataan',
        options: defaultCols,
        rows: defaultRows,
        points: totalPts,
      });
    } else if (newType === 'multiple') {
      const nextOpts = (!sub.options || sub.options.length < 2) ? ['', '', '', '', ''] : sub.options;
      const currentCorrectArr = getCorrectIndexes(sub.correct);
      const nextCorrect = currentCorrectArr.length > 0 ? currentCorrectArr : [0];
      onUpdate({
        ...sub,
        type: 'multiple',
        options: nextOpts,
        correct: nextCorrect,
        scoringMethod: sub.scoringMethod || 'all_or_nothing',
        points: sub.points || 1,
      });
    } else {
      // single
      const nextOpts = (!sub.options || sub.options.length < 2) ? ['', '', '', '', ''] : sub.options;
      const singleCorrect = Array.isArray(sub.correct) ? (sub.correct[0] ?? 0) : (typeof sub.correct === 'number' ? sub.correct : 0);
      onUpdate({
        ...sub,
        type: 'single',
        options: nextOpts,
        correct: singleCorrect,
        points: sub.points || 1,
      });
    }
  };

  const toggleCorrect = (oi: number) => {
    if (subType === 'single') {
      onUpdate({ ...sub, correct: oi });
    } else if (subType === 'multiple') {
      const current = getCorrectIndexes(sub.correct);
      let next: number[];
      if (current.includes(oi)) {
        if (current.length === 1) {
          message.warning('Minimal harus ada 1 jawaban benar');
          return;
        }
        next = current.filter(i => i !== oi);
      } else {
        next = [...current, oi].sort((a, b) => a - b);
      }
      onUpdate({ ...sub, correct: next });
    }
  };

  const handleAddOption = () => {
    onUpdate({ ...sub, options: [...options, ''] });
  };

  const handleRemoveOption = (oi: number) => {
    if (options.length <= 2) {
      message.warning('Minimal harus ada 2 opsi pilihan');
      return;
    }
    const nextOptions = options.filter((_, idx) => idx !== oi);
    if (subType === 'single') {
      let nextCorrect = typeof sub.correct === 'number' ? sub.correct : 0;
      if (nextCorrect === oi) {
        nextCorrect = 0;
      } else if (nextCorrect > oi) {
        nextCorrect -= 1;
      }
      onUpdate({ ...sub, options: nextOptions, correct: nextCorrect });
    } else {
      const current = getCorrectIndexes(sub.correct);
      const filtered = current.filter(i => i !== oi).map(i => i > oi ? i - 1 : i);
      const nextCorrect = filtered.length > 0 ? filtered : [0];
      onUpdate({ ...sub, options: nextOptions, correct: nextCorrect });
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-800/90 rounded-3xl border border-on-surface/10 mb-8 relative group shadow-sm space-y-6">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-on-surface/5">
        <div className="flex items-center gap-3 flex-wrap">
          <Tag className="rounded-xl bg-primary text-white border-none font-black px-4 py-1.5 text-xs">
            Pertanyaan #{index + 1}
          </Tag>

          {/* Question Type Selector */}
          <div className="flex items-center gap-2">
            <Text className="text-[10px] font-black uppercase tracking-wider text-on-surface/40">Tipe:</Text>
            <Select
              value={subType}
              onChange={handleTypeChange}
              options={[
                { value: 'single', label: 'Single Choice' },
                { value: 'multiple', label: 'Multiple Choice' },
                { value: 'table', label: 'Tabel / Pernyataan' },
              ]}
              className="w-44 font-bold rounded-xl"
            />
          </div>

          {/* Points */}
          <div className="flex items-center gap-2 px-3 py-1 bg-on-surface/5 rounded-xl border border-on-surface/10">
            <Text className="text-[10px] font-black uppercase text-on-surface/40">Poin</Text>
            <InputNumber
              size="small"
              min={0}
              value={subType === 'table' ? rows.reduce<number>((s, r) => s + (Number(r.points) || 0), 0) : sub.points}
              disabled={subType === 'table'}
              addonAfter={subType === 'table' ? 'auto' : undefined}
              onChange={val => onUpdate({ ...sub, points: Number(val) || 0 })}
              className="w-20 rounded-lg font-bold text-xs"
              controls={false}
            />
          </div>

          {/* Scoring Method (for multiple choice) */}
          {subType === 'multiple' && (
            <div className="flex items-center gap-2">
              <Text className="text-[10px] font-black uppercase text-on-surface/40">Skor:</Text>
              <Select
                value={sub.scoringMethod || 'all_or_nothing'}
                onChange={val => onUpdate({ ...sub, scoringMethod: val as ScoringMethod })}
                options={[
                  { value: 'all_or_nothing', label: 'Semua Benar (All or Nothing)' },
                  { value: 'partial', label: 'Parsial (Proporsional)' },
                ]}
                className="w-48 text-xs font-semibold rounded-xl"
              />
            </div>
          )}
        </div>

        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          size="middle"
          className="hover:bg-red-50 dark:hover:bg-red-900/20 font-bold"
          onClick={onDelete}
        >
          Hapus Soal
        </Button>
      </div>

      {/* QUESTION BODY DEPENDING ON TYPE */}
      {subType === 'table' ? (
        <div className="space-y-6">
          {/* Table Instructions / Prompt */}
          <div>
            <Text className="text-[10px] font-black uppercase tracking-wider text-on-surface/40 block mb-1">
              Petunjuk / Soal Pengantar Tabel #{index + 1}
            </Text>
            <KantanEditor
              value={sub.question}
              onChange={val => onUpdate({ ...sub, question: val })}
              placeholder="Contoh: Berdasarkan teks bacaan di samping, tentukan apakah pernyataan-pernyataan berikut Benar atau Salah..."
              rows={3}
              label={`Petunjuk Soal #${index + 1}`}
            />
            {hasPreviewContent(sub.question) && (
              <div className="mt-3 p-4 rounded-2xl bg-surface-low/30 dark:bg-zinc-900/40 border border-on-surface/5">
                <div className="flex items-center justify-between mb-2">
                  <Text className="text-[10px] font-black uppercase text-primary tracking-wider">Preview Petunjuk (KaTeX)</Text>
                  <Tag color="blue" className="rounded-full border-none text-[8px] font-black uppercase m-0">KaTeX</Tag>
                </div>
                <div className="blog-content kantan-quill-preview prose prose-sm dark:prose-invert max-w-none text-on-surface/90 dark:text-zinc-200 font-sans" dangerouslySetInnerHTML={{ __html: renderContent(sub.question) }} />
              </div>
            )}
          </div>

          {/* Interactive Table Matrix Editor */}
          <TableMatrixEditor
            title={sub.title || 'Pernyataan'}
            columns={tableCols}
            rows={rows}
            onChangeTitle={newTitle => onUpdate({ ...sub, title: newTitle })}
            onChangeColumns={nextCols => onUpdate({ ...sub, options: nextCols })}
            onChangeRows={nextRows => {
              const totalPts = nextRows.reduce<number>((s, r) => s + (Number(r.points) || 0), 0);
              onUpdate({ ...sub, rows: nextRows, points: totalPts });
            }}
          />

          {/* Overall discussion for table */}
          <div>
            <Text className="text-[10px] font-black uppercase tracking-wider text-on-surface/40 block mb-1">
              Pembahasan Umum Soal Tabel #{index + 1} (Opsional)
            </Text>
            <KantanEditor
              value={sub.discussion || ''}
              onChange={val => onUpdate({ ...sub, discussion: val })}
              placeholder="Tuliskan rangkuman pembahasan untuk soal tabel ini..."
              rows={2}
              label={`Pembahasan Tabel #${index + 1}`}
            />
            {hasPreviewContent(sub.discussion) && (
              <div className="mt-3 p-4 rounded-2xl bg-green-500/5 dark:bg-green-900/10 border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Text className="text-[10px] font-black uppercase text-green-600 dark:text-green-400 tracking-wider">Preview Pembahasan (KaTeX)</Text>
                  <Tag color="green" className="rounded-full border-none text-[8px] font-black uppercase m-0">KaTeX</Tag>
                </div>
                <div className="blog-content kantan-quill-preview prose prose-sm dark:prose-invert max-w-none text-green-800 dark:text-green-300 font-sans" dangerouslySetInnerHTML={{ __html: renderContent(sub.discussion || '') }} />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Single or Multiple Choice */
        <div className="space-y-6">
          {/* Question Text */}
          <div>
            <Text className="text-[10px] font-black uppercase tracking-wider text-on-surface/40 block mb-1">
              Pertanyaan #{index + 1}
            </Text>
            <KantanEditor
              value={sub.question}
              onChange={val => onUpdate({ ...sub, question: val })}
              placeholder="Tulis pertanyaan sub-soal di sini..."
              rows={3}
              label={`Pertanyaan #${index + 1}`}
            />
            {hasPreviewContent(sub.question) && (
              <div className="mt-3 p-4 rounded-xl bg-surface-low/30 dark:bg-zinc-900/40 border border-on-surface/5">
                <div className="flex items-center justify-between mb-2">
                  <Text className="text-[10px] font-black uppercase text-on-surface/40 tracking-wider">Live Preview Sub-Pertanyaan (LaTeX)</Text>
                  <Tag color="blue" className="rounded-full border-none text-[8px] font-black uppercase m-0">KaTeX</Tag>
                </div>
                <div className="blog-content kantan-quill-preview prose prose-sm dark:prose-invert max-w-none font-sans text-on-surface/90 dark:text-zinc-200" dangerouslySetInnerHTML={{ __html: renderContent(sub.question) }} />
              </div>
            )}
          </div>

          {/* Options Header */}
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-xs font-black uppercase tracking-wider text-on-surface/50 block">
                Opsi Pilihan Jawaban & Kunci
              </Text>
              <Text className="text-[11px] text-on-surface/40">
                {subType === 'single' ? 'Pilih 1 opsi yang merupakan kunci jawaban benar.' : 'Centang semua opsi yang merupakan kunci jawaban benar.'}
              </Text>
            </div>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              size="small"
              onClick={handleAddOption}
              className="rounded-xl font-bold text-xs"
            >
              Tambah Opsi
            </Button>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3">
            {options.map((opt, oi) => {
              const isCorrect = subType === 'single' ? sub.correct === oi : correctIndexes.includes(oi);
              return (
                <div key={oi} className="flex flex-col gap-1.5 p-3 rounded-2xl border transition-all bg-surface-low/30 dark:bg-zinc-900/40 border-on-surface/5">
                  <div className="flex items-start gap-3">
                    {subType === 'single' ? (
                      <Radio
                        checked={sub.correct === oi}
                        onChange={() => toggleCorrect(oi)}
                        className="scale-110 mt-2.5"
                      />
                    ) : (
                      <Checkbox
                        checked={correctIndexes.includes(oi)}
                        onChange={() => toggleCorrect(oi)}
                        className="scale-110 mt-2.5"
                      />
                    )}
                    <div
                      onClick={() => toggleCorrect(oi)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs cursor-pointer border-2 shadow-sm transition-all shrink-0 mt-0.5 ${
                        isCorrect
                          ? 'bg-green-500 border-green-500 text-white shadow-green-500/20'
                          : 'bg-white dark:bg-zinc-700 border-on-surface/10 text-on-surface/50 hover:border-primary/40'
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}
                    </div>
                    <div className="flex-1">
                      <KantanEditor
                        value={opt}
                        onChange={val => {
                          const nextOptions = options.map((o, idx) => (idx === oi ? val : o));
                          onUpdate({ ...sub, options: nextOptions });
                        }}
                        placeholder={`Opsi ${String.fromCharCode(65 + oi)}`}
                        rows={2}
                        className="w-full"
                      />
                    </div>
                    {options.length > 2 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleRemoveOption(oi)}
                        className="mt-1 hover:bg-red-50 dark:hover:bg-red-900/20"
                      />
                    )}
                  </div>
                  {hasPreviewContent(opt) && (
                    <div className="ml-16 px-3.5 py-1.5 bg-primary/5 rounded-xl border border-primary/10 text-xs blog-content kantan-quill-preview prose prose-xs dark:prose-invert max-w-none kantan-option-math">
                      <span className="font-bold text-primary mr-1.5 text-xs">{String.fromCharCode(65 + oi)}.</span>
                      <div className="inline-block" dangerouslySetInnerHTML={{ __html: renderContent(opt) }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Discussion */}
          <div>
            <Text className="text-[10px] font-black uppercase text-on-surface/40 block mb-1">Pembahasan Singkat Sub-Soal #{index + 1}</Text>
            <KantanEditor
              value={sub.discussion}
              onChange={val => onUpdate({ ...sub, discussion: val })}
              placeholder="Tulis pembahasan singkat sub-soal di sini..."
              rows={3}
              label={`Pembahasan #${index + 1}`}
            />
            {hasPreviewContent(sub.discussion) && (
              <div className="mt-3 p-4 rounded-xl bg-green-500/5 dark:bg-green-900/10 border border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Text className="text-[10px] font-black uppercase text-green-600/70 dark:text-green-400/70 tracking-wider">Preview Pembahasan Sub-Soal (LaTeX)</Text>
                  <Tag color="green" className="rounded-full border-none text-[8px] font-black uppercase m-0">KaTeX</Tag>
                </div>
                <div className="blog-content kantan-quill-preview prose prose-sm dark:prose-invert max-w-none text-green-800 dark:text-green-300" dangerouslySetInnerHTML={{ __html: renderContent(sub.discussion) }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

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
  const activeQ = questions[activeQIndex] || {
    id: '1',
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

  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const getScenarioPoints = (question: Question) =>
    (question.subQuestions || []).reduce((sum, sub) => {
      if (sub.type === 'table') {
        const rowSum = (sub.rows || []).reduce((rSum, r) => rSum + (Number(r.points) || 0), 0);
        return sum + (rowSum || sub.points || 0);
      }
      return sum + (Number(sub.points) || 0);
    }, 0);

  const getEffectivePoints = (question: Question) =>
    (question.type === 'nested' || question.type === 'table' || question.type === 'linked') ? getScenarioPoints(question) : question.points;

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
      title: sub.title || '',
      question: sub.question,
      discussion: sub.discussion,
      options: sub.options || (sub.type === 'table' ? ['Benar', 'Salah'] : []),
      correct: normalizeCorrectForType(sub.type || 'single', sub.correct),
      rows: sub.rows || [],
      scoring_method: sub.type === 'multiple' ? (sub.scoringMethod || 'all_or_nothing') : 'all_or_nothing',
      points: sub.type === 'table'
        ? (sub.rows || []).reduce((rSum, r) => rSum + (Number(r.points) || 0), 0)
        : (Number(sub.points) || 0),
    })),
  });

  const deserializeQuestion = (question: any): Question => {
    let opts = question.options || [];
    if (question.type === 'table' && (!opts || opts.length < 2 || opts.every((o: string) => !o))) {
      opts = ['Benar', 'Salah'];
    }
    return {
      id: question.id,
      type: question.type,
      title: question.title || (question.type === 'table' ? 'Pernyataan' : ''),
      question: question.question,
      discussion: question.discussion,
      options: opts,
      correct: normalizeCorrectForType(question.type, question.correct),
      discussionRefs: question.discussion_refs || [],
      points: question.points,
      scoringMethod: question.scoring_method || 'all_or_nothing',
      subQuestions: (question.sub_questions || []).map((sub: any) => ({
        ...sub,
        type: sub.type || 'single',
        title: sub.title || (sub.type === 'table' ? 'Pernyataan' : ''),
        options: sub.options || (sub.type === 'table' ? ['Benar', 'Salah'] : ['', '', '', '', '']),
        correct: normalizeCorrectForType(sub.type || 'single', sub.correct),
        rows: sub.rows || [],
        scoringMethod: sub.scoring_method || 'all_or_nothing',
        points: sub.type === 'table'
          ? (sub.rows && sub.rows.length > 0
              ? sub.rows.reduce((rSum: number, r: any) => rSum + (Number(r.points) || 0), 0)
              : Number(sub.points) || 1)
          : Number(sub.points) || 1,
      })),
    };
  };

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

  const duplicateActiveQuestion = () => {
    const cloned: Question = {
      ...JSON.parse(JSON.stringify(activeQ)),
      id: Date.now().toString(),
      title: activeQ.title ? `${activeQ.title} (Salinan)` : '',
    };
    setQuestions(prev => {
      const next = [...prev];
      next.splice(activeQIndex + 1, 0, cloned);
      return next;
    });
    setActiveQIndex(activeQIndex + 1);
    message.success(`Soal #${activeQIndex + 1} berhasil diduplikasi!`);
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

  const effectiveQuestionsCount = useMemo(() => {
    let total = 0;
    for (const q of questions) {
      if (q.type === 'linked' && q.subQuestions && q.subQuestions.length > 0) {
        total += q.subQuestions.length;
      } else {
        total += 1;
      }
    }
    return total;
  }, [questions]);

  const tabItems = [
    {
      key: 'soal',
      label: (
        <span className="flex items-center gap-2">
          <ExperimentOutlined /> Soal ({effectiveQuestionsCount !== questions.length ? `${questions.length} paket / ${effectiveQuestionsCount} nomor` : questions.length})
        </span>
      ),
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
                      className={`h-10 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer transition-all border-2 relative
                        ${activeQIndex === i
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                          : 'bg-white dark:bg-zinc-800 border-transparent text-on-surface/60 hover:border-primary/30'}`}
                    >
                      {i + 1}
                      {q.type === 'linked' && (
                        <span
                          title={`Soal Berhubungan (${q.subQuestions?.length || 0} sub-soal)`}
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 border border-white dark:border-zinc-900"
                        />
                      )}
                    </div>
                  ))}
                  <div onClick={addQuestion} className="h-10 rounded-xl border-2 border-dashed border-primary/20 flex items-center justify-center text-primary/40 hover:text-primary hover:border-primary/40 cursor-pointer transition-all">
                    <PlusOutlined />
                  </div>
                </div>
                {effectiveQuestionsCount !== questions.length && (
                  <div className="px-2 pt-3 text-[11px] font-bold text-green-600 dark:text-green-400">
                    Total butir ujian: {effectiveQuestionsCount} nomor
                  </div>
                )}
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
                      onChange={val => {
                        const newType = val as QuestionType;
                        let newOptions = activeQ.options;
                        let newTitle = activeQ.title;
                        let newSubQuestions = activeQ.subQuestions;

                        if (newType === 'table') {
                          newTitle = activeQ.title || 'Pernyataan';
                          if (!newOptions || newOptions.length < 2 || newOptions.every(o => !o)) {
                            newOptions = ['Benar', 'Salah'];
                          } else {
                            newOptions = newOptions.filter(o => o.trim() !== '');
                            if (newOptions.length < 2) newOptions = ['Benar', 'Salah'];
                          }
                          if (!newSubQuestions || newSubQuestions.length === 0) {
                            newSubQuestions = [
                              { id: '1', type: 'single', question: '', discussion: '', options: [], correct: 0, points: 1 },
                              { id: '2', type: 'single', question: '', discussion: '', options: [], correct: 1, points: 1 },
                              { id: '3', type: 'single', question: '', discussion: '', options: [], correct: 0, points: 1 },
                            ];
                          }
                        } else if (newType === 'nested') {
                          if (!newSubQuestions || newSubQuestions.length === 0) {
                            newSubQuestions = [{ id: '1', type: 'single', question: '', discussion: '', options: ['', '', '', '', ''], correct: 0, points: 1 }];
                          }
                        } else if (newType === 'linked') {
                          newTitle = activeQ.title || 'Teks Bacaan';
                          if (!newSubQuestions || newSubQuestions.length === 0) {
                            newSubQuestions = [
                              { id: '1', type: 'single', question: '', discussion: '', options: ['', '', '', '', ''], correct: 0, points: 1 },
                              { id: '2', type: 'single', question: '', discussion: '', options: ['', '', '', '', ''], correct: 0, points: 1 },
                              { id: '3', type: 'single', question: '', discussion: '', options: ['', '', '', '', ''], correct: 0, points: 1 },
                            ];
                          }
                        } else {
                          if (!newOptions || newOptions.length < 2) {
                            newOptions = ['', '', '', '', ''];
                          }
                        }

                        updateActiveQ({
                          type: newType,
                          title: newTitle,
                          options: newOptions,
                          correct: newType === 'multiple' ? getCorrectIndexes(activeQ.correct) : normalizeCorrectForType(newType, activeQ.correct),
                          points: (newType === 'nested' || newType === 'table' || newType === 'linked') ? getScenarioPoints({ ...activeQ, subQuestions: newSubQuestions }) : activeQ.points || 1,
                          scoringMethod: newType === 'multiple' ? activeQ.scoringMethod : 'all_or_nothing',
                          subQuestions: newSubQuestions,
                        });
                      }}
                      options={[
                        { value: 'single', label: 'Single Choice' },
                        { value: 'multiple', label: 'Multiple Choice' },
                        { value: 'nested', label: 'Scenario Based' },
                        { value: 'table', label: 'Tabel / Pernyataan' },
                        { value: 'linked', label: '📖 Soal Berhubungan (Passage)' },
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
                      disabled={activeQ.type === 'nested' || activeQ.type === 'table' || activeQ.type === 'linked'}
                      onChange={val => updateActiveQ({ points: Number(val) || 0 })}
                      addonAfter={(activeQ.type === 'nested' || activeQ.type === 'table' || activeQ.type === 'linked') ? 'auto' : undefined}
                      placeholder="1"
                    />
                    {(activeQ.type === 'nested' || activeQ.type === 'table' || activeQ.type === 'linked') && (
                      <Text className="text-[10px] text-on-surface/40 font-bold mt-1 block">
                        Total otomatis: {getScenarioPoints(activeQ)} poin dari sub-soal / baris.
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
                    {activeQ.type === 'nested' ? 'Isi Cerita / Skenario' : activeQ.type === 'table' ? 'Petunjuk / Soal Utama' : activeQ.type === 'linked' ? 'Teks Bacaan / Passage' : 'Pertanyaan'}
                  </Text>
                  <KantanEditor
                    value={activeQ.question}
                    onChange={(val) => updateActiveQ({ question: val })}
                    placeholder={activeQ.type === 'nested' ? 'Tuliskan cerita, paragraf, atau skenario di sini...' : activeQ.type === 'table' ? 'Tuliskan pengantar soal atau petunjuk tabel di sini...' : activeQ.type === 'linked' ? 'Tuliskan teks bacaan / passage di sini. Teks ini akan ditampilkan di semua soal yang berhubungan...' : 'Tuliskan teks pertanyaan...'}
                    rows={activeQ.type === 'nested' || activeQ.type === 'table' || activeQ.type === 'linked' ? 8 : 5}
                    label="Rich Question Editor"
                  />
                  {hasPreviewContent(activeQ.question) && (
                    <div className="mt-4 p-5 rounded-2xl bg-surface-low/30 dark:bg-zinc-800/50 border border-on-surface/5">
                      <div className="flex items-center justify-between mb-3">
                        <Text className="text-[10px] font-black uppercase tracking-wider text-primary">Live Preview Pertanyaan (LaTeX Rendered)</Text>
                        <Tag color="blue" className="rounded-full border-none text-[8px] font-black uppercase">Rendered KaTeX</Tag>
                      </div>
                      <div className="blog-content kantan-quill-preview prose prose-base dark:prose-invert max-w-none font-sans text-on-surface/90 dark:text-zinc-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderContent(activeQ.question) }} />
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
                  <div className="mt-4 p-5 rounded-2xl bg-green-500/5 dark:bg-green-900/10 border border-green-500/20 min-h-[88px]">
                    <div className="flex items-center justify-between mb-3">
                      <Text className="text-[10px] font-black uppercase tracking-wider text-green-600 dark:text-green-400">Preview Pembahasan (LaTeX Rendered)</Text>
                      <Tag color="green" className="rounded-full border-none text-[8px] font-black uppercase">KaTeX</Tag>
                    </div>
                    {hasPreviewContent(activeQ.discussion) ? (
                      <div className="blog-content kantan-quill-preview prose prose-base dark:prose-invert max-w-none text-green-800 dark:text-green-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderContent(activeQ.discussion) }} />
                    ) : (
                      <Text className="text-xs text-on-surface/40 font-bold">Preview pembahasan akan muncul di sini.</Text>
                    )}
                  </div>
                </div>

                {activeQ.type === 'table' ? (
                  <TableQuestionEditor
                    question={activeQ}
                    onUpdate={updateActiveQ}
                  />
                ) : activeQ.type === 'nested' ? (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <Title level={5} className="!m-0 !font-manrope !font-black">Sub-Pertanyaan</Title>
                      <Button type="primary" ghost icon={<PlusOutlined />} onClick={addSubQuestion} className="rounded-xl font-bold">Tambah Sub-Soal</Button>
                    </div>
                    <div className="space-y-4">
                      {activeQ.subQuestions?.map((sub, si) => (
                        <SubQuestionEditor
                          key={sub.id || String(si)}
                          sub={sub}
                          index={si}
                          onUpdate={updatedSub => {
                            const next = (activeQ.subQuestions || []).map(s => s.id === sub.id ? updatedSub : s);
                            updateActiveQ({ subQuestions: next });
                          }}
                          onDelete={() => {
                            updateActiveQ({ subQuestions: activeQ.subQuestions?.filter(s => s.id !== sub.id) });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : activeQ.type === 'linked' ? (
                  <div className="mt-8">
                    {/* Linked type info banner */}
                    <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 flex gap-3">
                      <span className="text-2xl">📖</span>
                      <div>
                        <Text className="font-black text-blue-700 dark:text-blue-300 block text-sm">Soal Berhubungan (Passage)</Text>
                        <Text className="text-xs text-blue-600/80 dark:text-blue-400/80">
                          Teks bacaan di atas akan ditampilkan sebagai panel kiri yang sticky. Setiap soal di bawah ini akan muncul sebagai <strong>nomor soal terpisah</strong> di peta ujian.
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Title level={5} className="!m-0 !font-manrope !font-black">Soal-Soal ({activeQ.subQuestions?.length || 0} nomor)</Title>
                        <Text className="text-xs text-on-surface/50">Setiap soal akan muncul sebagai nomor terpisah di peta ujian.</Text>
                      </div>
                      <Button type="primary" ghost icon={<PlusOutlined />} onClick={addSubQuestion} className="rounded-xl font-bold">Tambah Soal</Button>
                    </div>
                    <div className="space-y-4">
                      {activeQ.subQuestions?.map((sub, si) => (
                        <SubQuestionEditor
                          key={sub.id || String(si)}
                          sub={sub}
                          index={si}
                          onUpdate={updatedSub => {
                            const next = (activeQ.subQuestions || []).map(s => s.id === sub.id ? updatedSub : s);
                            updateActiveQ({ subQuestions: next });
                          }}
                          onDelete={() => {
                            if ((activeQ.subQuestions?.length || 0) <= 1) {
                              message.warning('Minimal harus ada 1 soal');
                              return;
                            }
                            updateActiveQ({ subQuestions: activeQ.subQuestions?.filter(s => s.id !== sub.id) });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Text className="text-xs font-black uppercase tracking-widest text-on-surface/40 block mb-2">Opsi Jawaban & Kunci</Text>
                    <div className="grid grid-cols-1 gap-4">
                      {activeQ.options.map((opt, i) => {
                        const isCorrect = activeQ.type === 'single' ? activeQ.correct === i : getCorrectIndexes(activeQ.correct).includes(i);
                        return (
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
                            <div className={`flex-1 flex flex-col p-2.5 rounded-2xl border-2 transition-all 
                              ${isCorrect
                                ? 'bg-green-50/60 dark:bg-green-900/15 border-green-500/50 shadow-sm'
                                : 'bg-surface-low/50 dark:bg-zinc-800/80 border-transparent hover:border-on-surface/10'}`}>
                              <div className="flex items-start gap-3">
                                <div
                                  onClick={() => toggleCorrect(i)}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border-2 mt-1 cursor-pointer transition-all
                                   ${isCorrect
                                    ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-500/20'
                                    : 'bg-white dark:bg-zinc-700 border-on-surface/10 text-on-surface/40 hover:border-primary/40'}`}>
                                  {String.fromCharCode(65 + i)}
                                </div>
                                <div className="flex-1">
                                  <KantanEditor
                                    value={opt}
                                    onChange={val => updateOption(i, val)}
                                    placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                                    rows={2}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                              {hasPreviewContent(opt) && (
                                <div className="ml-13 mt-2 px-3.5 py-2 bg-white/70 dark:bg-black/30 rounded-xl border border-primary/10 text-sm blog-content kantan-quill-preview prose prose-sm dark:prose-invert max-w-none kantan-option-math">
                                  <span className="font-bold text-primary mr-2 text-xs">{String.fromCharCode(65 + i)}.</span>
                                  <div className="inline-block" dangerouslySetInnerHTML={{ __html: renderContent(opt) }} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Divider className="my-10 border-on-surface/5" />

                <div className="flex items-center justify-between">
                  <Space>
                    <Button icon={<CopyOutlined />} onClick={duplicateActiveQuestion} className="rounded-xl font-bold h-11 px-6">Duplikat</Button>
                    <Button icon={<EyeOutlined />} onClick={async () => {
                      if (!id) { setPreviewModalOpen(true); return; }
                      try {
                        const saved = await savePackageQuestion(id, serializeQuestion(activeQ));
                        updateActiveQ(deserializeQuestion(saved));
                        message.success('Data soal disimpan, membuka pratinjau...');
                      } catch {
                        message.warning('Pratinjau menggunakan data lokal (gagal sinkron ke server).');
                      }
                      setPreviewModalOpen(true);
                    }} className="rounded-xl font-bold h-11 px-6">Pratinjau</Button>
                  </Space>
                  <Button type="primary" icon={<SaveOutlined />} size="large" className="rounded-2xl h-12 px-10 font-black shadow-xl shadow-primary/20"
                    onClick={saveActiveQuestion}>
                    Simpan Soal {activeQIndex + 1}
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>

          {/* ── PRATINJAU MODAL (STUDENT PERSPECTIVE) ── */}
          <Modal
            open={previewModalOpen}
            onCancel={() => setPreviewModalOpen(false)}
            footer={[
              <Button key="close" type="primary" className="rounded-xl font-bold px-6" onClick={() => setPreviewModalOpen(false)}>
                Tutup Pratinjau
              </Button>
            ]}
            width={780}
            title={
              <div className="flex items-center gap-3">
                <Tag className="rounded-full px-3 py-0.5 text-xs font-black border-none bg-primary/10 text-primary">
                  Pratinjau Soal #{activeQIndex + 1}
                </Tag>
                <Tag color="blue" className="rounded-full border-none font-bold text-xs capitalize">
                  {activeQ.type === 'single' ? 'Single Choice' : activeQ.type === 'multiple' ? 'Multiple Choice' : activeQ.type === 'table' ? 'Tabel / Pernyataan' : activeQ.type === 'linked' ? '📖 Soal Berhubungan' : 'Scenario Based'}
                </Tag>
                <Text className="text-xs text-on-surface/50 font-bold ml-auto mr-4">{getEffectivePoints(activeQ)} Poin</Text>
              </div>
            }
          >
            <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Scenario Passage (if nested or linked) */}
              {(activeQ.type === 'nested' || activeQ.type === 'linked') && (
                <div className="bg-surface-low/40 dark:bg-zinc-800/50 rounded-2xl p-6 border border-on-surface/5">
                  <Tag color={activeQ.type === 'linked' ? 'green' : 'blue'} className="mb-3 rounded-full border-none font-bold text-xs">
                    {activeQ.type === 'linked' ? '📖 Teks Bacaan / Passage' : (activeQ.title || 'Skenario Kasus')}
                  </Tag>
                  <div
                    className="blog-content kantan-quill-preview prose prose-base dark:prose-invert max-w-none text-on-surface/90 dark:text-zinc-200 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: renderContent(activeQ.question) }}
                  />
                </div>
              )}

              {/* Main Question (if not nested or linked) */}
              {activeQ.type !== 'nested' && activeQ.type !== 'linked' && (
                <div className="bg-white dark:bg-zinc-800/40 rounded-2xl p-6 border border-on-surface/10 shadow-sm">
                  {activeQ.title && (
                    <Tag color="blue" className="mb-3 rounded-full border-none font-bold text-xs">{activeQ.title}</Tag>
                  )}
                  <div
                    className="blog-content kantan-quill-preview prose prose-base dark:prose-invert max-w-none text-on-surface/90 dark:text-zinc-200 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: renderContent(activeQ.question) }}
                  />
                </div>
              )}

              {/* Table Question Preview */}
              {activeQ.type === 'table' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-on-surface/10 bg-white dark:bg-zinc-900 shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-low/70 dark:bg-zinc-800 border-b border-on-surface/10">
                          <th className="p-4 font-black text-sm text-on-surface">
                            {activeQ.title || 'Pernyataan'}
                          </th>
                          {(activeQ.options && activeQ.options.length > 0 ? activeQ.options : ['Benar', 'Salah']).map((col, ci) => (
                            <th key={ci} className="p-4 font-black text-sm text-center text-on-surface w-32 border-l border-on-surface/10">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-on-surface/5">
                        {(activeQ.subQuestions || []).map((sub, si) => {
                          const correctCol = typeof sub.correct === 'number' ? sub.correct : 0;
                          const colList = activeQ.options && activeQ.options.length > 0 ? activeQ.options : ['Benar', 'Salah'];
                          return (
                            <tr key={sub.id || si} className="hover:bg-surface-low/20 transition-colors">
                              <td className="p-4 align-middle">
                                <div
                                  className="blog-content kantan-quill-preview prose prose-sm dark:prose-invert max-w-none font-medium text-on-surface/90"
                                  dangerouslySetInnerHTML={{ __html: renderContent(sub.question || `Pernyataan baris ke-${si + 1}`) }}
                                />
                                <div className="mt-1">
                                  <span className="text-[10px] font-bold text-on-surface/40">{sub.points || 1} Poin</span>
                                </div>
                              </td>
                              {colList.map((_, ci) => {
                                const isKey = correctCol === ci;
                                return (
                                  <td key={ci} className="p-4 text-center align-middle border-l border-on-surface/10">
                                    <div className="flex justify-center items-center gap-1">
                                      <div
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                          isKey
                                            ? 'border-green-500 bg-green-500 text-white shadow-sm'
                                            : 'border-on-surface/20 bg-surface-low/50'
                                        }`}
                                      >
                                        {isKey && <div className="w-2 h-2 rounded-full bg-white" />}
                                      </div>
                                      {isKey && (
                                        <Tag color="success" className="rounded-full border-none text-[8px] font-black uppercase m-0">
                                          Kunci
                                        </Tag>
                                      )}
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
              )}

              {/* Options (if single/multiple) */}
              {(activeQ.type === 'single' || activeQ.type === 'multiple') && (
                <div className="space-y-3">
                  <Text className="text-xs font-black uppercase tracking-wider text-on-surface/40 block mb-1">Pilihan Jawaban:</Text>
                  {activeQ.options.map((opt, oi) => {
                    if (!opt && !hasPreviewContent(opt)) return null;
                    const isCorrect = activeQ.type === 'single' ? activeQ.correct === oi : getCorrectIndexes(activeQ.correct).includes(oi);
                    return (
                      <div
                        key={oi}
                        className={`p-4 rounded-2xl border-2 flex items-start gap-3 transition-all ${
                          isCorrect
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-900 dark:text-green-200'
                            : 'bg-white dark:bg-zinc-800 border-on-surface/10 text-on-surface/80'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                            isCorrect ? 'bg-green-500 text-white' : 'bg-surface-low dark:bg-zinc-700 text-on-surface/60'
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}
                        </div>
                        <div className="flex-1 pt-1 blog-content kantan-quill-preview prose prose-sm dark:prose-invert max-w-none font-sans" dangerouslySetInnerHTML={{ __html: renderContent(opt) }} />
                        {isCorrect && (
                          <Tag color="success" className="rounded-full border-none font-bold text-xs flex items-center gap-1 shrink-0 m-0">
                            <CheckCircleFilled /> Kunci Jawaban
                          </Tag>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sub-questions (if nested) */}
              {activeQ.type === 'nested' && (
                <div className="space-y-6">
                  {activeQ.subQuestions?.map((sub, si) => (
                    <div key={sub.id || si} className="p-5 rounded-2xl bg-white dark:bg-zinc-800/40 border border-on-surface/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <Tag className="rounded-lg bg-primary text-white border-none font-black text-xs px-3 py-0.5">
                          Sub-Soal #{si + 1}
                        </Tag>
                        <Text className="text-xs font-bold text-on-surface/50">{sub.points} Poin</Text>
                      </div>
                      <div
                        className="blog-content kantan-quill-preview prose prose-sm dark:prose-invert max-w-none text-on-surface/90 dark:text-zinc-200 font-sans"
                        dangerouslySetInnerHTML={{ __html: renderContent(sub.question) }}
                      />
                      <div className="space-y-2">
                        {sub.options.map((opt, oi) => {
                          if (!opt && !hasPreviewContent(opt)) return null;
                          const isCorrect = sub.correct === oi;
                          return (
                            <div
                              key={oi}
                              className={`p-3 rounded-xl border flex items-start gap-3 ${
                                isCorrect
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                                  : 'bg-surface-low/30 dark:bg-zinc-800 border-on-surface/5'
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isCorrect ? 'bg-green-500 text-white' : 'bg-surface-low dark:bg-zinc-700 text-on-surface/60'
                                }`}
                              >
                                {String.fromCharCode(65 + oi)}
                              </div>
                              <div className="flex-1 blog-content kantan-quill-preview prose prose-xs dark:prose-invert max-w-none font-sans" dangerouslySetInnerHTML={{ __html: renderContent(opt) }} />
                              {isCorrect && <Tag color="success" className="rounded-full border-none font-bold text-[10px]">Kunci</Tag>}
                            </div>
                          );
                        })}
                      </div>
                      {hasPreviewContent(sub.discussion) && (
                        <div className="p-3.5 rounded-xl bg-green-500/5 dark:bg-green-900/10 border border-green-500/20 text-xs">
                          <Text className="text-[10px] font-black uppercase text-green-600 block mb-1">Pembahasan Sub-Soal:</Text>
                          <div className="blog-content kantan-quill-preview prose prose-xs dark:prose-invert max-w-none text-green-800 dark:text-green-300" dangerouslySetInnerHTML={{ __html: renderContent(sub.discussion) }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-questions preview (if linked) */}
              {activeQ.type === 'linked' && (
                <div className="space-y-6">
                  <Text className="text-xs font-black uppercase tracking-wider text-on-surface/40 block">
                    Soal-Soal ({activeQ.subQuestions?.length || 0} nomor — masing-masing tampil sebagai nomor terpisah):
                  </Text>
                  {activeQ.subQuestions?.map((sub, si) => {
                    const subType = sub.type || 'single';
                    const correctIdxs = getCorrectIndexes(sub.correct);
                    const subPoints = subType === 'table'
                      ? (sub.rows || []).reduce((sum, r) => sum + (Number(r.points) || 0), 0)
                      : (sub.points || 1);

                    return (
                      <div key={sub.id || si} className="p-5 rounded-2xl bg-white dark:bg-zinc-800/40 border border-on-surface/10 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Tag className="rounded-lg bg-green-500 text-white border-none font-black text-xs px-3 py-0.5">
                              Soal #{si + 1}
                            </Tag>
                            <Tag color={subType === 'table' ? 'blue' : subType === 'multiple' ? 'purple' : 'cyan'} className="rounded-full border-none font-bold text-[11px] capitalize">
                              {subType === 'table' ? 'Tabel / Pernyataan' : subType === 'multiple' ? 'Multiple Choice' : 'Single Choice'}
                            </Tag>
                            {subType === 'multiple' && (
                              <Tag className="rounded-full border-none text-[10px] font-semibold bg-surface-low text-on-surface/60">
                                {sub.scoringMethod === 'partial' ? 'Parsial' : 'All or Nothing'}
                              </Tag>
                            )}
                          </div>
                          <Text className="text-xs font-bold text-on-surface/50">{subPoints} Poin</Text>
                        </div>

                        {/* Sub-question text / prompt */}
                        {sub.question && (
                          <div
                            className="blog-content kantan-quill-preview prose prose-sm dark:prose-invert max-w-none text-on-surface/90 dark:text-zinc-200 font-sans"
                            dangerouslySetInnerHTML={{ __html: renderContent(sub.question) }}
                          />
                        )}

                        {/* If table */}
                        {subType === 'table' ? (
                          <div className="overflow-x-auto rounded-xl border border-on-surface/10 bg-white dark:bg-zinc-900 shadow-xs">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-surface-low/70 dark:bg-zinc-800 border-b border-on-surface/10">
                                  <th className="p-3 font-black text-xs text-on-surface">
                                    {sub.title || 'Pernyataan'}
                                  </th>
                                  {(sub.options && sub.options.length > 0 ? sub.options : ['Benar', 'Salah']).map((col, ci) => (
                                    <th key={ci} className="p-3 font-black text-xs text-center text-on-surface w-28 border-l border-on-surface/10">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-on-surface/5">
                                {(sub.rows || []).map((row, ri) => {
                                  const correctCol = typeof row.correct === 'number' ? row.correct : 0;
                                  const colList = sub.options && sub.options.length > 0 ? sub.options : ['Benar', 'Salah'];
                                  return (
                                    <tr key={row.id || ri} className="hover:bg-surface-low/20 transition-colors">
                                      <td className="p-3 align-middle">
                                        <div
                                          className="blog-content kantan-quill-preview prose prose-xs dark:prose-invert max-w-none font-medium text-on-surface/90"
                                          dangerouslySetInnerHTML={{ __html: renderContent(row.question || `Pernyataan baris ke-${ri + 1}`) }}
                                        />
                                        <div className="mt-1">
                                          <span className="text-[10px] font-bold text-on-surface/40">{row.points || 1} Poin</span>
                                        </div>
                                      </td>
                                      {colList.map((_, ci) => {
                                        const isKey = correctCol === ci;
                                        return (
                                          <td key={ci} className="p-3 text-center align-middle border-l border-on-surface/10">
                                            <div className="flex justify-center items-center gap-1">
                                              <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                  isKey
                                                    ? 'border-green-500 bg-green-500 text-white shadow-sm'
                                                    : 'border-on-surface/20 bg-surface-low/50'
                                                }`}
                                              >
                                                {isKey && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                              </div>
                                              {isKey && (
                                                <Tag color="success" className="rounded-full border-none text-[8px] font-black uppercase m-0">
                                                  Kunci
                                                </Tag>
                                              )}
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
                        ) : (
                          /* Single or Multiple Options Preview */
                          <div className="space-y-2">
                            {(sub.options || []).map((opt, oi) => {
                              if (!opt && !hasPreviewContent(opt)) return null;
                              const isCorrect = subType === 'single'
                                ? sub.correct === oi
                                : correctIdxs.includes(oi);
                              return (
                                <div
                                  key={oi}
                                  className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                                    isCorrect
                                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                                      : 'bg-surface-low/30 dark:bg-zinc-800 border-on-surface/5'
                                  }`}
                                >
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                      isCorrect ? 'bg-green-500 text-white' : 'bg-surface-low dark:bg-zinc-700 text-on-surface/60'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + oi)}
                                  </div>
                                  <div className="flex-1 blog-content kantan-quill-preview prose prose-xs dark:prose-invert max-w-none font-sans" dangerouslySetInnerHTML={{ __html: renderContent(opt) }} />
                                  {isCorrect && <Tag color="success" className="rounded-full border-none font-bold text-[10px]">Kunci</Tag>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {hasPreviewContent(sub.discussion) && (
                          <div className="p-3.5 rounded-xl bg-green-500/5 dark:bg-green-900/10 border border-green-500/20 text-xs">
                            <Text className="text-[10px] font-black uppercase text-green-600 block mb-1">Pembahasan Sub-Soal:</Text>
                            <div className="blog-content kantan-quill-preview prose prose-xs dark:prose-invert max-w-none text-green-800 dark:text-green-300" dangerouslySetInnerHTML={{ __html: renderContent(sub.discussion) }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explanation (Discussion) Box */}
              {hasPreviewContent(activeQ.discussion) && (
                <div className="bg-green-500/5 dark:bg-green-900/10 rounded-2xl p-5 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircleFilled className="text-green-500 text-base" />
                    <Text className="font-bold text-sm text-green-700 dark:text-green-400">Pembahasan & Penjelasan Soal:</Text>
                  </div>
                  <div
                    className="blog-content kantan-quill-preview prose prose-sm dark:prose-invert max-w-none text-green-800 dark:text-green-300 font-sans leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderContent(activeQ.discussion) }}
                  />
                </div>
              )}
            </div>
          </Modal>
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
                          <div className="blog-content kantan-quill-preview prose dark:prose-invert max-w-none font-sans leading-relaxed" dangerouslySetInnerHTML={{ __html: renderContent(activeM.content) }} />
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
                      beforeUpload={() => false}
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
                    {hasPreviewContent(activeV.description) && (
                      <div className="mt-4 p-5 rounded-[2rem] bg-surface-low/30 dark:bg-zinc-800/50 border border-on-surface/5">
                        <Text className="text-[10px] font-black uppercase text-on-surface/30 block mb-3">Pratinjau Deskripsi</Text>
                        <div className="blog-content kantan-quill-preview prose prose-sm dark:prose-invert max-w-none font-sans" dangerouslySetInnerHTML={{ __html: renderContent(activeV.description) }} />
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
