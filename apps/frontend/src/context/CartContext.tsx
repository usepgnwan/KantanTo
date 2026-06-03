import React, { createContext, useContext, useState, useEffect } from 'react';
import { Voucher } from '../services/voucherService';

export interface CartItem {
  id: string;
  slug?: string;
  title: string;
  variant: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  appliedVoucher: Voucher | null;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  isInCart: (id: string) => boolean;
  clearCart: () => void;
  applyVoucher: (voucher: Voucher) => void;
  removeVoucher: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(() => {
    try {
      const saved = localStorage.getItem('cart_voucher');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedVoucher) {
      localStorage.setItem('cart_voucher', JSON.stringify(appliedVoucher));
    } else {
      localStorage.removeItem('cart_voucher');
    }
  }, [appliedVoucher]);

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      // 1 paket 1 keranjang rule
      if (prev.some((i) => i.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const isInCart = (id: string) => {
    return items.some((item) => item.id === id);
  };

  const clearCart = () => {
    setItems([]);
    setAppliedVoucher(null);
  };

  const applyVoucher = (voucher: Voucher) => {
    setAppliedVoucher(voucher);
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
  };

  return (
    <CartContext.Provider value={{ items, appliedVoucher, addToCart, removeFromCart, updateQuantity, isInCart, clearCart, applyVoucher, removeVoucher }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
