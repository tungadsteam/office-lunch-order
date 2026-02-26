'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { transactionsService } from '@/lib/api/services/transactions';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters';
import { Transaction } from '@/lib/types/transaction';
import { toast } from 'sonner';

export default function PendingDepositsPage() {
  const [deposits, setDeposits] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const loadDeposits = () => {
    transactionsService.getPending().then((res: any) => {
      setDeposits(res.data?.transactions || res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadDeposits(); }, []);

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      await transactionsService.approve(id);
      toast.success('Đã duyệt nạp tiền!');
      loadDeposits();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessing(id);
    try {
      await transactionsService.reject(id);
      toast.success('Đã từ chối');
      loadDeposits();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">✅ Duyệt nạp tiền</h2>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : deposits.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-5xl mb-4">✨</p>
          <p className="text-gray-500">Không có yêu cầu nạp tiền đang chờ</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {deposits.map((tx) => (
            <Card key={tx.id} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">{tx.user_name || `User #${tx.user_id}`}</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(tx.amount)}</p>
                  {tx.note && <p className="text-sm text-gray-500 mt-1">"{tx.note}"</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(tx.created_at)}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleApprove(tx.id)}
                  disabled={processing === tx.id}
                  className="flex-1"
                >
                  {processing === tx.id ? '...' : '✅ Duyệt'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(tx.id)}
                  disabled={processing === tx.id}
                  className="flex-1"
                >
                  {processing === tx.id ? '...' : '❌ Từ chối'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
