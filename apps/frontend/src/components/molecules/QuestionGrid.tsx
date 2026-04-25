import React from 'react';
import { Row, Col, Button, Typography, Card } from 'antd';

const { Text } = Typography;

const QuestionGrid: React.FC = () => {
  const questions = Array.from({ length: 15 }, (_, i) => i + 1);

  return (
    <div className="py-6">
      <div className="mb-6">
        <Text className="text-surface-on/60">Estimasi waktu pengerjaan: <span className="font-bold text-surface-on">45 Menit</span></Text>
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
        <Text className="text-sm text-primary">Daftar soal di atas adalah preview materi yang akan Anda kerjakan dalam tryout ini.</Text>
      </Card>
    </div>
  );
};

export default QuestionGrid;
