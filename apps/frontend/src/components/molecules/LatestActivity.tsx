import React from 'react';
import { Card, Typography, Avatar, List, Space, Tag } from 'antd';
import { ShoppingCartOutlined, ThunderboltFilled } from '@ant-design/icons';

const { Text, Title } = Typography;

const activities = [
  { id: 1, user: 'Budi S.', action: 'baru saja membeli', item: 'Paket Saintek Pro', time: '2 menit yang lalu' },
  { id: 2, user: 'Siti A.', action: 'mendaftar', item: 'Tryout Akbar IRT', time: '5 menit yang lalu' },
  { id: 3, user: 'Rian K.', action: 'baru saja membeli', item: 'Campuran Pro', time: '12 menit yang lalu' },
  { id: 4, user: 'Ani W.', action: 'mendaftar', item: 'Lite Pass', time: '1 jam yang lalu' },
];

const LatestActivity: React.FC = () => {
  return (
    <Card 
      className="border-none glass shadow-lg rounded-2xl p-2 mt-8"
      title={
        <div className="flex items-center gap-2 py-1">
          <ThunderboltFilled className="text-yellow-500" />
          <span className="font-manrope font-bold text-sm">Aktivitas Terbaru</span>
        </div>
      }
    >
      <List
        itemLayout="horizontal"
        dataSource={activities}
        renderItem={(item) => (
          <List.Item className="border-none py-3">
            <List.Item.Meta
              avatar={
                <Avatar 
                  size={32} 
                  icon={<ShoppingCartOutlined />} 
                  className="bg-primary/10 text-primary" 
                />
              }
              title={
                <div className="flex flex-col">
                  <Text className="text-xs font-semibold text-surface-on">
                    {item.user} <span className="font-normal text-surface-on/60">{item.action}</span>
                  </Text>
                  <Text className="text-xs font-bold text-primary">{item.item}</Text>
                </div>
              }
              description={<Text className="text-[10px] text-surface-on/40">{item.time}</Text>}
            />
          </List.Item>
        )}
      />
      <div className="mt-2 pt-2 border-t border-surface-container text-center">
        <Tag color="green" className="m-0 border-none rounded-full px-4 font-semibold text-[10px] animate-pulse">
          98 SISWA ONLINE
        </Tag>
      </div>
    </Card>
  );
};

export default LatestActivity;
