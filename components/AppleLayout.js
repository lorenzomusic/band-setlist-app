"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

const AppleLayout = ({ children }) => {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  
  const navigation = [
    { name: 'Songs', href: '/songs' },
    { name: 'Set Builder', href: '/sets' },
    { name: 'Gigs', href: '/gigs' },
    { name: 'AI Assistant', href: '/ai-setlist', protected: true },
    { name: 'Performance', href: '/performance' },
    { name: 'Admin', href: '/admin', protected: true }
  ];

  // Filter navigation based on authentication
  const visibleNavigation = navigation.filter(item => 
    !item.protected || isAuthenticated
  );

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Apple-style Header */}
      <header className="backdrop-apple border-b border-apple sticky top-0 z-50 h-[52px] flex items-center justify-between px-11">
        <div className="text-apple-title-3 text-primary font-semibold">
          Greatest Gig
        </div>
        
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-0 bg-transparent rounded-[9px] p-0.5">
          {visibleNavigation.map((item) => (
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
              {item.protected && (
                <span className="ml-1 text-xs opacity-60">🔒</span>
              )}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center gap-4">
          <div className="text-apple-callout text-secondary">
            Lorenzo&apos;s Band
          </div>
          
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <span className="text-apple-footnote text-secondary">
                🔐 {user?.isAdmin ? 'Admin' : 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="text-apple-footnote text-secondary hover:text-primary transition-colors px-2 py-1 rounded hover:bg-gray-100"
                title="Logout"
              >
                Sign Out
              </button>
            </div>
          )}
          
          {!isAuthenticated && pathname !== '/login' && (
            <Link
              href="/login"
              className="text-apple-footnote text-secondary hover:text-primary transition-colors px-2 py-1 rounded hover:bg-gray-100"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-[1440px] mx-auto">
        {children}
      </main>
      
      {/* Footer with Privacy Policy Link */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-[1440px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <span>© 2024 Greatest Gig</span>
              <Link 
                href="/privacy" 
                className="hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-xs">
                Not affiliated with Spotify AB
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Professional setlist management for bands
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppleLayout; 