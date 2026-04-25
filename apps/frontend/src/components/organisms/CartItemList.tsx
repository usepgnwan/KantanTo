import React from 'react';
import CartItem, { CartItemProps } from '../molecules/CartItem';
import EmptyCart from '../molecules/EmptyCart';
import { Typography } from 'antd';

const { Title } = Typography;

interface CartItemListProps {
  items: Omit<CartItemProps, 'onRemove' | 'onUpdateQuantity'>[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

const CartItemList: React.FC<CartItemListProps> = ({ items, onRemove, onUpdateQuantity }) => {
  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="!font-manrope !mb-0">
          Items ({items.length})
        </Title>
      </div>
      <div>
        {items.map((item) => (
          <CartItem
            key={item.id}
            {...item}
            onRemove={onRemove}
            onUpdateQuantity={onUpdateQuantity}
          />
        ))}
      </div>
    </div>
  );
};

export default CartItemList;
