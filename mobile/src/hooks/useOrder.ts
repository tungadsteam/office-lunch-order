import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../api/services/orderService';
import { LunchSession, Order } from '../types/order.types';

export function useOrder(pollInterval = 10000) {
  const [session, setSession] = useState<LunchSession | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadToday = useCallback(async () => {
    try {
      const result = await orderService.getToday();
      if (result.success && result.data) {
        setSession(result.data.session);
        setOrders(result.data.orders);
        setIsJoined(result.data.is_joined);
      }
    } catch (error) {
      console.error('Load order error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
    const interval = setInterval(loadToday, pollInterval);
    return () => clearInterval(interval);
  }, [loadToday, pollInterval]);

  const join = async () => {
    await orderService.joinToday();
    await loadToday();
  };

  const leave = async () => {
    await orderService.leaveToday();
    await loadToday();
  };

  return { session, orders, isJoined, loading, refresh: loadToday, join, leave };
}
