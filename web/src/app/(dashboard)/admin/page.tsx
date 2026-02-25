'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminService } from '@/lib/api/services/admin';
import { transactionsService } from '@/lib/api/services/transactions';

export default function AdminPage() {
  const [pendingCount, setPendingCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    transactionsService.getPending().then((res: any) => {
      const items = res.data?.transactions || res.data || [];
      setPendingCount(Array.isArray(items) ? items.length : 0);
    }).catch(() => {});

    adminService.getUsers().then((res: any) => {
      const items = res.data?.users || res.data || [];
      setUserCount(Array.isArray(items) ? items.length : 0);
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">🔧 Admin Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <p className="text-3xl font-bold">{userCount}</p>
          <p className="text-sm text-gray-500 mt-1">👥 Users</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-sm text-gray-500 mt-1">⏳ Pending Deposits</p>
        </Card>
        <Card className="p-6 text-center">
          <p className="text-3xl font-bold text-green-600">0</p>
          <p className="text-sm text-gray-500 mt-1">🍱 Hôm nay</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/deposits">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <h3 className="text-lg font-semibold">✅ Duyệt nạp tiền</h3>
            <p className="text-sm text-gray-500 mt-1">
              {pendingCount > 0 ? `${pendingCount} yêu cầu đang chờ` : 'Không có yêu cầu mới'}
            </p>
            <Button variant="outline" className="mt-4">Xem ngay →</Button>
          </Card>
        </Link>
        <Link href="/admin/users">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <h3 className="text-lg font-semibold">👥 Quản lý người dùng</h3>
            <p className="text-sm text-gray-500 mt-1">{userCount} người dùng</p>
            <Button variant="outline" className="mt-4">Xem ngay →</Button>
          </Card>
        </Link>
      </div>
    </div>
  );
}
