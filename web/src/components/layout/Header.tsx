'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { subscribeToPushNotifications } from '@/lib/utils/push';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: '🏠', label: 'Dashboard' },
  { href: '/order', icon: '🍱', label: 'Đặt cơm hôm nay' },
  { href: '/snacks', icon: '🍕', label: 'Đồ ăn vặt' },
  { href: '/history', icon: '📜', label: 'Lịch sử' },
  { href: '/balance', icon: '💰', label: 'Số dư & Nạp tiền' },
  { href: '/reimbursements', icon: '🧾', label: 'Hoàn tiền' },
];

const adminItems = [
  { href: '/admin', icon: '📊', label: 'Admin Dashboard' },
  { href: '/admin/deposits', icon: '✅', label: 'Duyệt nạp tiền' },
  { href: '/admin/snacks', icon: '🍕', label: 'Quản lý đồ ăn vặt' },
  { href: '/admin/reimbursements', icon: '🧾', label: 'Quản lý hoàn tiền' },
  { href: '/admin/users', icon: '👥', label: 'Quản lý users' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    subscribeToPushNotifications();
  }, []);

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="text-lg font-bold text-primary-600">🍱 Lunch Fund</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile navigation drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-14 bg-black/30 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <nav className="fixed top-14 left-0 right-0 bg-white z-50 border-b border-gray-200 shadow-lg max-h-[80vh] overflow-y-auto">
            <div className="p-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
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
                  {adminItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        pathname === item.href
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </>
              )}

              {/* User info + logout */}
              <div className="pt-3 mt-2 border-t">
                <div className="flex items-center gap-3 px-3 py-2">
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
                    setIsOpen(false);
                    localStorage.removeItem('auth_token');
                    logout();
                    window.location.href = '/login';
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  🚪 Đăng xuất
                </button>
              </div>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
