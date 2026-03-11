'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/authStore';
import { formatCurrency } from '@/lib/utils/formatters';
import Link from 'next/link';

export function BalanceCard() {
  const { user } = useAuthStore();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">💰 Số dư hiện tại</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(user?.balance || 0)}</p>
        </div>
        <Link href="/balance">
          <Button variant="outline">Nạp tiền</Button>
        </Link>
      </div>
    </Card>
  );
}
