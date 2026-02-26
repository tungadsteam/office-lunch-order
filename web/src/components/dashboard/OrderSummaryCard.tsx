'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOrder } from '@/lib/hooks/useOrder';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
  ordering: '🟢 Đang đặt',
  open: '🟢 Đang mở',
  locked: '🔒 Đã chốt',
  settled: '✅ Đã thanh toán',
  finalized: '📋 Hoàn tất',
};

export function OrderSummaryCard() {
  const { todaySession, participants } = useOrder(10000);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2">🍱 Cơm hôm nay</h3>
      {todaySession ? (
        <>
          <p className="text-2xl font-bold">{participants.length} người đã đặt</p>
          <p className="text-sm text-gray-500 mt-1">
            {STATUS_LABELS[todaySession.status] || todaySession.status}
          </p>
          <Link href="/order">
            <Button variant="outline" className="mt-4 w-full">Xem chi tiết</Button>
          </Link>
        </>
      ) : (
        <p className="text-gray-500">Chưa có phiên đặt cơm hôm nay</p>
      )}
    </Card>
  );
}
