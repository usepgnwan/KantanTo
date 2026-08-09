import React from 'react';
import { Typography, Row, Col } from 'antd';
import { ArrowUpOutlined, UserOutlined } from '@ant-design/icons';

const { Title } = Typography;

const reviews = [
  {
    id: 1,
    user: 'Aisyah Putri',
    school: 'SDN 10 Bandung',
    grade: 'Kelas 6',
    comment: 'Soalnya mirip dengan TKA asli, pembahasannya mudah dipahami. Skor saya naik!',
    skorAwal: 620,
    skorTerbaru: 845,
    avatar: 'https://i.pravatar.cc/150?img=5'
  },
  {
    id: 2,
    user: 'Rafi Maulana',
    school: 'SMPN 2 Yogyakarta',
    grade: 'Kelas 8',
    comment: 'Tryout di Rifaya Tryout bantu saya tahu kelemahan saya dan jadi lebih siap menghadapi TKA.',
    skorAwal: 670,
    skorTerbaru: 892,
    avatar: 'https://i.pravatar.cc/150?img=11'
  },
  {
    id: 3,
    user: 'Nayla Zahra',
    school: 'SMP Islam Al-Azhar',
    grade: 'Kelas 9',
    comment: 'Fitur analisisnya lengkap banget, jadi tahu bagian mana yang harus diperbaiki.',
    skorAwal: 700,
    skorTerbaru: 920,
    avatar: 'https://i.pravatar.cc/150?img=9'
  }
];

const CustomerReviews: React.FC = () => {
  return (
    <section className="py-20 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <Title level={2} className="!text-3xl md:!text-4xl !font-bold !m-0">Apa Kata Mereka?</Title>
          <a href="#" className="text-primary font-bold hover:underline text-sm hidden sm:block">Lihat Semua Testimoni &gt;</a>
        </div>

        <Row gutter={[24, 24]}>
          {reviews.map((review) => (
            <Col xs={24} lg={8} key={review.id}>
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col relative overflow-hidden group">
                <div className="flex gap-4 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                    <UserOutlined className="text-2xl text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-gray-800 text-sm">{review.user}</h4>
                      <span className="bg-blue-50 text-primary text-[10px] px-2 py-0.5 rounded font-bold">{review.grade}</span>
                    </div>
                    <p className="text-xs text-gray-500">{review.school}</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-6 italic flex-1 relative z-10">"{review.comment}"</p>
                
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 relative z-10">
                  <div className="text-center">
                     <p className="text-[10px] text-gray-500 font-medium mb-1">Skor Awal</p>
                     <p className="text-xl font-bold text-gray-800">{review.skorAwal}</p>
                  </div>
                  <div className="text-gray-300">
                     <span className="text-xl">➔</span>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] text-gray-500 font-medium mb-1">Skor Terbaru</p>
                     <p className="text-xl font-bold text-green-500 flex items-center justify-center gap-1">
                        {review.skorTerbaru} <ArrowUpOutlined className="text-sm" />
                     </p>
                  </div>
                </div>

                {/* Decorative background element */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors z-0" />
              </div>
            </Col>
          ))}
        </Row>
        
        <div className="mt-6 text-center sm:hidden">
           <a href="#" className="text-primary font-bold hover:underline text-sm">Lihat Semua Testimoni &gt;</a>
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
