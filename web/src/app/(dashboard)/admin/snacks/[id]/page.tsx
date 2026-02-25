'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminSnacksService } from '@/lib/api/services/snacks';
import { formatCurrency } from '@/lib/utils/formatters';
import { toast } from 'sonner';

export default function SnackOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const menuId = Number(params.id);
  const [menu, setMenu] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId]);

  const fetchData = async () => {
    try {
      const [menuRes, ordersRes]: any[] = await Promise.all([
        adminSnacksService.getMenu(menuId),
        adminSnacksService.getMenuOrders(menuId),
      ]);
      setMenu(menuRes.data);
      setOrders(ordersRes.data || []);
    } catch { } finally { setLoading(false); }
  };

  const handleFinalize = async () => {
    if (!confirm('Chốt đơn? Sẽ trừ tiền tất cả users đã đặt.')) return;
    setFinalizing(true);
    try {
      const res: any = await adminSnacksService.finalizeMenu(menuId);
      toast.success(`Đã chốt! ${res.data.usersCharged} users, tổng ${formatCurrency(res.data.totalRevenue)}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi chốt đơn');
    } finally { setFinalizing(false); }
  };

  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total_cost), 0);
  const totalUsers = orders.length;

  if (loading) return <div className="text-center py-8 text-gray-500">Đang tải...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">📋 Đơn đặt: {menu?.title}</h2>
          <p className="text-gray-500">
            {menu?.status === 'active' ? '🟢 Đang mở' : '✅ Đã chốt'}
          </p>
        </div>
        {menu?.status === 'active' && (
          <Button onClick={handleFinalize} disabled={finalizing || !orders.length} variant="destructive">
            {finalizing ? 'Đang chốt...' : '🔒 Chốt đơn & Trừ tiền'}
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold">{totalUsers}</p>
          <p className="text-sm text-gray-500">👥 Người đặt</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          <p className="text-sm text-gray-500">💰 Tổng tiền</p>
        </Card>
      </div>

      {/* Orders by user */}
      {orders.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Chưa có ai đặt</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const insufficient = parseFloat(order.balance) < parseFloat(order.total_cost);
            return (
              <Card key={order.user_id} className={`p-4 ${insufficient ? 'border-red-300' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold">{order.user_name}</p>
                    <p className="text-xs text-gray-500">
                      Số dư: {formatCurrency(parseFloat(order.balance))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(parseFloat(order.total_cost))}</p>
                    {insufficient && (
                      <Badge variant="destructive" className="text-xs">⚠️ Thiếu tiền</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.item_name} ×{item.quantity}</span>
                      <span className="text-gray-600">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
