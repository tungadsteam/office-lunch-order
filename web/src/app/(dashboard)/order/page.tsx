'use client';

import { useOrder } from '@/lib/hooks/useOrder';
import { useAuthStore } from '@/lib/store/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/formatters';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  ordering: '🟢 Đang đặt',
  open: '🟢 Đang mở',
  locked: '🔒 Đã chốt',
  settled: '✅ Đã thanh toán',
  finalized: '📋 Hoàn tất',
};

export default function OrderPage() {
  const { todaySession, participants, buyers, isJoined, isLoading, joinOrder, leaveOrder } = useOrder();
  const { user } = useAuthStore();

  const canOrder = todaySession?.status === 'ordering' || todaySession?.status === 'open';

  const handleJoin = async () => {
    try {
      await joinOrder();
      toast.success('Đã đặt cơm thành công! 🍱');
    } catch (err: any) {
      toast.error(err.message || 'Không thể đặt cơm');
    }
  };

  const handleLeave = async () => {
    try {
      await leaveOrder();
      toast.success('Đã hủy đặt cơm');
    } catch (err: any) {
      toast.error(err.message || 'Không thể hủy');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">🍱 Đặt cơm hôm nay</h2>

      {!todaySession ? (
        <Card className="p-8 text-center">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-gray-500 text-lg">Chưa có phiên đặt cơm hôm nay</p>
          <p className="text-gray-400 text-sm mt-2">Admin cần tạo phiên mới để bắt đầu</p>
        </Card>
      ) : (
        <>
          {/* Session info */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-semibold">{formatDate(todaySession.date)}</p>
                <p className="text-gray-500">{participants.length} người đã đặt</p>
              </div>
              <Badge variant="secondary">
                {STATUS_LABELS[todaySession.status] || todaySession.status}
              </Badge>
            </div>
            {canOrder && (
              <p className="text-sm text-amber-600">⏰ Chốt sổ lúc 11:30 AM</p>
            )}
          </Card>

          {/* Buyers */}
          {buyers.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">🛒 Biệt đội đi mua</h3>
              <div className="grid grid-cols-2 gap-2">
                {buyers.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                    <span className="text-lg">🛒</span>
                    <span className="text-sm font-medium">{b.user_name}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Participants */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">
              👥 Danh sách người đặt ({participants.length})
            </h3>
            {participants.length > 0 ? (
              <div className="space-y-2">
                {participants.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium">
                        {p.user_name}
                        {p.user_id === user?.id && ' (Bạn)'}
                      </span>
                    </div>
                    {p.is_buyer && <Badge variant="outline">🛒 Buyer</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Chưa có ai đặt cơm</p>
            )}
          </Card>

          {/* Action button */}
          {canOrder && (
            <div className="sticky bottom-20 md:bottom-4">
              {isJoined ? (
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full"
                  onClick={handleLeave}
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : '❌ Hủy đặt cơm'}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleJoin}
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : '✅ Đặt cơm hôm nay'}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
