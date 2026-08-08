import React, { useState, useEffect } from 'react';
import { Button, Radio, Spin } from 'antd';
import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { getRandomExampleExam, ExampleExam } from '../../services/exampleExamService';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Render KaTeX from a latex string
const renderKaTeX = (latex: string, displayMode = false): string => {
  try {
    return katex.renderToString(latex, { displayMode, throwOnError: false });
  } catch {
    return latex;
  }
};

// Render Quill HTML: handles both ql-formula spans AND $...$ / $$...$$ patterns
const renderQuillHtml = (html: string): string => {
  if (!html) return '';
  return html
    // Quill formula embed: <span class="ql-formula" data-value="LATEX">
    .replace(/<span\s+class="ql-formula"\s+data-value="([^"]+)"[^>]*>[^<]*<\/span>/g, (_, latex) =>
      renderKaTeX(decodeURIComponent(latex), false)
    )
    // Block LaTeX: $$...$$
    .replace(/\$\$([^$]+)\$\$/g, (_, l) =>
      `<div class="my-3 flex justify-center overflow-x-auto">${renderKaTeX(l, true)}</div>`
    )
    // Inline LaTeX: $...$
    .replace(/\$([^$\n]+)\$/g, (_, l) => renderKaTeX(l, false));
};

const QuizWidget: React.FC = () => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>();
  const [showResult, setShowResult] = useState(false);
  const [questionData, setQuestionData] = useState<ExampleExam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await getRandomExampleExam();
        if (res.data) setQuestionData(res.data);
      } catch (error) {
        console.error("Failed to load question");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestion();
  }, []);

  return (
    <div className="bg-[#f5f8ff] rounded-[2rem] p-6 sm:p-10 flex flex-col lg:flex-row gap-8 relative overflow-hidden">
      {/* Left Side: Question */}
      <div className="flex-1 z-10 flex flex-col">
        <h3 className="font-bold text-2xl text-[#0060ad] mb-2">Coba Soalnya!</h3>
        <p className="text-gray-500 mb-8">Rasakan pengalaman tryout seperti TKA sungguhan.</p>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-50 flex-1 relative min-h-[300px]">
          {loading ? (
             <div className="absolute inset-0 flex items-center justify-center">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
             </div>
          ) : !questionData ? (
             <div className="absolute inset-0 flex items-center justify-center text-gray-400">Belum ada soal tersedia.</div>
          ) : (
            <>
              <div className="mb-6 prose prose-sm max-w-none font-medium text-gray-800" dangerouslySetInnerHTML={{ __html: renderQuillHtml(questionData.question) }} />
              
              <Radio.Group 
                className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4"
                onChange={(e) => {
                   setSelectedAnswer(e.target.value);
                   setShowResult(false);
                }}
                value={selectedAnswer}
              >
              {['A', 'B', 'C', 'D'].map((opt) => {
                  const rawHtml = (questionData[`option_${opt.toLowerCase()}` as keyof ExampleExam] || '') as string;
                  // Strip wrapping <p>...</p> to render inline with label
                  const inlineHtml = rawHtml.replace(/^<p>([\s\S]*?)<\/p>$/, '$1').trim();
                  return (
                    <div key={opt} className={`border-2 rounded-2xl p-4 flex items-center cursor-pointer transition-colors ${selectedAnswer === opt ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-300'}`} onClick={() => setSelectedAnswer(opt)}>
                      <Radio value={opt} className="mr-3 shrink-0"></Radio>
                      <div className="text-base font-medium flex-1 prose prose-sm max-w-none leading-normal">
                        <span className="font-bold mr-2">{opt}.</span>
                        <span dangerouslySetInnerHTML={{ __html: renderQuillHtml(inlineHtml) }} />
                      </div>
                    </div>
                  );
                })}
              </Radio.Group>
            </>
          )}
        </div>
      </div>

      {/* Right Side: Result / Discussion */}
      <div className="w-full lg:w-[400px] z-10 flex flex-col justify-center">
         {!showResult ? (
            <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-blue-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[250px]">
               <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl mb-4">💡</div>
               <p className="text-gray-500 font-medium mb-6">Pilih jawabanmu terlebih dahulu, lalu klik tombol di bawah untuk melihat pembahasan.</p>
               <Button 
                  type="primary" 
                  className="bg-[#0060ad] hover:bg-[#004a87] h-14 px-8 rounded-full font-bold shadow-lg shadow-blue-500/30"
                  onClick={() => setShowResult(true)}
                  disabled={!selectedAnswer}
               >
                  Lihat Pembahasan
               </Button>
            </div>
         ) : (
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-blue-900/5 border border-blue-100 h-full flex flex-col">
               <div className="flex items-center gap-3 mb-6">
                  <CheckCircleFilled className="text-green-500 text-2xl" />
                  <h4 className="font-bold text-xl text-gray-800">Pembahasan</h4>
               </div>
               <div className="space-y-4 text-gray-600 flex-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderQuillHtml(questionData?.explanation || '') }}>
               </div>
               <div className={`mt-6 p-4 rounded-xl border font-bold text-center ${selectedAnswer === questionData?.answer ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                  {selectedAnswer === questionData?.answer ? 'Benar!' : 'Kurang Tepat!'} Jawaban yang benar adalah {questionData?.answer}
               </div>
            </div>
         )}
      </div>

      {/* Decorative */}
      <div className="absolute right-[-5%] bottom-[-10%] text-[15rem] opacity-5 rotate-12 z-0 pointer-events-none">
        ⏱️
      </div>
    </div>
  );
};

export default QuizWidget;
