import React from 'react';
import { Typography, Row, Col, Card, Rate, Avatar, Tag, Space } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const reviews = [
  {
    id: 1,
    user: 'Rina Oktaviani',
    date: '20 Okt 2024',
    rating: 5,
    package: 'Paket Saintek Pro',
    comment: 'Alhamdulillah, berkat sering latihan di sini aku jadi lebih pede pas hari H SNBT. Sistem IRT-nya bener-bener ngebantu buat strategi pengerjaan soal!',
    avatar: 'https://i.pravatar.cc/150?u=11'
  },
  {
    id: 2,
    user: 'Fahreza Malik',
    date: '15 Okt 2024',
    rating: 5,
    package: 'Mock Exams (IRT)',
    comment: 'Soalnya variatif dan menantang. Pembahasannya juga detail banget, bukan cuma kunci jawaban doang. Recomended buat pejuang PTN.',
    avatar: 'https://i.pravatar.cc/150?u=12'
  },
  {
    id: 3,
    user: 'Dewi Lestari',
    date: '12 Okt 2024',
    rating: 4,
    package: 'Lite Pass',
    comment: 'Buat yang budget mepet, Lite Pass ini udah cukup oke banget buat ngetes kemampuan dasar. UI-nya bersih dan enak dipake belajar lama-lama.',
    avatar: 'https://i.pravatar.cc/150?u=13'
  }
];

const CustomerReviews: React.FC = () => {
  return (
    <section className="py-24 bg-surface-low dark:bg-zinc-900/40 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <Title level={2} className="!text-3xl md:!text-4xl !font-manrope mb-4">Review Dari Para Pejuang</Title>
          <div className="flex flex-wrap items-center gap-4">
            <Paragraph className="!m-0 text-lg text-surface-on/60">
              Inilah pendapat jujur dari mereka yang sudah bergabung.
            </Paragraph>
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
              <Rate disabled defaultValue={4.9} className="!text-sm" />
              <Text className="font-bold text-primary">4.9/5.0</Text>
              <Text className="text-xs text-primary/60">(2.4k Review)</Text>
            </div>
          </div>
        </div>

        <Row gutter={[32, 32]}>
          {reviews.map((review) => (
            <Col xs={24} lg={8} key={review.id}>
              <Card 
                className="h-full border-none shadow-sm hover:shadow-xl transition-all rounded-[2rem] p-4 bg-white dark:bg-zinc-900 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full" />
                
                <Space direction="vertical" size="middle" className="w-full relative z-10">
                  <div className="flex justify-between items-start">
                    <Rate disabled defaultValue={review.rating} className="!text-sm text-yellow-500" />
                    <Text className="text-[10px] text-surface-on/40 uppercase font-mono">{review.date}</Text>
                  </div>
                  
                  <Paragraph className="!text-lg text-surface-on/80 italic min-h-[100px]">
                    "{review.comment}"
                  </Paragraph>

                  <div className="flex items-center justify-between pt-4 border-t border-surface-container">
                    <div className="flex items-center gap-3">
                      <Avatar src={review.avatar} size={44} className="border-2 border-primary/20" />
                      <div>
                        <Text className="block font-bold text-surface-on">{review.user}</Text>
                        <Tag color="blue" className="m-0 border-none rounded-full px-2 text-[10px] bg-primary/10 text-primary">
                          {review.package}
                        </Tag>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <CheckCircleFilled className="text-green-500" title="Verified Purchase" />
                       <Text className="text-[8px] text-green-500 font-bold">VERIFIED</Text>
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
};

export default CustomerReviews;
