'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminService } from '@/lib/api/services/admin';
import { toast } from 'sonner';

export default function BroadcastForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung');
      return;
    }
    setLoading(true);
    try {
      await adminService.broadcast(title.trim(), body.trim());
      toast.success('Đã gửi thông báo cho tất cả người dùng!');
      setTitle('');
      setBody('');
    } catch (err: any) {
      toast.error(err.message || 'Gửi thông báo thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">📢 Gửi thông báo</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="broadcast-title">Tiêu đề</Label>
          <Input
            id="broadcast-title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="VD: Thông báo quan trọng"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="broadcast-body">Nội dung</Label>
          <textarea
            id="broadcast-body"
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Nhập nội dung thông báo..."
            rows={3}
            required
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Đang gửi...' : '📤 Gửi thông báo cho tất cả'}
        </Button>
      </form>
    </Card>
  );
}
