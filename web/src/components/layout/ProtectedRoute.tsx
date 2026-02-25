'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, fetchUser } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else {
      fetchUser().finally(() => setChecked(true));
    }
  }, [token, router, fetchUser]);

  if (!token || !checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
