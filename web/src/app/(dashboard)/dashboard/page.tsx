'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { OrderSummaryCard } from '@/components/dashboard/OrderSummaryCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { transactionsService } from '@/lib/api/services/transactions';
import { snacksService } from '@/lib/api/services/snacks';
import { formatCurrency, formatShortDate } from '@/lib/utils/formatters';
import { Transaction } from '@/lib/types/transaction';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [hasSnackMenu, setHasSnackMenu] = useState(false);

  useEffect(() => {
    transactionsService.getHistory(5).then((res: any) => {
      setRecentTx(res.data?.transactions || res.data || []);
    }).catch(() => {});
    snacksService.getActiveMenu().then((res: any) => {
      setHasSnackMenu(!!res.data);
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Xin chào, {user?.name} 👋</h2>
        <p className="text-gray-500 mt-1">Chào mừng bạn đến với Lunch Fund Manager</p>
      </div>

      {hasSnackMenu && (
        <Link href="/snacks">
          <Card className="p-4 bg-amber-50 border-amber-200 hover:shadow-md transition-shadow cursor-pointer">
            <p className="text-lg font-semibold">🍕 Menu đồ ăn vặt đang mở!</p>
            <p className="text-sm text-amber-700">Bấm để xem và đặt đồ ăn →</p>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BalanceCard />
        <OrderSummaryCard />
      </div>

      <QuickActions />

      {/* Recent transactions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🕒 Hoạt động gần đây</h3>
        {recentTx.length > 0 ? (
          <div className="space-y-3">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">
                    {tx.type === 'deposit' ? '💳 Nạp tiền' :
                     tx.type === 'expense' ? '🍱 Cơm trưa' :
                     tx.type === 'income' ? '💰 Hoàn tiền' : '📝 Điều chỉnh'}
                  </p>
                  <p className="text-xs text-gray-500">{formatShortDate(tx.created_at)}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Chưa có hoạt động nào</p>
        )}
      </Card>
    </div>
  );
}
