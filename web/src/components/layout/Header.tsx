'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { subscribeToPushNotifications } from '@/lib/utils/push'; // Assuming push utils are in this path

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Attempt to subscribe to push notifications when the main component mounts
    // This will trigger the permission prompt if not already granted
    subscribeToPushNotifications();
  }, []);


  return (
    <header className="fixed top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-black bg-opacity-50 backdrop-blur-md">
      <Link href="/" className="text-2xl font-bold">Kling</Link>
      
      <nav className="hidden md:flex">
        <Link href="#home" className="mx-4 hover:text-blue-400 transition-colors">Home</Link>
        <Link href="#showcase" className="mx-4 hover:text-blue-400 transition-colors">Showcase</Link>
        <Link href="#faq" className="mx-4 hover:text-blue-400 transition-colors">FAQ</Link>
      </nav>

      <div className="hidden md:block">
        <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors">Join Waitlist</button>
      </div>

      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-black bg-opacity-90 flex flex-col items-center py-4">
          <Link href="#home" className="my-2" onClick={() => setIsOpen(false)}>Home</Link>
          <Link href="#showcase" className="my-2" onClick={() => setIsOpen(false)}>Showcase</Link>
          <Link href="#faq" className="my-2" onClick={() => setIsOpen(false)}>FAQ</Link>
          <button className="mt-4 px-4 py-2 bg-blue-600 rounded">Join Waitlist</button>
        </div>
      )}
    </header>
  );
};

export default Header;
