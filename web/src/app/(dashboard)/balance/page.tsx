'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store/authStore';
import { transactionsService } from '@/lib/api/services/transactions';
import { adminService } from '@/lib/api/services/admin';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters';
import { Transaction } from '@/lib/types/transaction';
import { toast } from 'sonner';

export default function BalancePage() {
  const { user, fetchUser } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deposits, setDeposits] = useState<Transaction[]>([]);
  const [bankInfo, setBankInfo] = useState<Record<string, string>>({});

  const loadDeposits = () => {
    transactionsService.getHistory(20, 0, 'deposit').then((res: any) => {
      setDeposits(res.data?.transactions || res.data || []);
    }).catch(() => {});
  };

  useEffect(() => {
    loadDeposits();
    adminService.getBankInfo().then((res: any) => {
      setBankInfo(res.data || {});
    }).catch(() => {});
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(amount);
    if (!amt || amt < 10000) {
      toast.error('Số tiền tối thiểu 10,000đ');
      return;
    }

    setSubmitting(true);
    try {
      await transactionsService.deposit({ amount: amt, note: note || undefined });
      toast.success('Đã gửi yêu cầu nạp tiền! Admin sẽ duyệt sớm.');
      setAmount('');
      setNote('');
      loadDeposits();
      fetchUser();
    } catch (err: any) {
      toast.error(err.message || 'Không thể nạp tiền');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="default">✅ Đã duyệt</Badge>;
      case 'pending': return <Badge variant="secondary">⏳ Chờ duyệt</Badge>;
      case 'rejected': return <Badge variant="destructive">❌ Từ chối</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">💰 Số dư & Nạp tiền</h2>

      {/* Current balance */}
      <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <p className="text-sm opacity-80">Số dư hiện tại</p>
        <p className="text-4xl font-bold mt-1">{formatCurrency(user?.balance || 0)}</p>
      </Card>

      {/* Bank info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">🏦 Thông tin chuyển khoản</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Ngân hàng:</span>
            <span className="font-medium">{bankInfo.bank_name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Số TK:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium">{bankInfo.bank_account_number || '—'}</span>
              {bankInfo.bank_account_number && (
                <button
                  onClick={() => { navigator.clipboard.writeText(bankInfo.bank_account_number); toast.success('Đã copy!'); }}
                  className="text-blue-600 text-xs hover:underline"
                >
                  Copy
                </button>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Chủ TK:</span>
            <span className="font-medium">{bankInfo.bank_account_name || '—'}</span>
          </div>
        </div>
      </Card>

      {/* Deposit form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📝 Báo nạp tiền</h3>
        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Số tiền đã chuyển (VNĐ)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="500000"
              min={10000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
            <Input
              id="note"
              placeholder="Nạp tiền tháng 2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Tôi đã nạp tiền'}
          </Button>
        </form>
      </Card>

      {/* Deposit history */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📜 Lịch sử nạp tiền</h3>
        {deposits.length > 0 ? (
          <div className="space-y-3">
            {deposits.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{formatCurrency(tx.amount)}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(tx.created_at)}</p>
                  {tx.note && <p className="text-xs text-gray-400">{tx.note}</p>}
                </div>
                {statusBadge(tx.status)}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Chưa có lịch sử nạp tiền</p>
        )}
      </Card>
    </div>
  );
}
