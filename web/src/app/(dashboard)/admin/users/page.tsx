'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminService } from '@/lib/api/services/admin';
import { formatCurrency } from '@/lib/utils/formatters';
import { User } from '@/lib/types/user';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getUsers().then((res: any) => {
      setUsers(res.data?.users || res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">👥 Quản lý người dùng</h2>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium">Tên</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-right p-4 font-medium">Số dư</th>
                  <th className="text-center p-4 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4 text-gray-500">{u.email}</td>
                    <td className={`p-4 text-right font-mono ${u.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(u.balance)}
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
