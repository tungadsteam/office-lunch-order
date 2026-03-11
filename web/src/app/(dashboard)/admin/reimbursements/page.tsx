'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { reimbursementsService } from '@/lib/api/services/reimbursements';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters';
import { toast } from 'sonner';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '⏳ Chờ chuyển', variant: 'secondary' },
  transferred: { label: '💸 Đã chuyển', variant: 'default' },
  confirmed: { label: '✅ Đã xác nhận', variant: 'outline' },
  disputed: { label: '⚠️ Tranh chấp', variant: 'destructive' },
};

export default function AdminReimbursementsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const load = () => {
    reimbursementsService.getAll(filter || undefined).then((res: any) => {
      setItems(res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleTransfer = async (id: number) => {
    const notes = prompt('Ghi chú (số ref chuyển khoản, v.v.):');
    setProcessing(id);
    try {
      await reimbursementsService.markTransferred(id, notes || undefined);
      toast.success('Đã đánh dấu chuyển tiền!');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi');
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = items.filter(r => r.status === 'pending').length;
  const disputedCount = items.filter(r => r.status === 'disputed').length;
  const totalPending = items
    .filter(r => r.status === 'pending')
    .reduce((s, r) => s + parseFloat(r.amount), 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">💰 Quản lý hoàn tiền</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-gray-500">Chờ chuyển</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{disputedCount}</p>
          <p className="text-xs text-gray-500">Tranh chấp</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-gray-500">Tổng cần chuyển</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'pending', 'transferred', 'confirmed', 'disputed'].map(s => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === '' ? 'Tất cả' : (STATUS_MAP[s]?.label || s)}
          </Button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Không có mục nào</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const status = STATUS_MAP[r.status] || { label: r.status, variant: 'outline' as const };
            return (
              <Card key={r.id} className={`p-4 ${r.status === 'disputed' ? 'border-red-300' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{r.user_name}</p>
                    <p className="text-xs text-gray-500">{r.user_email}</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(parseFloat(r.amount))}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs">{r.type === 'lunch_buyer' ? '🍱 Cơm trưa' : '🍕 Snack'}</span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(r.created_at)}</p>
                    {r.user_note && (
                      <p className="text-xs text-red-500 mt-1">User: "{r.user_note}"</p>
                    )}
                  </div>
                  {r.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleTransfer(r.id)}
                      disabled={processing === r.id}
                    >
                      {processing === r.id ? '...' : '💸 Đã chuyển'}
                    </Button>
                  )}
                  {r.status === 'disputed' && (
                    <Button
                      size="sm"
                      onClick={() => handleTransfer(r.id)}
                      disabled={processing === r.id}
                    >
                      🔄 Chuyển lại
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
