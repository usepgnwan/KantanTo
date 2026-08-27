import React, { useEffect, useState } from 'react';
import { Card, Typography, List, Badge, Button, Space } from 'antd';
import { ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSchedulesAPI, StudySchedule } from '../../services/scheduleService';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

const { Title, Text, Paragraph } = Typography;

const UpcomingSchedules: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<StudySchedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSchedules = async () => {
      if (user?.id) {
        setLoading(true);
        try {
          const data = await getSchedulesAPI(user.id);

          // Filter 7 days ahead
          const today = dayjs().startOf('day');
          const nextWeek = dayjs().add(7, 'day').endOf('day');

          const filtered = data.filter(s => {
            const d = dayjs(s.date);
            return (d.isSame(today) || d.isAfter(today)) && d.isBefore(nextWeek);
          });

          // Sort by date closest
          filtered.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

          setSchedules(filtered);
        } catch (error) {
          console.error('Failed to load upcoming schedules', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadSchedules();
  }, [user]);

  if (schedules.length === 0) {
    return (
      <Card className="bg-primary/5 border-primary/10 rounded-[2.5rem] p-8 text-center border overflow-hidden relative h-full flex flex-col justify-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-[-20%] -translate-y-[20%]" />
        <div className="relative z-10">
          <ClockCircleOutlined className="text-5xl text-primary mb-6" />
          <Title level={4} className="!font-black !font-manrope mb-4">Konsistensi adalah Kunci</Title>
          <Paragraph className="text-sm text-on-surface/60 mb-8">
            Gunakan alarm belajar harian agar progresmu tetap terjaga dan target PTN impian tercapai!
          </Paragraph>
          <Button onClick={() => navigate('/jadwal')} type="primary" block size="large" className="rounded-2xl h-14 font-bold shadow-xl shadow-primary/20">
            Atur Jadwal Belajar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-surface-container rounded-[2.5rem] p-6 shadow-xl relative h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title level={4} className="!font-black !font-manrope !m-0">Jadwal 7 Hari ke Depan</Title>
          <Text className="text-xs text-on-surface/40 uppercase tracking-widest font-bold">Waktunya Belajar!</Text>
        </div>
        <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={() => navigate('/jadwal')} />
      </div>

      <div className="overflow-y-auto max-h-[300px] pr-2 custom-scrollbar flex-grow">
        <List
          loading={loading}
          itemLayout="horizontal"
          dataSource={schedules}
          renderItem={item => {
            const isToday = dayjs(item.date).isSame(dayjs(), 'day');
            return (
              <List.Item className="bg-surface-low/50 p-4 rounded-xl !px-5 mb-3 border border-surface-container">
                <List.Item.Meta
                  title={
                    <Space className="w-full justify-between">
                      <Space>
                        <Badge status={item.type === 'latihan' ? 'processing' : 'warning'} />
                        <Text className="font-bold capitalize text-sm">{item.type === 'latihan' ? 'Latihan Tryout' : 'Pengingat'}</Text>
                      </Space>
                      {isToday && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                          HARI INI
                        </span>
                      )}
                    </Space>
                  }
                  description={
                    <div className="mt-2">
                      <Text className="text-xs font-bold text-primary block mb-1">
                        {dayjs(item.date).format('dddd, DD MMM YYYY')}
                      </Text>
                      <Text className="text-sm text-on-surface/80 block leading-tight">
                        {item.type === 'latihan' ? (
                          item.package?.title
                        ) : (
                          item.reminder_text
                        )}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </div>
    </Card>
  );
};

export default UpcomingSchedules;
