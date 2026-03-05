'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', icon: '🏠', label: 'Home' },
  { href: '/order', icon: '🍱', label: 'Đặt cơm' },
  { href: '/snacks', icon: '🍕', label: 'Ăn vặt' },
  { href: '/balance', icon: '💰', label: 'Số dư' },
  { href: '/history', icon: '📜', label: 'Lịch sử' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full text-xs transition-colors',
                isActive
                  ? 'text-primary-600 font-semibold'
                  : 'text-gray-400'
              )}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
