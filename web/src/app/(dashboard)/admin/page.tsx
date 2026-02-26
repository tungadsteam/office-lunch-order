'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminService } from '@/lib/api/services/admin';
import { transactionsService } from '@/lib/api/services/transactions';
import { ordersService } from '@/lib/api/services/orders';
import { formatDate } from '@/lib/utils/formatters';
import { toast } from 'sonner';

const SESSION_STATUS_LABELS: Record<string, string> = {
  ordering: '🟢 Đang nhận đơn',
  buyers_selected: '🛒 Đã chọn người mua',
  buying: '🧾 Đang thanh toán',
  payment_submitted: '⏳ Chờ admin chuyển khoản',
  settled: '✅ Đã quyết toán',
  cancelled: '❌ Đã hủy',
};

export default function AdminPage() {
  const [pendingCount, setPendingCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectingId, setSelectingId] = useState<number | null>(null);

  const fetchSessions = () => {
    ordersService.getSessions().then((res: any) => {
      // Axios interceptor returns response.data directly, so res = {success, data: [...]}
      setSessions(res.data || []);
    }).catch(() => {});
  };

  useEffect(() => {
    transactionsService.getPending().then((res: any) => {
      const items = res.data?.transactions || res.data || [];
      setPendingCount(Array.isArray(items) ? items.length : 0);
    }).catch(() => {});

    adminService.getUsers().then((res: any) => {
      const items = res.data?.users || res.data || [];
      setUserCount(Array.isArray(items) ? items.length : 0);
    }).catch(() => {});

    fetchSessions();
  }, []);

  const handleSelectBuyers = async (sessionId: number) => {
    setSelectingId(sessionId);
    try {
      const res: any = await ordersService.selectBuyersById(sessionId);
      const count = res.data?.buyers?.length || 4;
      toast.success(`✅ Đã chốt! Chọn ${count} người đi mua.`);
      fetchSessions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Không thể chọn người mua');
    } finally {
      setSelectingId(null);
    }
  };

  const latestOrderCount = sessions[0]?.order_count || 0;

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
          <p className="text-3xl font-bold text-green-600">{latestOrderCount}</p>
          <p className="text-sm text-gray-500 mt-1">🍱 Đặt cơm mới nhất</p>
        </Card>
      </div>

      {/* All lunch sessions */}
      <div>
        <h3 className="text-lg font-semibold mb-3">📋 Quản lý phiên cơm</h3>
        {sessions.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">Chưa có phiên cơm nào</Card>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => (
              <Card key={s.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{formatDate(s.session_date)}</p>
                    <p className="text-sm text-gray-500">{s.order_count} người đặt cơm</p>
                  </div>
                  <Badge variant="secondary">
                    {SESSION_STATUS_LABELS[s.status] || s.status}
                  </Badge>
                </div>

                {s.buyers && s.buyers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="text-xs text-gray-500 self-center">🛒 Người mua:</span>
                    {s.buyers.map((b: any) => (
                      <Badge key={b.id} variant="outline" className="text-xs">{b.name}</Badge>
                    ))}
                  </div>
                )}

                {s.status === 'ordering' && (
                  <Button
                    size="sm"
                    disabled={selectingId === s.id}
                    onClick={() => handleSelectBuyers(s.id)}
                    className="w-full"
                  >
                    {selectingId === s.id ? 'Đang chọn...' : '🎯 Chốt sổ & chọn người mua'}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
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
        <Link href="/admin/reimbursements">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <h3 className="text-lg font-semibold">💰 Hoàn tiền</h3>
            <p className="text-sm text-gray-500 mt-1">Duyệt yêu cầu hoàn tiền mua cơm</p>
            <Button variant="outline" className="mt-4">Xem ngay →</Button>
          </Card>
        </Link>
        <Link href="/admin/settings">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <h3 className="text-lg font-semibold">⚙️ Cài đặt hệ thống</h3>
            <p className="text-sm text-gray-500 mt-1">Giờ chốt sổ, số người mua, thông tin ngân hàng</p>
            <Button variant="outline" className="mt-4">Xem ngay →</Button>
          </Card>
        </Link>
      </div>
    </div>
  );
}
