'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ordersService } from '@/lib/api/services/orders';
import { formatShortDate, formatCurrency } from '@/lib/utils/formatters';
import { OrderHistoryItem } from '@/lib/types/order';

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  settled: { label: '✅ Đã thanh toán', variant: 'default' },
  finalized: { label: '📋 Hoàn tất', variant: 'secondary' },
  ordering: { label: '🟢 Đang đặt', variant: 'outline' },
  locked: { label: '🔒 Đã chốt', variant: 'secondary' },
};

export default function HistoryPage() {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const loadOrders = async (newOffset = 0) => {
    try {
      const res: any = await ordersService.getHistory(limit, newOffset);
      const raw = res.data?.orders || res.data || [];
      // Normalize field names from backend
      const items = (Array.isArray(raw) ? raw : []).map((o: any) => ({
        ...o,
        id: o.id || o.session_id,
        date: o.date || o.session_date,
      }));
      if (newOffset === 0) {
        setOrders(items);
      } else {
        setOrders((prev) => [...prev, ...items]);
      }
      setHasMore(items.length === limit);
      setOffset(newOffset + items.length);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">📜 Lịch sử đặt cơm</h2>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : orders.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Chưa có lịch sử đặt cơm</p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => {
              const badge = STATUS_BADGE[order.status] || { label: order.status, variant: 'outline' as const };
              return (
                <Card key={order.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{formatShortDate(order.date)}</p>
                      <p className="text-sm text-gray-500">
                        {order.total_participants} người
                        {order.per_person_cost ? ` • ${formatCurrency(order.per_person_cost)}/người` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      {order.total_bill && (
                        <p className="text-sm text-gray-500 mt-1">
                          Tổng: {formatCurrency(order.total_bill)}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {hasMore && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => loadOrders(offset)}
            >
              Xem thêm...
            </Button>
          )}
        </>
      )}
    </div>
  );
}
