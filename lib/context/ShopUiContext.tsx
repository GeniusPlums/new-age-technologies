'use client';

import React, { createContext, useContext, useState } from 'react';

interface ShopUiContextType {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  checkoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  ordersOpen: boolean;
  openOrders: () => void;
  closeOrders: () => void;
}

const ShopUiContext = createContext<ShopUiContextType | null>(null);

export function ShopUiProvider({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);

  const openCheckout = () => {
    setCartOpen(false);
    setOrdersOpen(false);
    setCheckoutOpen(true);
  };

  const closeCheckout = () => setCheckoutOpen(false);

  const openOrders = () => {
    setCartOpen(false);
    setCheckoutOpen(false);
    setOrdersOpen(true);
  };

  const closeOrders = () => setOrdersOpen(false);

  return (
    <ShopUiContext.Provider
      value={{
        cartOpen,
        setCartOpen,
        checkoutOpen,
        openCheckout,
        closeCheckout,
        ordersOpen,
        openOrders,
        closeOrders,
      }}
    >
      {children}
    </ShopUiContext.Provider>
  );
}

export function useShopUi() {
  const context = useContext(ShopUiContext);
  if (!context) {
    throw new Error('useShopUi must be used within a ShopUiProvider');
  }
  return context;
}
