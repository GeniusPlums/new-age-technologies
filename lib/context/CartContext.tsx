'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { Product, CartItem, CartState } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

type CartAction =
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; cart: CartState };

interface CartContextType {
  state: CartState;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartSummary: () => string;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | null>(null);

function calculateTotals(items: CartItem[]): CartState {
  return {
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (item) => item.id === action.product.id
      );
      let newItems: CartItem[];
      if (existingIndex >= 0) {
        newItems = state.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.product, quantity: 1 }];
      }
      return calculateTotals(newItems);
    }
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((item) => item.id !== action.productId);
      return calculateTotals(newItems);
    }
    case 'UPDATE_QUANTITY': {
      const newItems = state.items
        .map((item) =>
          item.id === action.productId
            ? { ...item, quantity: action.quantity }
            : item
        )
        .filter((item) => item.quantity > 0);
      return calculateTotals(newItems);
    }
    case 'CLEAR_CART':
      return { items: [], totalItems: 0, totalPrice: 0 };
    case 'LOAD_CART':
      return action.cart;
    default:
      return state;
  }
}

export const CART_STORAGE_KEY = 'lumin-cart';
const STORAGE_KEY = CART_STORAGE_KEY;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    totalItems: 0,
    totalPrice: 0,
  });
  const [hydrated, setHydrated] = React.useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.items)) {
          dispatch({ type: 'LOAD_CART', cart: parsed });
        }
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save to localStorage on change after hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [state, hydrated]);

  const addItem = (product: Product) => {
    dispatch({ type: 'ADD_ITEM', product });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const isInCart = (productId: string): boolean => {
    return state.items.some((item) => item.id === productId);
  };

  const getCartSummary = (): string => {
    if (state.items.length === 0) {
      return 'Your cart is empty.';
    }
    const itemsList = state.items
      .map(
        (item) =>
          `- ${item.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`
      )
      .join('\n');
    return `${itemsList}\n\nTotal: ${formatPrice(state.totalPrice)} (${state.totalItems} items)`;
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getCartSummary,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
