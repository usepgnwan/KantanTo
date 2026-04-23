import React from 'react';
import { Typography, Row, Col, Card, Rate, Avatar } from 'antd';

const { Title, Paragraph, Text } = Typography;

const testimonials = [
  {
    name: "Ahmad Fauzi",
    school: "SMA Negeri 1 Jakarta",
    quote: "Tryout di sini bener-bener ngebantu aku ngebiasain diri sama sistem IRT. Hasilnya akurat banget!",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?u=1"
  },
  {
    name: "Siti Aminah",
    school: "SMA Negeri 3 Bandung",
    quote: "Materi soalnya update dan mirip banget sama soal asli. Pembahasannya juga gampang dimengerti.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?u=2"
  },
  {
    name: "Budi Santoso",
    school: "SMA Negeri 5 Surabaya",
    quote: "Dashboard statistiknya keren banget, aku jadi tau bagian mana yang harus aku perbaikin.",
    rating: 5,
    avatar: "https://i.pravatar.cc/150?u=3"
  }
];

const TestimonialSection: React.FC = () => {
  return (
    <section className="py-24 bg-surface-low dark:bg-zinc-800/50 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
        <Title level={2} className="!text-4xl !font-manrope mb-4">Apa Kata Para Scholar?</Title>
        <Paragraph className="text-lg text-surface-on/60 max-w-2xl mx-auto">
          Ribuan siswa telah membuktikan manfaat belajar bersama SNBT Tryout. Inilah cerita sukses mereka.
        </Paragraph>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Row gutter={[32, 32]}>
          {testimonials.map((item, index) => (
            <Col xs={24} md={8} key={index}>
              <Card 
                className="h-full border-none shadow-sm hover:shadow-md transition-all rounded-2xl p-6 bg-white dark:bg-zinc-900"
              >
                <div className="flex flex-col h-full">
                  <Rate disabled defaultValue={item.rating} className="text-sm mb-6 text-yellow-500" />
                  <Paragraph className="!text-lg italic text-surface-on/80 flex-grow">
                    "{item.quote}"
                  </Paragraph>
                  <div className="flex items-center space-x-4 mt-8">
                    <Avatar src={item.avatar} size={48} />
                    <div>
                      <Text className="block font-bold text-surface-on">{item.name}</Text>
                      <Text className="text-xs text-surface-on/60">{item.school}</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
};

export default TestimonialSection;
