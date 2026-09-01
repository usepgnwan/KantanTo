import React from 'react';
import { Card, Typography, Space, InputNumber, Radio, Switch, Tag, Button, Divider } from 'antd';
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { CheckableTag } = Tag;

export interface FilterState {
  category: string;
  minPrice?: number;
  maxPrice?: number;
  selectedDurations: string[];
  promoOnly: boolean;
}

interface PackageFiltersProps {
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  onReset?: () => void;
  categoriesList?: { label: string; value: string; count?: number }[];
}

const defaultCategories: { label: string; value: string; count?: number }[] = [
  { label: 'Semua Kategori', value: 'all' },
  { label: '🎁 Paket Bundle', value: 'bundle' },
  { label: 'Intensive Bootcamp', value: 'Intensive Bootcamp' },
  { label: 'Saintek', value: 'Saintek' },
  { label: 'Soshum', value: 'Soshum' },
  { label: 'Tryout', value: 'Tryout' },
];

const availableDurations = ['1 Hari', '3 Hari', '7 Hari', '30 Hari', 'Lifetime', 'Bundle'];

const PackageFilters: React.FC<PackageFiltersProps> = ({
  filters = {
    category: 'all',
    selectedDurations: [],
    promoOnly: false,
  },
  onFilterChange,
  onReset,
  categoriesList = defaultCategories,
}) => {
  const handleCategoryChange = (val: string) => {
    onFilterChange?.({
      ...filters,
      category: val,
    });
  };

  const handleMinPriceChange = (val: number | null) => {
    onFilterChange?.({
      ...filters,
      minPrice: val ?? undefined,
    });
  };

  const handleMaxPriceChange = (val: number | null) => {
    onFilterChange?.({
      ...filters,
      maxPrice: val ?? undefined,
    });
  };

  const handleDurationToggle = (d: string, checked: boolean) => {
    const next = checked
      ? [...filters.selectedDurations, d]
      : filters.selectedDurations.filter(x => x !== d);
    onFilterChange?.({
      ...filters,
      selectedDurations: next,
    });
  };

  const handlePromoToggle = (checked: boolean) => {
    onFilterChange?.({
      ...filters,
      promoOnly: checked,
    });
  };

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
        <Button 
          type="link" 
          size="small" 
          icon={<ReloadOutlined />} 
          className="text-xs font-bold text-primary"
          onClick={onReset}
        >
          Reset
        </Button>
      }
    >
      <Space direction="vertical" size="large" className="w-full">
        {/* Categories */}
        <div className="space-y-3">
          <Text className="block font-bold text-sm">Kategori & Tipe Paket</Text>
          <Radio.Group 
            value={filters.category} 
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="flex flex-col gap-2.5"
          >
            {categoriesList.map(cat => (
              <Radio key={cat.value} value={cat.value} className="text-sm font-medium">
                <span className="flex items-center justify-between gap-2">
                  <span>{cat.label}</span>
                  {typeof cat.count === 'number' && (
                    <span className="text-[11px] text-on-surface/40 font-bold">({cat.count})</span>
                  )}
                </span>
              </Radio>
            ))}
          </Radio.Group>
        </div>

        <Divider className="my-0 opacity-50" />

        {/* Price Range */}
        <div className="space-y-3">
          <Text className="block font-bold text-sm">Rentang Harga</Text>
          <div className="flex items-center gap-2">
            <InputNumber 
              prefix={<Text className="text-[10px] text-surface-on/40">Rp</Text>}
              placeholder="Min" 
              className="rounded-lg w-full"
              min={0}
              value={filters.minPrice}
              onChange={handleMinPriceChange}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(v) => Number(v?.replace(/\./g, '') ?? 0) as any}
            />
            <div className="h-[1px] w-4 bg-surface-container shrink-0" />
            <InputNumber 
              prefix={<Text className="text-[10px] text-surface-on/40">Rp</Text>}
              placeholder="Max" 
              className="rounded-lg w-full"
              min={0}
              value={filters.maxPrice}
              onChange={handleMaxPriceChange}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(v) => Number(v?.replace(/\./g, '') ?? 0) as any}
            />
          </div>
        </div>

        <Divider className="my-0 opacity-50" />

        {/* Durasi */}
        <div className="space-y-3">
          <Text className="block font-bold text-sm">Durasi Belajar</Text>
          <div className="flex flex-wrap gap-1.5">
            {availableDurations.map(d => {
              const isChecked = filters.selectedDurations.includes(d);
              return (
                <CheckableTag 
                  key={d} 
                  checked={isChecked} 
                  className={`rounded-lg px-2.5 py-1 text-xs border transition-all cursor-pointer ${
                    isChecked 
                      ? '!bg-primary !text-white !border-primary font-bold shadow-sm' 
                      : 'border-surface-container bg-transparent text-surface-on/70 hover:border-primary'
                  }`}
                  onChange={(checked) => handleDurationToggle(d, checked)}
                >
                  {d}
                </CheckableTag>
              );
            })}
          </div>
        </div>

        <Divider className="my-0 opacity-50" />

        {/* Toggle Promo */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Text className="block font-bold text-sm">Hanya Promo & Diskon</Text>
            <Text className="text-[10px] text-surface-on/50">Tampilkan paket hemat & diskon</Text>
          </div>
          <Switch 
            size="small" 
            checked={filters.promoOnly}
            onChange={handlePromoToggle}
          />
        </div>
      </Space>
    </Card>
  );
};

export default PackageFilters;
