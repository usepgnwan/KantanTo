import React from 'react';
import { Card, Typography, Space, Input, Radio, Switch, Tag, Button, Divider } from 'antd';
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { CheckableTag } = Tag;

const categories = [
  { label: 'Semua Kategori', value: 'all' },
  { label: 'Intensive Bootcamp', value: 'bootcamp' },
  { label: 'Mock Exams (IRT)', value: 'mock' },
  { label: 'Subject Mastery', value: 'mastery' },
];

const durations = ['1 Hari', '3 Hari', '7 Hari', '30 Hari', 'Lifetime'];

const PackageFilters: React.FC = () => {
  return (
    <Card 
      className="border-none glass shadow-xl rounded-2xl sticky top-24"
      title={
        <div className="flex items-center gap-2 py-2">
          <FilterOutlined className="text-primary" />
          <span className="font-manrope font-bold">Filter Pencarian</span>
        </div>
      }
      extra={
        <Button type="link" size="small" icon={<ReloadOutlined />} className="text-xs">
          Reset
        </Button>
      }
    >
      <Space direction="vertical" size="large" className="w-full">
        {/* Price Range */}
        <div className="space-y-3">
          <Text className="block font-semibold">Rentang Harga</Text>
          <div className="flex items-center gap-2">
            <Input 
              prefix={<Text className="text-[10px] text-surface-on/40">Rp</Text>}
              placeholder="Min" 
              className="rounded-lg h-10" 
            />
            <div className="h-[1px] w-4 bg-surface-container" />
            <Input 
              prefix={<Text className="text-[10px] text-surface-on/40">Rp</Text>}
              placeholder="Max" 
              className="rounded-lg h-10" 
            />
          </div>
        </div>

        <Divider className="my-0 opacity-50" />

        {/* Categories */}
        <div className="space-y-3">
          <Text className="block font-semibold">Kategori Paket</Text>
          <Radio.Group defaultValue="all" className="flex flex-col gap-3">
            {categories.map(cat => (
              <Radio key={cat.value} value={cat.value} className="text-sm">
                {cat.label}
              </Radio>
            ))}
          </Radio.Group>
        </div>

        <Divider className="my-0 opacity-50" />

        {/* Durasi */}
        <div className="space-y-3">
          <Text className="block font-semibold">Durasi Belajar</Text>
          <div className="flex flex-wrap gap-2">
            {durations.map(d => (
              <CheckableTag 
                key={d} 
                checked={false} 
                className="rounded-lg px-3 py-1 border border-surface-container bg-transparent text-surface-on/60 hover:border-primary hover:text-primary transition-all"
                onChange={() => {}}
              >
                {d}
              </CheckableTag>
            ))}
          </div>
        </div>

        <Divider className="my-0 opacity-50" />

        {/* Toggle Promo */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Text className="block font-semibold">Hanya Promo</Text>
            <Text className="text-[10px] text-surface-on/40">Tampilkan paket diskon</Text>
          </div>
          <Switch size="small" />
        </div>

        <Button type="primary" block size="large" className="h-12 rounded-xl font-bold mt-4 shadow-lg shadow-primary/20">
          Terapkan Filter
        </Button>
      </Space>
    </Card>
  );
};

export default PackageFilters;
