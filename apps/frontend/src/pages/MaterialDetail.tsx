import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Breadcrumb, Button, Card, Divider, Row, Col } from 'antd';
import {
  ArrowLeftOutlined,
  BookOutlined,
  LeftOutlined,
  RightOutlined,
  FileTextOutlined,
  CheckCircleFilled,
  FilePdfOutlined,
} from '@ant-design/icons';
import AppLayout from '../layouts/AppLayout';

const { Title, Text } = Typography;

declare global { interface Window { katex?: any; renderMathInElement?: any; } }

// ── Same renderer as AdminMaterialForm ───────────────────────
const renderKaTeX = (latex: string, displayMode = false): string => {
  if (window.katex) {
    try {
      return window.katex.renderToString(latex, { displayMode, throwOnError: false });
    } catch { return latex; }
  }
  return `<span class="font-mono bg-blue-50 text-blue-700 px-1 rounded text-sm">${displayMode ? '$$' : '$'}${latex}${displayMode ? '$$' : '$'}</span>`;
};

const renderContent = (raw: string): string => {
  return raw
    .replace(/\$\$([^$]+)\$\$/g, (_, latex) => `<div class="my-6 py-4 flex justify-center overflow-x-auto">${renderKaTeX(latex, true)}</div>`)
    .replace(/\$([^$\n]+)\$/g, (_, latex) => renderKaTeX(latex, false))
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-on-surface dark:text-zinc-100">$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-black font-manrope mt-8 mb-3 text-on-surface dark:text-zinc-100">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-black font-manrope mt-10 mb-4 text-on-surface dark:text-zinc-100">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-black font-manrope mt-12 mb-5 text-on-surface dark:text-zinc-100">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 list-disc leading-relaxed">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-6 mb-2 list-decimal leading-relaxed">$2</li>')
    .replace(/`(.+?)`/g, '<code class="bg-surface-low dark:bg-zinc-800 px-2 py-0.5 rounded-md text-sm font-mono text-primary">$1</code>')
    .replace(/\n{2,}/g, '</p><p class="mb-5 leading-loose">');
};

// ── Mock data (later replaced by API) ────────────────────────
const syllabusItems = [
  { key: '1', label: 'Pengantar SNBT 2025', isCompleted: true },
  { key: '2', label: 'Konsep Turunan Fungsi', isCompleted: false },
  { key: '3', label: 'Penalaran Analitis: Silogisme', isCompleted: false },
  { key: '4', label: 'Manajemen Waktu Ujian', isCompleted: false },
  { key: '5', label: 'Latihan Soal Campuran', isCompleted: false },
];

const materialDatabase: Record<string, { body: string; category: string; date: string; pdfs: string[] }> = {
  '1': {
    category: 'Literasi Matematika',
    date: '25 April 2025',
    pdfs: ['Rangkuman-Turunan.pdf'],
    body: `## Pengantar

Dalam pembahasan kali ini, kita akan memahami konsep **turunan fungsi** yang sering muncul dalam soal SNBT.

### Rumus Dasar

Turunan fungsi $f(x)$ didefinisikan sebagai:

$$\\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$

### Contoh Soal

Tentukan turunan dari $f(x) = x^2 + 3x + 5$

**Penyelesaian:**

Gunakan aturan pangkat: jika $f(x) = x^n$ maka $f'(x) = n \\cdot x^{n-1}$

$$f'(x) = 2x + 3$$

Jadi turunan dari $f(x)$ adalah $f'(x) = 2x + 3$.

### Tips Ujian

- Hafalkan aturan rantai untuk fungsi komposit
- Latihan soal dengan timer untuk simulasi tekanan ujian
- Perhatikan syarat domain agar turunan valid`,
  },
  '2': {
    category: 'Literasi Matematika',
    date: '25 April 2025',
    pdfs: [],
    body: `## Trigonometri Dasar

Identitas trigonometri yang paling dasar adalah:

$$\\sin^2(x) + \\cos^2(x) = 1$$

Dari identitas ini dapat diturunkan:
- $\\tan^2(x) + 1 = \\sec^2(x)$
- $1 + \\cot^2(x) = \\csc^2(x)$

### Nilai Sudut Istimewa

| Sudut | sin | cos | tan |
|---|---|---|---|
| 0° | 0 | 1 | 0 |
| 30° | $\\frac{1}{2}$ | $\\frac{\\sqrt{3}}{2}$ | $\\frac{1}{\\sqrt{3}}$ |
| 45° | $\\frac{\\sqrt{2}}{2}$ | $\\frac{\\sqrt{2}}{2}$ | 1 |
| 60° | $\\frac{\\sqrt{3}}{2}$ | $\\frac{1}{2}$ | $\\sqrt{3}$ |
| 90° | 1 | 0 | ∞ |`,
  },
};

const MaterialDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentId = parseInt(id || '1');

  const meta = materialDatabase[id || '1'] || materialDatabase['1'];
  const currentSyllabus = syllabusItems.find(s => s.key === id);
  const title = currentSyllabus?.label || `Pembahasan Topik #${currentId}`;

  // Trigger KaTeX re-render on content change
  useEffect(() => {
    if (window.renderMathInElement) {
      const el = document.getElementById('materi-content');
      if (el) {
        window.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
          ],
          throwOnError: false,
        });
      }
    }
  }, [id]);

  const handleNext = () => { if (currentId < syllabusItems.length) navigate(`/materi/${currentId + 1}`); };
  const handlePrev = () => { if (currentId > 1) navigate(`/materi/${currentId - 1}`); };

  return (
    <AppLayout>
      <div className="min-h-screen bg-surface-low/30 dark:bg-zinc-950 transition-colors duration-500">
        <div className="py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Back bar */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                className="text-on-surface/60 hover:text-primary h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 hover:bg-primary/10 shadow-sm"
              />
              <div>
                <Breadcrumb className="text-[10px] uppercase tracking-widest font-bold text-on-surface/40 mb-1">
                  <Breadcrumb.Item className="cursor-pointer hover:text-primary" onClick={() => navigate('/latihan')}>Latihan</Breadcrumb.Item>
                  <Breadcrumb.Item className="cursor-pointer hover:text-primary" onClick={() => navigate(-1)}>Detail Paket</Breadcrumb.Item>
                </Breadcrumb>
                <Title level={4} className="!m-0 !font-black !font-manrope">Ruang Belajar</Title>
              </div>
            </div>

            <Row gutter={[32, 32]}>
              {/* ── Sidebar ── */}
              <Col xs={24} lg={7} xl={6}>
                <Card className="weightless-card border-none rounded-[2rem] p-2 sticky top-8 shadow-xl shadow-primary/5 bg-white dark:bg-zinc-900">
                  <div className="px-4 py-3 mb-2 border-b border-on-surface/5 dark:border-white/5">
                    <Text className="text-xs uppercase tracking-widest font-black text-on-surface/40">Daftar Materi</Text>
                  </div>
                  <div className="space-y-1 p-1">
                    {syllabusItems.map((item) => {
                      const isActive = item.key === id;
                      return (
                        <div
                          key={item.key}
                          onClick={() => navigate(`/materi/${item.key}`)}
                          className={`
                            flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
                            ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-surface-low dark:hover:bg-zinc-800 text-on-surface/70 dark:text-zinc-400'}
                          `}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-primary/20' : 'bg-surface-low dark:bg-zinc-700'}`}>
                            {item.isCompleted
                              ? <CheckCircleFilled className="text-green-500" />
                              : <FileTextOutlined className={isActive ? 'text-primary' : 'text-on-surface/40'} />
                            }
                          </div>
                          <span className={`text-sm line-clamp-2 leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </Col>

              {/* ── Main Content ── */}
              <Col xs={24} lg={17} xl={18}>
                <Card className="weightless-card border-none rounded-[2.5rem] shadow-2xl shadow-primary/5 bg-white dark:bg-zinc-900">
                  <div className="p-6 sm:p-10">
                    {/* Header */}
                    <div className="flex items-center gap-3 text-primary mb-6">
                      <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-xl">
                        <BookOutlined className="text-xl" />
                      </div>
                      <span className="text-xs uppercase tracking-widest font-bold">{meta.category}</span>
                    </div>

                    <Title level={1} className="!font-black !font-manrope !text-3xl md:!text-4xl !mb-2 leading-tight">
                      {title}
                    </Title>
                    <Text className="text-xs font-bold text-on-surface/30 dark:text-zinc-500 uppercase tracking-widest block mb-8">
                      Diperbarui: {meta.date}
                    </Text>

                    <Divider className="border-on-surface/10 dark:border-white/5 mb-8" />

                    {/* Rendered Body */}
                    <div
                      id="materi-content"
                      className="prose prose-lg dark:prose-invert max-w-none font-sans text-on-surface/80 dark:text-zinc-300"
                      dangerouslySetInnerHTML={{ __html: `<p class="mb-5 leading-loose">${renderContent(meta.body)}</p>` }}
                    />

                    {/* PDF attachments */}
                    {meta.pdfs.length > 0 && (
                      <>
                        <Divider className="border-on-surface/10 dark:border-white/5 mt-10 mb-6" />
                        <Text className="block text-xs uppercase font-black tracking-widest text-on-surface/40 dark:text-zinc-500 mb-3">
                          Berkas Lampiran
                        </Text>
                        <div className="space-y-2">
                          {meta.pdfs.map((pdf) => (
                            <div key={pdf} className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 cursor-pointer hover:shadow-md transition-all group">
                              <FilePdfOutlined className="text-red-500 text-2xl shrink-0" />
                              <div>
                                <Text className="font-bold text-sm block">{pdf}</Text>
                                <Text className="text-xs text-on-surface/40">Klik untuk mengunduh</Text>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <Divider className="border-on-surface/10 dark:border-white/5 mt-12 mb-8" />

                    {/* Navigation */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <Button
                        size="large"
                        type="text"
                        icon={<LeftOutlined />}
                        disabled={currentId <= 1}
                        onClick={handlePrev}
                        className="w-full sm:w-auto h-14 rounded-2xl font-bold bg-surface-low dark:bg-zinc-800 hover:bg-primary/5"
                      >
                        Materi Sebelumnya
                      </Button>
                      <Button
                        size="large"
                        type="primary"
                        disabled={currentId >= syllabusItems.length}
                        onClick={handleNext}
                        className="w-full sm:w-auto h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                      >
                        Materi Selanjutnya <RightOutlined />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MaterialDetail;
