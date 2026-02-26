'use client';

import { useOrderStore } from '../store/orderStore';
import { useEffect } from 'react';

export const useOrder = (pollInterval = 5000) => {
  const store = useOrderStore();

  useEffect(() => {
    store.fetchToday();

    const interval = setInterval(() => {
      store.fetchToday();
    }, pollInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollInterval]);

  return store;
};
