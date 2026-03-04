'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { snacksService } from '@/lib/api/services/snacks';
import { reimbursementsService } from '@/lib/api/services/reimbursements';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters';
import { confirmToast } from '@/lib/utils/confirm-toast';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from 'sonner';
import { ImageGallery } from '@/components/snacks/ImageGallery';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';

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

interface MenuItem {
  name: string;
  price: number;
}

interface OrderByUser {
  user_id: number;
  user_name: string;
  total_cost: number;
  items: { item_name: string; quantity: number; subtotal: number }[];
}

export default function SnacksPage() {
  const { user, fetchUser } = useAuthStore();

  // Active menu ordering state
  const [menu, setMenu] = useState<any>(null);
  const [items, setItems] = useState<SnackItem[]>([]);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [cart, setCart] = useState<Map<number, number>>(new Map());
  const [submitting, setSubmitting] = useState(false);

  // All menus list
  const [allMenus, setAllMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Orders list (who ordered what)
  const [allOrders, setAllOrders] = useState<OrderByUser[]>([]);
  const [showOrders, setShowOrders] = useState(false);

  // Create menu state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMenuItems, setNewMenuItems] = useState<MenuItem[]>([{ name: '', price: 0 }]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [savedImageUrls, setSavedImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Finalize / cancel state
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);

  // Expand active menu to show items
  const [expandedActiveMenu, setExpandedActiveMenu] = useState(false);

  // Historical menu orders (lazy loaded on expand)
  const [expandedMenuId, setExpandedMenuId] = useState<number | null>(null);
  const [historyOrders, setHistoryOrders] = useState<Map<number, OrderByUser[]>>(new Map());
  const [loadingHistoryId, setLoadingHistoryId] = useState<number | null>(null);

  // My snack reimbursements (pending/transferred)
  const [myReimbursements, setMyReimbursements] = useState<any[]>([]);
  const [reimbProcessing, setReimbProcessing] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [activeRes, allRes]: any[] = await Promise.all([
        snacksService.getActiveMenu(),
        snacksService.getMenus(),
      ]);

      const activeData = activeRes.data;
      if (activeData) {
        setMenu(activeData.menu);
        setItems(activeData.items || []);
        setMyOrders(activeData.myOrders || []);
        const existingCart = new Map<number, number>();
        (activeData.myOrders || []).forEach((o: MyOrder) => existingCart.set(o.item_id, o.quantity));
        setCart(existingCart);

        // Fetch orders for the active menu so everyone can see who ordered what
        try {
          const ordersRes: any = await snacksService.getMenuOrders(activeData.menu.id);
          setAllOrders(ordersRes.data || []);
        } catch {
          setAllOrders([]);
        }
      } else {
        setMenu(null);
        setItems([]);
        setMyOrders([]);
        setCart(new Map());
        setAllOrders([]);
      }

      setAllMenus(allRes.data || []);
    } catch {
      setMenu(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReimbursements = async () => {
    try {
      const res: any = await reimbursementsService.getMy();
      const snackOnes = (res.data || []).filter(
        (r: any) => r.type === 'snack_creator' && r.status !== 'confirmed'
      );
      setMyReimbursements(snackOnes);
    } catch { }
  };

  useEffect(() => { fetchData(); fetchReimbursements(); }, []);

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
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setUploadedImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);

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
        setNewMenuItems(prev => {
          const existing = prev.filter(i => i.name.trim());
          return [...existing, ...accumulated];
        });
        toast.success(`AI nhận diện được ${accumulated.length} món!`);
      } else {
        toast.info('AI chưa nhận diện được món nào. Vui lòng nhập tay.');
        if (newMenuItems.length === 0) setNewMenuItems([{ name: '', price: 0 }]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Nhận diện thất bại');
    } finally {
      setExtracting(false);
    }
  };

  // ── Create menu helpers ───────────────────────────────────────

  const handleNewItemChange = (idx: number, field: 'name' | 'price', value: string) => {
    setNewMenuItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, [field]: field === 'price' ? Number(value) : value } : item
    ));
  };

  const handleCreateMenu = async () => {
    if (!newTitle.trim()) { toast.error('Nhập tên menu'); return; }
    const validItems = newMenuItems.filter(i => i.name.trim() && i.price > 0);
    if (!validItems.length) { toast.error('Cần ít nhất 1 món hợp lệ'); return; }

    setCreating(true);
    try {
      await snacksService.createMenu({
        title: newTitle.trim(),
        imageUrls: savedImageUrls.length > 0 ? savedImageUrls : undefined,
        items: validItems,
      });
      toast.success('Tạo menu thành công! Menu đã được kích hoạt.');
      setShowCreate(false);
      setNewTitle('');
      setNewMenuItems([{ name: '', price: 0 }]);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setUploadedImages([]);
      setImagePreviews([]);
      setSavedImageUrls([]);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tạo menu');
    } finally { setCreating(false); }
  };

  // ── Ordering helpers ──────────────────────────────────────────

  const updateCart = (itemId: number, delta: number) => {
    setCart(prev => {
      const next = new Map(prev);
      const newQty = Math.max(0, (next.get(itemId) || 0) + delta);
      if (newQty > 0) next.set(itemId, newQty);
      else next.delete(itemId);
      return next;
    });
  };

  const getCartTotal = () => {
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

  const handleSubmitOrder = async () => {
    const orderItems = Array.from(cart.entries())
      .filter(([, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));
    if (!orderItems.length) { toast.error('Giỏ hàng trống!'); return; }

    const balance = user?.balance ?? 0;
    if (balance < cartTotal) {
      toast.error(`Số dư không đủ! Cần ${formatCurrency(cartTotal)}, hiện có ${formatCurrency(balance)}`);
      return;
    }

    setSubmitting(true);
    try {
      await snacksService.placeOrder(menu.id, orderItems);
      toast.success('Đặt đồ ăn vặt thành công! 🍕');
      await fetchData();
      await fetchUser();
    } catch (err: any) {
      toast.error(err.message || 'Không thể đặt hàng');
    } finally { setSubmitting(false); }
  };

  const handleCancelAllOrders = () => {
    confirmToast('Hủy tất cả đơn đồ ăn vặt?', {
      confirmLabel: 'Hủy đơn',
      onConfirm: async () => {
        setSubmitting(true);
        try {
          for (const order of myOrders) await snacksService.cancelOrder(order.id);
          toast.success('Đã hủy đơn');
          setCart(new Map());
          await fetchData();
        } catch (err: any) {
          toast.error(err.message || 'Không thể hủy');
        } finally { setSubmitting(false); }
      },
    });
  };

  // ── Finalize / Cancel helpers ─────────────────────────────────

  const handleFinalize = (menuId: number) => {
    confirmToast('🔒 Chốt đơn?', {
      description: 'Sẽ trừ tiền tất cả users đã đặt. Admin sẽ chuyển khoản lại cho bạn.',
      confirmLabel: 'Chốt đơn',
      onConfirm: async () => {
        setActionMenuId(menuId);
        try {
          const res: any = await snacksService.finalizeMenu(menuId);
          toast.success(res.data?.message || 'Đã chốt đơn! Admin sẽ chuyển tiền cho bạn sớm.');
          await Promise.all([fetchData(), fetchReimbursements()]);
        } catch (err: any) {
          toast.error(err.message || 'Chốt đơn thất bại');
        } finally { setActionMenuId(null); }
      },
    });
  };

  const doReimbConfirm = async (id: number, received: boolean) => {
    setReimbProcessing(id);
    try {
      await reimbursementsService.confirm(id, received);
      toast.success(received ? 'Đã xác nhận nhận tiền!' : 'Đã báo admin chưa nhận. Admin sẽ kiểm tra lại.');
      await fetchReimbursements();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi');
    } finally { setReimbProcessing(null); }
  };

  const handleReimbConfirm = (id: number, received: boolean) => {
    if (!received) {
      confirmToast('Chưa nhận được tiền?', {
        description: 'Admin sẽ được thông báo để kiểm tra lại.',
        confirmLabel: 'Xác nhận chưa nhận',
        onConfirm: () => doReimbConfirm(id, false),
      });
      return;
    }
    doReimbConfirm(id, true);
  };

  const handleCancelMenu = (menuId: number) => {
    confirmToast('Hủy menu này?', {
      description: 'Sẽ không trừ tiền ai.',
      confirmLabel: 'Hủy menu',
      onConfirm: async () => {
        setActionMenuId(menuId);
        try {
          await snacksService.cancelMenu(menuId);
          toast.success('Đã hủy menu');
          await fetchData();
        } catch (err: any) {
          toast.error(err.message || 'Hủy thất bại');
        } finally { setActionMenuId(null); }
      },
    });
  };

  // active menu has 'created_by' (from sm.*); allMenus list has 'creator_id' (aliased)
  const isMyMenu = (m: any) => (m.creator_id ?? m.created_by) === user?.id;

  const toggleMenuHistory = async (menuId: number) => {
    if (expandedMenuId === menuId) { setExpandedMenuId(null); return; }
    setExpandedMenuId(menuId);
    if (historyOrders.has(menuId)) return;
    setLoadingHistoryId(menuId);
    try {
      const res: any = await snacksService.getMenuOrders(menuId);
      setHistoryOrders(prev => new Map(prev).set(menuId, res.data || []));
    } catch {
      setHistoryOrders(prev => new Map(prev).set(menuId, []));
    } finally {
      setLoadingHistoryId(null);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Đang tải...</div>;

  const cartTotal = getCartTotal();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🍕 Đồ ăn vặt</h2>
        <Button variant="outline" size="sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Đóng' : '+ Tạo menu'}
        </Button>
      </div>

      {/* ── Reimbursement status for menu creator ──────────── */}
      {myReimbursements.map(r => (
        <Card
          key={r.id}
          className={`p-4 ${r.status === 'transferred' ? 'border-green-400 bg-green-50' : 'border-amber-300 bg-amber-50'}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">
                {r.status === 'transferred' ? '💸 Admin đã chuyển tiền cho bạn' : '⏳ Chờ admin chuyển tiền'}
              </p>
              <p className="text-2xl font-bold mt-0.5">{formatCurrency(parseFloat(r.amount))}</p>
              {r.status === 'pending' && (
                <p className="text-xs text-amber-700 mt-1">
                  Bạn đã chốt đơn đồ ăn vặt — admin sẽ chuyển khoản lại cho bạn
                </p>
              )}
              {r.admin_note && (
                <p className="text-xs text-gray-600 mt-1">Admin: &quot;{r.admin_note}&quot;</p>
              )}
            </div>
          </div>
          {r.status === 'transferred' && (
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => handleReimbConfirm(r.id, true)}
                disabled={reimbProcessing === r.id}
              >
                ✅ Đã nhận tiền
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleReimbConfirm(r.id, false)}
                disabled={reimbProcessing === r.id}
              >
                ❌ Chưa nhận
              </Button>
            </div>
          )}
        </Card>
      ))}

      {/* ── Create menu form ───────────────────────────────── */}
      {showCreate && (
        <Card className="p-5 space-y-4 border-blue-200 bg-blue-50">
          <h3 className="font-semibold text-blue-800">📝 Tạo menu mới</h3>

          {/* Title */}
          <div className="space-y-1">
            <Label>Tên menu</Label>
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="VD: Trà sữa chiều nay"
              className="bg-white"
            />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Ảnh menu (tùy chọn, nhiều ảnh)</Label>
            <div
              className="border-2 border-dashed border-blue-300 rounded-lg p-5 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-100 transition-colors bg-white"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <p className="text-2xl mb-1">📷</p>
              <p className="text-sm text-gray-600">Kéo thả hoặc click để chọn ảnh</p>
              <p className="text-xs text-gray-400 mt-1">Chọn được nhiều ảnh cùng lúc</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Image previews */}
            {imagePreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Ảnh ${i + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors text-2xl"
                >
                  +
                </button>
              </div>
            )}

            {uploading && (
              <p className="text-xs text-blue-500">Đang tải ảnh lên...</p>
            )}

            {/* Extract button */}
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

          {/* Menu items */}
          <div className="space-y-2">
            <Label>Danh sách món</Label>
            {newMenuItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  value={item.name}
                  onChange={e => handleNewItemChange(i, 'name', e.target.value)}
                  placeholder="Tên món"
                  className="flex-1 bg-white"
                />
                <Input
                  type="number"
                  value={item.price || ''}
                  onChange={e => handleNewItemChange(i, 'price', e.target.value)}
                  placeholder="Giá (đ)"
                  className="w-28 bg-white"
                />
                {newMenuItems.length > 1 && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setNewMenuItems(prev => prev.filter((_, j) => j !== i))}
                  >✕</Button>
                )}
              </div>
            ))}
            <Button
              variant="outline" size="sm"
              onClick={() => setNewMenuItems(prev => [...prev, { name: '', price: 0 }])}
            >+ Thêm món</Button>
          </div>

          <Button onClick={handleCreateMenu} disabled={creating || uploading} className="w-full">
            {creating ? 'Đang tạo...' : '✅ Tạo & Kích hoạt menu'}
          </Button>
        </Card>
      )}

      {/* ── Active menu ordering ───────────────────────────── */}
      {menu ? (
        <>
          <p className="text-sm text-gray-500">Số dư: {formatCurrency(user?.balance || 0)}</p>

          {/* Collapsible menu card — click header to expand items */}
          <div className="rounded-xl border border-green-200 bg-green-50 overflow-hidden">
            {/* Header row */}
            <button
              className="w-full p-4 text-left"
              onClick={() => setExpandedActiveMenu(prev => !prev)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-800">🟢 {menu.title}</p>
                  {menu.creator_name && (
                    <p className="text-xs text-green-600">
                      Tạo bởi {menu.creator_name}{isMyMenu(menu) ? ' (Bạn)' : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  {isMyMenu(menu) && (
                    <>
                      <Button
                        size="sm" variant="destructive"
                        onClick={() => handleCancelMenu(menu.id)}
                        disabled={actionMenuId === menu.id}
                      >Hủy</Button>
                      <Button
                        size="sm"
                        onClick={() => handleFinalize(menu.id)}
                        disabled={actionMenuId === menu.id}
                      >🔒 Chốt đơn</Button>
                    </>
                  )}
                  <span className="text-green-600 ml-1">{expandedActiveMenu ? '▲' : '▼'}</span>
                </div>
              </div>
            </button>

            {/* Menu images */}
            {menu.image_urls && menu.image_urls.length > 0 && (
              <div className="px-4 pb-2">
                <ImageGallery images={menu.image_urls} baseUrl={API_BASE_URL} />
              </div>
            )}

            {/* Expanded: my order summary + items + who ordered */}
            {expandedActiveMenu && (
              <div className="border-t border-green-200 bg-white p-4 space-y-3">
                {myOrders.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-amber-700">✅ Bạn đã đặt {myOrders.length} món</p>
                      <p className="text-xs text-amber-600">
                        Tổng: {formatCurrency(myOrders.reduce((s, o) => s + parseFloat(String(o.price)) * o.quantity, 0))}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCancelAllOrders} disabled={submitting}>
                      Hủy tất cả
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {items.map(item => {
                    const qty = cart.get(item.id) || 0;
                    const existingOrder = myOrders.find(o => o.item_id === item.id);
                    return (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{item.name}</p>
                            {existingOrder && <Badge variant="secondary" className="text-xs">Đã đặt</Badge>}
                          </div>
                          <p className="text-blue-600 text-sm font-semibold">{formatCurrency(parseFloat(String(item.price)))}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline" size="sm"
                            onClick={() => updateCart(item.id, -1)}
                            disabled={qty === 0}
                            className="w-8 h-8 p-0"
                          >−</Button>
                          <span className="w-8 text-center font-semibold text-sm">{qty}</span>
                          <Button
                            variant="outline" size="sm"
                            onClick={() => updateCart(item.id, 1)}
                            className="w-8 h-8 p-0"
                          >+</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ai đặt gì */}
                <div className="border rounded-lg p-3">
                  <button
                    className="w-full flex items-center justify-between text-left"
                    onClick={() => setShowOrders(o => !o)}
                  >
                    <span className="font-semibold text-sm">
                      👥 Ai đặt gì
                      {allOrders.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          ({allOrders.length} người • {formatCurrency(allOrders.reduce((s, o) => s + o.total_cost, 0))})
                        </span>
                      )}
                    </span>
                    <span className="text-gray-400 text-xs">{showOrders ? '▲' : '▼'}</span>
                  </button>
                  {showOrders && (
                    <div className="mt-2 space-y-2">
                      {allOrders.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">Chưa có ai đặt</p>
                      ) : (
                        allOrders.map(order => (
                          <div key={order.user_id} className="border rounded-md p-2">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">
                                {order.user_name}
                                {order.user_id === user?.id && (
                                  <span className="ml-1 text-xs text-blue-500">(Bạn)</span>
                                )}
                              </p>
                              <p className="text-sm font-semibold text-green-700">
                                {formatCurrency(order.total_cost)}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs text-gray-500">
                                  <span>{item.item_name} ×{item.quantity}</span>
                                  <span>{formatCurrency(item.subtotal)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        !showCreate && (
          <Card className="p-8 text-center">
            <p className="text-5xl mb-4">🍕</p>
            <p className="text-gray-500 text-lg">Chưa có menu đồ ăn vặt nào đang mở</p>
            <p className="text-gray-400 text-sm mt-2">Bấm &quot;+ Tạo menu&quot; để tạo menu mới!</p>
          </Card>
        )
      )}

      {/* ── All menus list ─────────────────────────────────── */}
      {allMenus.filter(m => m.id !== menu?.id).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Lịch sử menu</h3>
          <div className="space-y-2">
            {allMenus.filter(m => m.id !== menu?.id).map(m => {
              const isExpanded = expandedMenuId === m.id;
              const orders = historyOrders.get(m.id) || [];
              return (
                <Card key={m.id} className="p-3">
                  {/* Header row — clickable to expand/collapse */}
                  <button
                    className="w-full text-left"
                    onClick={() => toggleMenuHistory(m.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{m.title}</p>
                          <Badge variant={m.status === 'settled' ? 'outline' : 'secondary'} className="text-xs">
                            {m.status === 'ordering' ? '🟢 Đang mở' : m.status === 'settled' ? '✅ Đã chốt' : '❌ Đã hủy'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">
                          {m.creator_name} • {m.order_count} người • {formatDateTime(m.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {m.status === 'ordering' && isMyMenu(m) && (
                          <>
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => handleCancelMenu(m.id)}
                              disabled={actionMenuId === m.id}
                              className="text-xs h-7"
                            >Hủy</Button>
                            <Button
                              size="sm" variant="outline"
                              onClick={() => handleFinalize(m.id)}
                              disabled={actionMenuId === m.id}
                              className="text-xs h-7"
                            >Chốt</Button>
                          </>
                        )}
                        <span className="text-gray-400 ml-1">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>
                  </button>

                  {/* Menu images */}
                  {m.image_urls && m.image_urls.length > 0 && (
                    <div className="mt-2">
                      <ImageGallery images={m.image_urls} baseUrl={API_BASE_URL} />
                    </div>
                  )}

                  {/* Expandable order details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {loadingHistoryId === m.id ? (
                        <p className="text-xs text-gray-400 text-center py-1">Đang tải...</p>
                      ) : orders.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-1">Chưa có ai đặt</p>
                      ) : (
                        orders.map(order => (
                          <div key={order.user_id} className="border rounded-md p-2">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium">
                                {order.user_name}
                                {order.user_id === user?.id && (
                                  <span className="ml-1 text-xs text-blue-500">(Bạn)</span>
                                )}
                              </p>
                              <p className="text-sm font-semibold text-green-700">
                                {formatCurrency(order.total_cost)}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs text-gray-500">
                                  <span>{item.item_name} ×{item.quantity}</span>
                                  <span>{formatCurrency(item.subtotal)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sticky cart bar ────────────────────────────────── */}
      {cart.size > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-40">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600">{cart.size} món</span>
              <span className="text-xl font-bold">{formatCurrency(cartTotal)}</span>
            </div>
            <Button
              className="w-full" size="lg"
              onClick={handleSubmitOrder}
              disabled={submitting || !hasChanges()}
            >
              {submitting ? 'Đang đặt...' : myOrders.length > 0 ? '🔄 Cập nhật đơn' : '🍕 Đặt đồ ăn vặt'}
            </Button>
            {cartTotal > (user?.balance ?? 0) && (
              <p className="text-xs text-red-500 text-center mt-2">
                ⚠️ Số dư không đủ — hiện có {formatCurrency(user?.balance ?? 0)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
