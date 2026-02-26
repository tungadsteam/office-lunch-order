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
  confirmed: { label: '✅ Đã nhận', variant: 'outline' },
  disputed: { label: '⚠️ Tranh chấp', variant: 'destructive' },
};

const TYPE_MAP: Record<string, string> = {
  lunch_buyer: '🍱 Cơm trưa',
  snack_creator: '🍕 Đồ ăn vặt',
};

export default function ReimbursementsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const load = () => {
    reimbursementsService.getMy().then((res: any) => {
      setItems(res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleConfirm = async (id: number, received: boolean) => {
    if (!received && !confirm('Bạn chắc chắn chưa nhận được tiền?')) return;
    setProcessing(id);
    try {
      await reimbursementsService.confirm(id, received);
      toast.success(received ? 'Đã xác nhận nhận tiền!' : 'Đã báo chưa nhận');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">💰 Hoàn tiền của tôi</h2>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Chưa có yêu cầu hoàn tiền nào</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((r) => {
            const status = STATUS_MAP[r.status] || { label: r.status, variant: 'outline' as const };
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{TYPE_MAP[r.type] || r.type}</span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(parseFloat(r.amount))}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(r.created_at)}</p>
                  </div>
                </div>

                {r.admin_note && (
                  <p className="text-sm text-gray-600 mt-2">Admin: "{r.admin_note}"</p>
                )}

                {r.status === 'transferred' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleConfirm(r.id, true)}
                      disabled={processing === r.id}
                    >
                      ✅ Đã nhận tiền
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleConfirm(r.id, false)}
                      disabled={processing === r.id}
                    >
                      ❌ Chưa nhận
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
