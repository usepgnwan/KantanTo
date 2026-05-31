import React from 'react';
import { Row, Col, Button, Typography, Card } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface QuestionGridProps {
  count?: number;
  duration?: number;
  answersLocked?: boolean;
}

const QuestionGrid: React.FC<QuestionGridProps> = ({ count = 15, duration = 45, answersLocked = true }) => {
  const questions = Array.from({ length: Math.max(count, 0) }, (_, i) => i + 1);

  return (
    <div className="py-6">
      <div className="mb-6">
        <Text className="text-surface-on/60">Estimasi waktu pengerjaan: <span className="font-bold text-surface-on">{duration} Menit</span></Text>
      </div>
      <Row gutter={[16, 16]}>
        {questions.map((num) => (
          <Col span={4.8} key={num} style={{ width: '20%' }}>
            <Button
              className="w-full aspect-square rounded-2xl font-bold flex items-center justify-center border-surface-container bg-surface-low/50 hover:border-primary hover:text-primary transition-all shadow-sm"
            >
              {num}
            </Button>
          </Col>
        ))}
      </Row>
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
