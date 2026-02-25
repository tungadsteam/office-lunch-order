'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { snacksService } from '@/lib/api/services/snacks';
import { formatCurrency } from '@/lib/utils/formatters';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from 'sonner';

interface SnackItem {
  id: number;
  name: string;
  price: number;
  description?: string;
}

interface MyOrder {
  id: number;
  item_id: number;
  item_name: string;
  quantity: number;
  price: number;
}

export default function SnacksPage() {
  const { user, fetchUser } = useAuthStore();
  const [menu, setMenu] = useState<any>(null);
  const [items, setItems] = useState<SnackItem[]>([]);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [cart, setCart] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchMenu = async () => {
    try {
      const res: any = await snacksService.getActiveMenu();
      const data = res.data;
      if (data) {
        setMenu(data.menu);
        setItems(data.items || []);
        setMyOrders(data.myOrders || []);
        // Initialize cart from existing orders
        const existingCart = new Map<number, number>();
        (data.myOrders || []).forEach((o: MyOrder) => {
          existingCart.set(o.item_id, o.quantity);
        });
        setCart(existingCart);
      }
    } catch {
      // no active menu
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  const updateCart = (itemId: number, delta: number) => {
    setCart(prev => {
      const next = new Map(prev);
      const current = next.get(itemId) || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty > 0) next.set(itemId, newQty);
      else next.delete(itemId);
      return next;
    });
  };

  const getTotal = () => {
    let total = 0;
    cart.forEach((qty, itemId) => {
      const item = items.find(i => i.id === itemId);
      if (item) total += parseFloat(String(item.price)) * qty;
    });
    return total;
  };

  const hasChanges = () => {
    const existingMap = new Map<number, number>();
    myOrders.forEach(o => existingMap.set(o.item_id, o.quantity));
    if (cart.size !== existingMap.size) return true;
    for (const [id, qty] of cart) {
      if (existingMap.get(id) !== qty) return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    const orderItems = Array.from(cart.entries())
      .filter(([, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));

    if (!orderItems.length) {
      toast.error('Giỏ hàng trống!');
      return;
    }

    setSubmitting(true);
    try {
      await snacksService.placeOrder(menu.id, orderItems);
      toast.success('Đặt đồ ăn vặt thành công! 🍕');
      await fetchMenu();
      await fetchUser();
    } catch (err: any) {
      toast.error(err.message || 'Không thể đặt hàng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAll = async () => {
    if (!confirm('Hủy tất cả đơn đồ ăn vặt?')) return;
    setSubmitting(true);
    try {
      for (const order of myOrders) {
        await snacksService.cancelOrder(order.id);
      }
      toast.success('Đã hủy đơn');
      setCart(new Map());
      await fetchMenu();
    } catch (err: any) {
      toast.error(err.message || 'Không thể hủy');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Đang tải...</div>;

  if (!menu) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">🍕 Đồ ăn vặt</h2>
        <Card className="p-8 text-center">
          <p className="text-5xl mb-4">🍕</p>
          <p className="text-gray-500 text-lg">Chưa có menu đồ ăn vặt nào đang mở</p>
          <p className="text-gray-400 text-sm mt-2">Admin sẽ mở menu khi có đồ ăn mới!</p>
        </Card>
      </div>
    );
  }

  const total = getTotal();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-32">
      <div>
        <h2 className="text-2xl font-bold">🍕 {menu.title}</h2>
        <p className="text-gray-500 mt-1">Số dư: {formatCurrency(user?.balance || 0)}</p>
      </div>

      {myOrders.length > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">✅ Bạn đã đặt {myOrders.length} món</p>
              <p className="text-xs text-green-600">
                Tổng: {formatCurrency(myOrders.reduce((s, o) => s + parseFloat(String(o.price)) * o.quantity, 0))}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCancelAll} disabled={submitting}>
              Hủy tất cả
            </Button>
          </div>
        </Card>
      )}

      {/* Menu items */}
      <div className="space-y-3">
        {items.map(item => {
          const qty = cart.get(item.id) || 0;
          const existingOrder = myOrders.find(o => o.item_id === item.id);

          return (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.name}</p>
                    {existingOrder && <Badge variant="secondary" className="text-xs">Đã đặt</Badge>}
                  </div>
                  <p className="text-blue-600 font-semibold">{formatCurrency(parseFloat(String(item.price)))}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => updateCart(item.id, -1)}
                    disabled={qty === 0}
                    className="w-8 h-8 p-0"
                  >
                    −
                  </Button>
                  <span className="w-8 text-center font-semibold">{qty}</span>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => updateCart(item.id, 1)}
                    className="w-8 h-8 p-0"
                  >
                    +
                  </Button>
                </div>
              </div>
              {qty > 0 && (
                <p className="text-xs text-gray-500 mt-1 text-right">
                  = {formatCurrency(parseFloat(String(item.price)) * qty)}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Sticky bottom bar */}
      {cart.size > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-40">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600">{cart.size} món</span>
              <span className="text-xl font-bold">{formatCurrency(total)}</span>
            </div>
            <Button
              className="w-full" size="lg"
              onClick={handleSubmit}
              disabled={submitting || !hasChanges()}
            >
              {submitting ? 'Đang đặt...' : myOrders.length > 0 ? '🔄 Cập nhật đơn' : '🍕 Đặt đồ ăn vặt'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
