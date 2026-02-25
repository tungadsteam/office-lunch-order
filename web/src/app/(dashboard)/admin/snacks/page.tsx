'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminSnacksService } from '@/lib/api/services/snacks';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import Link from 'next/link';

interface ExtractedItem {
  name: string;
  price: number;
}

export default function AdminSnacksPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create menu state
  const [showCreate, setShowCreate] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchMenus = async () => {
    try {
      const res: any = await adminSnacksService.getMenus();
      setMenus(res.data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchMenus(); }, []);

  const handleExtract = async () => {
    if (!imageUrl) { toast.error('Nhập URL ảnh menu'); return; }
    setExtracting(true);
    try {
      const res: any = await adminSnacksService.extractMenu(imageUrl);
      setExtractedItems(res.data.items || []);
      toast.success(`AI đã nhận diện ${res.data.items.length} món!`);
    } catch (err: any) {
      toast.error(err.message || 'Không thể nhận diện');
    } finally { setExtracting(false); }
  };

  const handleItemChange = (idx: number, field: string, value: string | number) => {
    setExtractedItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: field === 'price' ? Number(value) : value } : item
    ));
  };

  const handleRemoveItem = (idx: number) => {
    setExtractedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddItem = () => {
    setExtractedItems(prev => [...prev, { name: '', price: 0 }]);
  };

  const handleCreateMenu = async () => {
    const validItems = extractedItems.filter(i => i.name && i.price > 0);
    if (!validItems.length) { toast.error('Cần ít nhất 1 món'); return; }

    setCreating(true);
    try {
      const res: any = await adminSnacksService.createMenu({
        title: title || 'Menu đồ ăn vặt',
        imageUrl: imageUrl || undefined,
        items: validItems,
      });
      toast.success('Tạo menu thành công!');
      setShowCreate(false);
      setExtractedItems([]);
      setImageUrl('');
      setTitle('');
      fetchMenus();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tạo menu');
    } finally { setCreating(false); }
  };

  const handleActivate = async (menuId: number) => {
    try {
      await adminSnacksService.activateMenu(menuId);
      toast.success('Menu đã được kích hoạt! Users có thể đặt đồ.');
      fetchMenus();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi');
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">📝 Nháp</Badge>;
      case 'active': return <Badge variant="default">🟢 Đang mở</Badge>;
      case 'closed': return <Badge variant="outline">✅ Đã chốt</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🍕 Quản lý Đồ ăn vặt</h2>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Đóng' : '+ Tạo menu mới'}
        </Button>
      </div>

      {/* Create menu form */}
      {showCreate && (
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">📸 Tạo menu mới</h3>

          <div className="space-y-2">
            <Label>Tên menu</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Menu chiều nay" />
          </div>

          <div className="space-y-2">
            <Label>URL ảnh menu (tùy chọn)</Label>
            <div className="flex gap-2">
              <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="flex-1" />
              <Button onClick={handleExtract} disabled={extracting} variant="secondary">
                {extracting ? '🔄 Đang nhận diện...' : '🤖 AI Nhận diện'}
              </Button>
            </div>
          </div>

          {/* Items editor */}
          {extractedItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Danh sách món ({extractedItems.length})</h4>
              {extractedItems.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={item.name}
                    onChange={e => handleItemChange(i, 'name', e.target.value)}
                    placeholder="Tên món"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={item.price}
                    onChange={e => handleItemChange(i, 'price', e.target.value)}
                    placeholder="Giá"
                    className="w-32"
                  />
                  <span className="text-xs text-gray-400 w-8">đ</span>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(i)}>✕</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddItem}>+ Thêm món</Button>
            </div>
          )}

          {!extractedItems.length && (
            <Button variant="outline" onClick={handleAddItem}>+ Thêm món thủ công</Button>
          )}

          {extractedItems.length > 0 && (
            <Button onClick={handleCreateMenu} disabled={creating} className="w-full">
              {creating ? 'Đang tạo...' : '✅ Tạo menu'}
            </Button>
          )}
        </Card>
      )}

      {/* Menu list */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : menus.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Chưa có menu nào</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {menus.map(menu => (
            <Card key={menu.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{menu.title}</p>
                    {statusBadge(menu.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {menu.item_count} món • {menu.order_count} người đặt • {formatDateTime(menu.created_at)}
                  </p>
                  {menu.total_revenue > 0 && (
                    <p className="text-sm text-green-600">Doanh thu: {formatCurrency(menu.total_revenue)}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {menu.status === 'draft' && (
                    <Button size="sm" onClick={() => handleActivate(menu.id)}>🟢 Kích hoạt</Button>
                  )}
                  {menu.status === 'active' && (
                    <Link href={`/admin/snacks/${menu.id}`}>
                      <Button size="sm" variant="outline">📋 Xem đơn</Button>
                    </Link>
                  )}
                  {menu.status === 'closed' && (
                    <Link href={`/admin/snacks/${menu.id}`}>
                      <Button size="sm" variant="ghost">Xem</Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
