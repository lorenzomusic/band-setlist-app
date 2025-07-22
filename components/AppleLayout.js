"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

const AppleLayout = ({ children }) => {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Songs', href: '/songs' },
    { name: 'Set Builder', href: '/sets' },
    { name: 'Gigs', href: '/gigs' },
    { name: 'Calendar Feeds', href: '/calendar-feeds' },
    { name: 'Availability', href: '/availability', protected: true },
    { name: 'Availability Dashboard', href: '/availability/dashboard', protected: true },
    { name: 'AI Assistant', href: '/ai-setlist', protected: true },
    { name: 'Performance', href: '/performance' },
    { name: 'Profile', href: '/profile', protected: true },
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

  // If not authenticated and not on a public route, show login prompt
  const publicRoutes = ['/login', '/register', '/', '/songs', '/sets', '/gigs', '/calendar-feeds', '/performance'];
  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-apple shadow-apple overflow-hidden">
            <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-50 to-purple-50">
              <h1 className="text-apple-title-1 text-primary mb-2">🔐 Authentication Required</h1>
              <p className="text-apple-body text-secondary">Please sign in to access Greatest Gig</p>
            </div>
            <div className="px-8 py-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  This is a private band management app. You need to be invited to access it.
                </p>
                <Link
                  href="/login"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-apple-button font-medium hover:bg-blue-700 transition-apple-fast shadow-sm"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Apple-style Header */}
      <header className="backdrop-apple border-b border-apple sticky top-0 z-50 h-[52px] flex items-center justify-between px-11">
        <div className="text-apple-title-3 text-primary font-semibold">
          Greatest Gig
        </div>
        
        {/* Navigation Tabs - Only show if authenticated */}
        {isAuthenticated && (
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
        )}
        
        <div className="flex items-center gap-4">
          <div className="text-apple-callout text-secondary">
            Greatest Hit
          </div>
          
          {isAuthenticated && user && (
            <div className="flex items-center gap-3">
              <div className="text-apple-callout text-secondary">
                {user.name || user.email}
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-apple-callout text-secondary hover:text-primary transition-apple-fast"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default AppleLayout; 