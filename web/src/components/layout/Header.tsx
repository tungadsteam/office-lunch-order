'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { formatCurrency } from '@/lib/utils/formatters';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: '🏠', label: 'Dashboard' },
  { href: '/order', icon: '🍱', label: 'Đặt cơm' },
  { href: '/history', icon: '📜', label: 'Lịch sử' },
  { href: '/balance', icon: '💰', label: 'Nạp tiền' },
];

export default function Header() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  return (
    <>
      {/* Top header - mobile */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b">
        <Sheet>
          <SheetTrigger asChild>
            <button className="text-2xl">☰</button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-6 border-b">
              <h1 className="text-xl font-bold">🍱 Lunch Fund</h1>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                    pathname === item.href ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                  )}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              {user?.role === 'admin' && (
                <>
                  <div className="pt-3 pb-1">
                    <p className="px-3 text-xs font-semibold text-gray-400 uppercase">Admin</p>
                  </div>
                  <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600">
                    <span>📊</span><span>Admin</span>
                  </Link>
                  <Link href="/admin/deposits" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600">
                    <span>✅</span><span>Duyệt nạp tiền</span>
                  </Link>
                </>
              )}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
              <button
                onClick={() => { localStorage.removeItem('auth_token'); logout(); window.location.href = '/login'; }}
                className="text-sm text-red-500"
              >
                🚪 Đăng xuất
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <span className="text-sm font-medium">
          💰 {formatCurrency(user?.balance || 0)}
        </span>
      </header>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex z-50">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center py-2 text-xs',
              pathname === item.href ? 'text-blue-600' : 'text-gray-500'
            )}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
