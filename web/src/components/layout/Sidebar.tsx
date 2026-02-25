'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: '🏠', label: 'Dashboard' },
  { href: '/order', icon: '🍱', label: 'Đặt cơm hôm nay' },
  { href: '/history', icon: '📜', label: 'Lịch sử' },
  { href: '/balance', icon: '💰', label: 'Số dư & Nạp tiền' },
];

const adminItems = [
  { href: '/admin', icon: '📊', label: 'Admin Dashboard' },
  { href: '/admin/deposits', icon: '✅', label: 'Duyệt nạp tiền' },
  { href: '/admin/users', icon: '👥', label: 'Quản lý users' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200 h-screen">
      {/* Logo */}
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary-600">🍱 Lunch Fund</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý quỹ cơm trưa</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase">Admin</p>
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('auth_token');
            logout();
            window.location.href = '/login';
          }}
          className="mt-3 w-full text-sm text-gray-500 hover:text-red-600 transition-colors text-left"
        >
          🚪 Đăng xuất
        </button>
      </div>
    </aside>
  );
}
