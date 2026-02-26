'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminService } from '@/lib/api/services/admin';
import { toast } from 'sonner';

interface Setting {
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

const LUNCH_RULE_KEYS = ['buyer_count', 'order_deadline_time', 'low_balance_threshold'];
const BANK_KEYS = ['bank_account_number', 'bank_account_name', 'bank_name'];

const INPUT_TYPE: Record<string, string> = {
  buyer_count: 'number',
  low_balance_threshold: 'number',
  order_deadline_time: 'time',
};

function SettingRow({
  setting,
  onSaved,
}: {
  setting: Setting;
  onSaved: (key: string, value: string) => void;
}) {
  const [value, setValue] = useState(setting.value);
  const [loading, setLoading] = useState(false);
  const unchanged = value === setting.value;

  const handleSave = async () => {
    setLoading(true);
    try {
      await adminService.updateSetting(setting.key, value);
      toast.success(`✅ Đã lưu ${setting.description}`);
      onSaved(setting.key, value);
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <Label className="text-sm font-medium text-gray-700">{setting.description}</Label>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{setting.key}</p>
      </div>
      <Input
        type={INPUT_TYPE[setting.key] || 'text'}
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-44"
      />
      <Button
        size="sm"
        onClick={handleSave}
        disabled={loading || unchanged}
      >
        {loading ? '...' : 'Lưu'}
      </Button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getSettings().then((res: any) => {
      setSettings(res.data || []);
    }).catch(() => {
      toast.error('Không thể tải cài đặt');
    }).finally(() => setLoading(false));
  }, []);

  const handleSaved = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const lunchRules = settings.filter(s => LUNCH_RULE_KEYS.includes(s.key));
  const bankInfo = settings.filter(s => BANK_KEYS.includes(s.key));

  if (loading) {
    return <div className="max-w-2xl mx-auto p-8 text-center text-gray-400">Đang tải...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">⚙️ Cài đặt hệ thống</h2>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-1">🍱 Quy tắc đặt cơm</h3>
        <p className="text-sm text-gray-500 mb-4">Điều chỉnh số người đi mua, giờ chốt sổ và ngưỡng số dư thấp</p>
        {lunchRules.map(s => (
          <SettingRow key={s.key} setting={s} onSaved={handleSaved} />
        ))}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-1">🏦 Thông tin ngân hàng</h3>
        <p className="text-sm text-gray-500 mb-4">Tài khoản admin nhận tiền nạp từ người dùng</p>
        {bankInfo.map(s => (
          <SettingRow key={s.key} setting={s} onSaved={handleSaved} />
        ))}
      </Card>
    </div>
  );
}
