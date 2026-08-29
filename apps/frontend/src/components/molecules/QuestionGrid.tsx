import React, { useMemo } from 'react';
import { Row, Col, Button, Typography, Card, Tooltip } from 'antd';
import { LockOutlined, BookOutlined } from '@ant-design/icons';
import { PackageQuestionPayload } from '../../services/packageService';

const { Text } = Typography;

interface QuestionGridItem {
  num: number;
  isLinked: boolean;
  groupTitle?: string;
  subIndex?: number;
  totalInGroup?: number;
}

interface QuestionGridProps {
  count?: number;
  duration?: number;
  answersLocked?: boolean;
  rawQuestions?: PackageQuestionPayload[];
}

const QuestionGrid: React.FC<QuestionGridProps> = ({
  count = 15,
  duration = 45,
  answersLocked = true,
  rawQuestions,
}) => {
  const items = useMemo<QuestionGridItem[]>(() => {
    if (rawQuestions && rawQuestions.length > 0) {
      const list: QuestionGridItem[] = [];
      for (const q of rawQuestions) {
        if (q.type === 'linked' && q.sub_questions && q.sub_questions.length > 0) {
          const groupSize = q.sub_questions.length;
          q.sub_questions.forEach((sub, subIdx) => {
            list.push({
              num: list.length + 1,
              isLinked: true,
              groupTitle: q.title || 'Teks Bacaan (Passage)',
              subIndex: subIdx + 1,
              totalInGroup: groupSize,
            });
          });
        } else {
          list.push({
            num: list.length + 1,
            isLinked: false,
          });
        }
      }
      return list;
    }
    return Array.from({ length: Math.max(count, 0) }, (_, i) => ({
      num: i + 1,
      isLinked: false,
    }));
  }, [rawQuestions, count]);

  const hasLinked = items.some(item => item.isLinked);

  return (
    <div className="py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Text className="text-surface-on/60">
          Estimasi waktu pengerjaan: <span className="font-bold text-surface-on">{duration} Menit</span>
          <span className="mx-2 text-surface-on/30">•</span>
          Total: <span className="font-bold text-primary">{items.length} Soal</span>
        </Text>
        {hasLinked && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-bold text-xs border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Termasuk Soal Berhubungan (Passage)
          </div>
        )}
      </div>

      <Row gutter={[16, 16]}>
        {items.map((item) => {
          const tooltipContent = item.isLinked
            ? `Soal #${item.num} (Teks Berhubungan: Bagian ${item.subIndex}/${item.totalInGroup})`
            : `Soal #${item.num}`;

          return (
            <Col span={4.8} key={item.num} style={{ width: '20%' }}>
              <Tooltip title={tooltipContent}>
                <Button
                  className={`w-full aspect-square rounded-2xl font-bold flex items-center justify-center border-surface-container transition-all shadow-sm relative ${
                    item.isLinked
                      ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 hover:border-green-500'
                      : 'bg-surface-low/50 hover:border-primary hover:text-primary'
                  }`}
                >
                  {item.num}
                  {item.isLinked && (
                    <span
                      title="Soal berhubungan"
                      className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-zinc-900"
                    />
                  )}
                </Button>
              </Tooltip>
            </Col>
          );
        })}
      </Row>

      {hasLinked && (
        <div className="mt-6 p-3.5 rounded-2xl bg-green-500/5 border border-green-500/15 flex items-center gap-2.5 text-xs text-green-800 dark:text-green-300 font-medium">
          <BookOutlined className="text-green-600 text-sm flex-shrink-0" />
          <span>
            Nomor berpenanda <strong className="font-bold text-green-600">titik hijau</strong> adalah <strong>Soal Berhubungan</strong> yang mengacu pada satu teks bacaan/passage bersama.
          </span>
        </div>
      )}

      <Card className="mt-8 border-none bg-primary/5 rounded-2xl italic text-center p-2">
        <Text className="text-sm text-primary">
          {answersLocked && <LockOutlined className="mr-2" />}
          Daftar soal hanya preview. Kunci jawaban dan pembahasan lengkap terbuka setelah memiliki paket.
        </Text>
      </Card>
    </div>
  );
};

export default QuestionGrid;

