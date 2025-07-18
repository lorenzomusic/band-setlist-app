"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const AppleLayout = ({ children }) => {
  const pathname = usePathname();
  
  const navigation = [
    { name: 'Songs', href: '/songs' },
    { name: 'Set Builder', href: '/sets' },
    { name: 'Gigs', href: '/gigs' },
    { name: 'AI Assistant', href: '/ai-setlist' },
    { name: 'Performance', href: '/performance' }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Apple-style Header */}
      <header className="backdrop-apple border-b border-apple sticky top-0 z-50 h-[52px] flex items-center justify-between px-11">
        <div className="text-apple-title-3 text-primary font-semibold">
          Greatest Gig
        </div>
        
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-0 bg-transparent rounded-[9px] p-0.5">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`px-4 py-1.5 rounded-[7px] text-apple-callout font-medium transition-apple-fast whitespace-nowrap ${
                pathname === item.href
                  ? 'bg-white text-primary shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="text-apple-callout text-secondary">
          Lorenzo&apos;s Band
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-[1440px] mx-auto">
        {children}
      </main>
    </div>
  );
};

export default AppleLayout; 