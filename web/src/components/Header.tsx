'use client';

import { subscribeToPushNotifications } from '@/lib/utils/push';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // When user is logged in, try to subscribe them to notifications
    if (user) {
      subscribeToPushNotifications();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-gray-800">
          Lunch Fund
        </Link>
        <nav>
          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/" className="text-gray-600 hover:text-gray-800">Home</Link>
                <Link href="/history" className="text-gray-600 hover:text-gray-800">History</Link>
                <Link href="/reimbursement" className="text-gray-600 hover:text-gray-800">Reimbursement</Link>
                {user.is_admin && (
                  <Link href="/admin" className="text-gray-600 hover:text-gray-800 font-bold">Admin</Link>
                )}
                <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-800">Login</Link>
                <Link href="/register" className="text-gray-600 hover:text-gray-800">Register</Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-2">
          {user ? (
            <>
              <Link href="/" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link href="/history" className="block text-gray-600" onClick={() => setMenuOpen(false)}>History</Link>
              <Link href="/reimbursement" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Reimbursement</Link>
              {user.is_admin && (
                <Link href="/admin" className="block text-gray-600 font-bold" onClick={() => setMenuOpen(false)}>Admin</Link>
              )}
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="w-full text-left bg-red-500 text-white px-3 py-1 rounded">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link href="/register" className="block text-gray-600" onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
