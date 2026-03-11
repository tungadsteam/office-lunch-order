'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function QuickActions() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">⚡ Thao tác nhanh</h3>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/order">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-1">
            <span className="text-2xl">🍱</span>
            <span className="text-sm">Đặt cơm</span>
          </Button>
        </Link>
        <Link href="/balance">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-1">
            <span className="text-2xl">💳</span>
            <span className="text-sm">Nạp tiền</span>
          </Button>
        </Link>
        <Link href="/history">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-1">
            <span className="text-2xl">📜</span>
            <span className="text-sm">Lịch sử</span>
          </Button>
        </Link>
        <Link href="/balance">
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-1">
            <span className="text-2xl">💰</span>
            <span className="text-sm">Số dư</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
}
