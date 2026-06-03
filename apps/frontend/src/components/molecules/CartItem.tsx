import React from 'react';
import { Typography, Button, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export interface CartItemProps {
  id: string;
  title: string;
  variant: string;
  price: number;
  image: string;
  quantity: number;
  onRemove: (id: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({
  id,
  title,
  variant,
  price,
  image,
  quantity,
  onRemove,
}) => {
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);

  return (
    <div className="weightless-card mb-4 p-4 flex items-center gap-4">
      <div className="w-24 h-24 rounded-xl overflow-hidden bg-surface-low flex-shrink-0">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <Title level={5} className="!mb-0 !font-manrope">{title}</Title>
            <Text className="text-on-surface/60 text-sm">{variant}</Text>
          </div>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => onRemove(id)}
            className="hover:bg-red-50 rounded-full"
          />
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <Text className="font-bold text-lg text-primary">{formattedPrice}</Text>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
