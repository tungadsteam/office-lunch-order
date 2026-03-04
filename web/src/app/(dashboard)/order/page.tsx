'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useOrder } from '@/lib/hooks/useOrder';
import { useAuthStore } from '@/lib/store/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ordersService } from '@/lib/api/services/orders';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  ordering: '🟢 Đang đặt',
  open: '🟢 Đang mở',
  locked: '🔒 Đã chốt',
  buyers_selected: '🛒 Đã chọn người mua',
  buying: '🧾 Đang thanh toán',
  settled: '✅ Đã thanh toán',
  finalized: '📋 Hoàn tất',
};

export default function OrderPage() {
  const { todaySession, participants, buyers, isJoined, isLoading, isForTomorrow, targetDate, orderDeadline, joinOrder, leaveOrder, claimPayment } = useOrder();
  const { user, fetchUser } = useAuthStore();

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);

  const canOrder = todaySession?.status === 'ordering' || todaySession?.status === 'open';
  const MIN_ORDER_BALANCE = 60000;
  const hasEnoughBalance = (user?.balance || 0) >= MIN_ORDER_BALANCE;

  const isABuyer = buyers.some(b => b.user_id === user?.id);
  const iAmPayer = todaySession?.payer_id === user?.id;

  // All 4 buyers see "Tôi thanh toán" when buyers just selected
  const canClaimPayment = isABuyer && todaySession?.status === 'buyers_selected';

  // Only the person who claimed sees the form
  const canSubmitPayment = iAmPayer && todaySession?.status === 'buying';

  // The other 3 buyers waiting
  const isWaitingForPayer = isABuyer && !iAmPayer && todaySession?.status === 'buying';

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

  // Click "Tôi thanh toán" → hiện form ngay bên dưới (không popup)
  const handleClaimPayment = () => {
    setShowClaimForm(true);
  };

  // Submit: gọi claimPayment() rồi submitPayment() liên tiếp
  const handleSubmitPayment = async () => {
    const amount = parseInt(paymentAmount.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount <= 0) {
      toast.error('Nhập số tiền hợp lệ');
      return;
    }

    setPaymentLoading(true);
    try {
      // Nếu chưa claim (từ buyers_selected), claim trước
      if (canClaimPayment && showClaimForm) {
        await claimPayment();
      }
      await ordersService.submitPayment({ total_bill: amount, note: paymentNote || undefined });
      toast.success(`✅ Thanh toán thành công! Admin sẽ chuyển khoản ${formatCurrency(amount)} cho bạn.`);
      setPaymentAmount('');
      setPaymentNote('');
      setShowClaimForm(false);
      await fetchUser();
    } catch (err: any) {
      toast.error(err.message || 'Thanh toán thất bại');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">
        🍱 {isForTomorrow ? `Đặt cơm ngày mai (${targetDate ? new Date(targetDate).toLocaleDateString('vi-VN') : ''})` : 'Đặt cơm hôm nay'}
      </h2>
      {isForTomorrow && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
          ⏰ Đã quá 12h trưa — bạn đang đặt cơm cho <strong>ngày mai</strong>
        </div>
      )}

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
              <p className="text-sm text-amber-600">⏰ Chốt sổ lúc {orderDeadline}</p>
            )}
          </Card>

          {/* === PAYMENT STATES === */}

          {/* State 1: Buyers can claim — click shows inline form */}
          {canClaimPayment && (
            <Card className="p-6 border-blue-200 bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-800 mb-1">🛒 Bạn được chọn đi mua cơm!</h3>
              <p className="text-sm text-blue-600 mb-4">
                Ai trong nhóm sẽ thanh toán hôm nay? Chỉ 1 người bấm, người còn lại không cần làm gì.
              </p>
              {!showClaimForm ? (
                <Button className="w-full" onClick={handleClaimPayment}>
                  💳 Tôi thanh toán hôm nay
                </Button>
              ) : (
                <div className="space-y-3 mt-2">
                  <div className="space-y-1">
                    <Label>Tổng tiền hóa đơn (VND)</Label>
                    <Input
                      type="number"
                      placeholder="500000"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      className="bg-white"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Ghi chú (tùy chọn)</Label>
                    <Input
                      placeholder="Quán Cơm Tấm 37"
                      value={paymentNote}
                      onChange={e => setPaymentNote(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  {paymentAmount && parseInt(paymentAmount) > 0 && (
                    <p className="text-sm text-blue-700">
                      Mỗi người trả: ~{formatCurrency(Math.ceil(parseInt(paymentAmount) / Math.max(participants.length, 1)))}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowClaimForm(false)}>
                      Hủy
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSubmitPayment}
                      disabled={paymentLoading || !paymentAmount}
                    >
                      {paymentLoading ? 'Đang xử lý...' : '✅ Xác nhận thanh toán'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* State 2: I already claimed (page refresh case) — enter the amount */}
          {canSubmitPayment && (
            <Card className="p-6 border-green-200 bg-green-50">
              <h3 className="text-lg font-semibold text-green-800 mb-1">💳 Bạn đã nhận thanh toán!</h3>
              <p className="text-sm text-green-600 mb-4">
                Nhập tổng tiền thực tế đã trả. Hệ thống sẽ chia đều cho {participants.length} người.
                Admin sẽ chuyển khoản lại cho bạn.
              </p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Tổng tiền hóa đơn (VND)</Label>
                  <Input
                    type="number"
                    placeholder="500000"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Ghi chú (tùy chọn)</Label>
                  <Input
                    placeholder="Quán Cơm Tấm 37"
                    value={paymentNote}
                    onChange={e => setPaymentNote(e.target.value)}
                    className="bg-white"
                  />
                </div>
                {paymentAmount && parseInt(paymentAmount) > 0 && (
                  <p className="text-sm text-green-700">
                    Mỗi người trả: ~{formatCurrency(Math.ceil(parseInt(paymentAmount) / Math.max(participants.length, 1)))}
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={handleSubmitPayment}
                  disabled={paymentLoading || !paymentAmount}
                >
                  {paymentLoading ? 'Đang xử lý...' : '✅ Xác nhận thanh toán'}
                </Button>
              </div>
            </Card>
          )}

          {/* State 3: I'm a buyer but someone else claimed */}
          {isWaitingForPayer && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <p className="text-amber-700 text-sm font-medium">
                ⏳ <strong>{todaySession.payer_name || 'Đồng nghiệp'}</strong> đang nhập số tiền...
              </p>
            </Card>
          )}

          {/* Already settled notice for buyer */}
          {isABuyer && todaySession.status === 'settled' && (
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-green-700 text-sm font-medium">
                ✅ Đã thanh toán thành công. Theo dõi hoàn tiền tại mục &quot;Hoàn tiền&quot;.
              </p>
            </Card>
          )}

          {/* Buyers */}
          {buyers.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3">🛒 Biệt đội đi mua</h3>
              <div className="grid grid-cols-2 gap-2">
                {buyers.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                    <span className="text-lg">🛒</span>
                    <span className="text-sm font-medium">
                      {b.user_name}
                      {b.user_id === user?.id ? ' (Bạn)' : ''}
                    </span>
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

          {/* Join/Leave action button */}
          {canOrder && (
            <div className="pt-2 pb-4">
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
              ) : !hasEnoughBalance ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center space-y-2">
                  <p className="text-red-700 font-medium text-sm">
                    💳 Số dư không đủ để đặt cơm
                  </p>
                  <p className="text-red-500 text-xs">
                    Cần tối thiểu <strong>{formatCurrency(MIN_ORDER_BALANCE)}</strong> — hiện tại: <strong>{formatCurrency(user?.balance || 0)}</strong>
                  </p>
                  <Link href="/balance">
                    <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                      Nạp tiền ngay →
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleJoin}
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang xử lý...' : isForTomorrow ? '✅ Đặt cơm ngày mai' : '✅ Đặt cơm hôm nay'}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
