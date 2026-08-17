'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ShippingAddress } from '@/lib/types';

const STORAGE_KEY = 'lumin-preferences';

export interface ShopPreferences {
  shipping?: ShippingAddress;
  lastQuery?: string;
}

const EMPTY: ShopPreferences = {};

export function usePreferences() {
  const [preferences, setPreferences] = useState<ShopPreferences>(EMPTY);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setPreferences(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, []);

  const updatePreferences = useCallback((partial: Partial<ShopPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
      return next;
    });
  }, []);

  return { preferences, updatePreferences };
}
