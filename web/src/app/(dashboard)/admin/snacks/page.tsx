'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { snacksService } from '@/lib/api/services/snacks';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import Link from 'next/link';
import { ImageGallery } from '@/components/snacks/ImageGallery';

interface MenuItem {
  name: string;
  price: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';

export default function AdminSnacksPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([{ name: '', price: 0 }]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [savedImageUrls, setSavedImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMenus = async () => {
    try {
      const res: any = await snacksService.getMenus();
      setMenus(res.data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchMenus(); }, []);

  // ── Image upload helpers ──────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    addImages(files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    addImages(files);
  };

  const addImages = async (files: File[]) => {
    // Show previews immediately
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setUploadedImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);

    // Upload to server
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of files) {
      try {
        const res: any = await snacksService.uploadImage(file);
        newUrls.push(res.data.url);
      } catch (err: any) {
        toast.error(`Upload thất bại: ${err.message}`);
      }
    }
    setSavedImageUrls(prev => [...prev, ...newUrls]);
    setUploading(false);
  };

  const removeImage = async (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    // Delete from server if already uploaded
    const url = savedImageUrls[idx];
    if (url) {
      const filename = url.split('/').pop();
      if (filename) {
        try { await snacksService.deleteImage(filename); } catch { }
      }
    }
    setUploadedImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    setSavedImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleExtractAll = async () => {
    if (!uploadedImages.length) return;
    setExtracting(true);
    try {
      const accumulated: MenuItem[] = [];
      for (const img of uploadedImages) {
        const res: any = await snacksService.extractFromFile(img);
        const extracted: MenuItem[] = res.data?.items || [];
        accumulated.push(...extracted);
      }
      if (accumulated.length > 0) {
        setMenuItems(prev => {
          const existing = prev.filter(i => i.name.trim());
          return [...existing, ...accumulated];
        });
        toast.success(`AI nhận diện được ${accumulated.length} món!`);
      } else {
        toast.info('AI chưa nhận diện được món nào. Vui lòng nhập tay.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Nhận diện thất bại');
    } finally {
      setExtracting(false);
    }
  };

  // ── Item editing ──────────────────────────────────────────────

  const handleItemChange = (idx: number, field: 'name' | 'price', value: string) => {
    setMenuItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: field === 'price' ? Number(value) : value } : item
    ));
  };

  const handleCreateMenu = async () => {
    const validItems = menuItems.filter(i => i.name.trim() && i.price > 0);
    if (!validItems.length) { toast.error('Cần ít nhất 1 món hợp lệ'); return; }

    setCreating(true);
    try {
      await snacksService.createMenu({
        title: title.trim() || 'Menu đồ ăn vặt',
        imageUrls: savedImageUrls.length > 0 ? savedImageUrls : undefined,
        items: validItems,
      });
      toast.success('Tạo menu thành công!');
      setShowCreate(false);
      setTitle('');
      setMenuItems([{ name: '', price: 0 }]);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setUploadedImages([]);
      setImagePreviews([]);
      setSavedImageUrls([]);
      fetchMenus();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tạo menu');
    } finally { setCreating(false); }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ordering': return <Badge variant="default">🟢 Đang mở</Badge>;
      case 'settled': return <Badge variant="outline">✅ Đã chốt</Badge>;
      case 'cancelled': return <Badge variant="secondary">❌ Đã hủy</Badge>;
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

      {/* ── Create menu form ───────────────────────────────── */}
      {showCreate && (
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">📸 Tạo menu mới</h3>

          {/* Title */}
          <div className="space-y-2">
            <Label>Tên menu</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Menu chiều nay" />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Ảnh menu (tùy chọn, nhiều ảnh)</Label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <p className="text-3xl mb-2">📷</p>
              <p className="text-sm text-gray-600">Kéo thả hoặc click để chọn ảnh</p>
              <p className="text-xs text-gray-400 mt-1">Ảnh sẽ được lưu lại để người dùng xem</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Previews */}
            {imagePreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Ảnh ${i + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                    <button
                      onClick={e => { e.stopPropagation(); removeImage(i); }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors text-3xl"
                >
                  +
                </button>
              </div>
            )}

            {uploading && (
              <p className="text-xs text-blue-500">Đang tải ảnh lên...</p>
            )}

            {uploadedImages.length > 0 && (
              <Button
                onClick={handleExtractAll}
                disabled={extracting || uploading}
                variant="secondary"
                className="w-full"
              >
                {extracting
                  ? `🔄 Đang nhận diện ${uploadedImages.length} ảnh...`
                  : `🤖 AI Nhận diện ${uploadedImages.length} ảnh`}
              </Button>
            )}
          </div>

          {/* Items list */}
          <div className="space-y-3">
            <Label>Danh sách món</Label>
            {menuItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  value={item.name}
                  onChange={e => handleItemChange(i, 'name', e.target.value)}
                  placeholder="Tên món"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={item.price || ''}
                  onChange={e => handleItemChange(i, 'price', e.target.value)}
                  placeholder="Giá (đ)"
                  className="w-32"
                />
                {menuItems.length > 1 && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setMenuItems(prev => prev.filter((_, j) => j !== i))}
                  >✕</Button>
                )}
              </div>
            ))}
            <Button
              variant="outline" size="sm"
              onClick={() => setMenuItems(prev => [...prev, { name: '', price: 0 }])}
            >+ Thêm món</Button>
          </div>

          <Button onClick={handleCreateMenu} disabled={creating || uploading} className="w-full">
            {creating ? 'Đang tạo...' : '✅ Tạo menu'}
          </Button>
        </Card>
      )}

      {/* ── Menu list ──────────────────────────────────────── */}
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{menu.title}</p>
                    {statusBadge(menu.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Bởi {menu.creator_name} • {menu.item_count} món • {menu.order_count} người đặt • {formatDateTime(menu.created_at)}
                  </p>
                  {menu.total_revenue > 0 && (
                    <p className="text-sm text-green-600">Doanh thu: {formatCurrency(menu.total_revenue)}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {menu.status === 'ordering' && (
                    <Link href={`/admin/snacks/${menu.id}`}>
                      <Button size="sm" variant="outline">📋 Xem đơn & Chốt</Button>
                    </Link>
                  )}
                  {(menu.status === 'settled' || menu.status === 'cancelled') && (
                    <Link href={`/admin/snacks/${menu.id}`}>
                      <Button size="sm" variant="ghost">Xem</Button>
                    </Link>
                  )}
                </div>
              </div>
              {/* Menu images */}
              {menu.image_urls && menu.image_urls.length > 0 && (
                <ImageGallery images={menu.image_urls} baseUrl={API_BASE_URL} className="mt-3" />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
