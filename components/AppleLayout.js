"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useLanguage } from './LanguageProvider';

const AppleLayout = ({ children }) => {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const [openDropdown, setOpenDropdown] = useState(null);
  
  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.songs'), href: '/songs' },
    { name: t('nav.setBuilder'), href: '/sets' },
    { name: t('nav.gigs'), href: '/gigs' },
    { 
      name: t('nav.availability'), 
      protected: true,
      dropdown: [
        { name: t('nav.setAvailability'), href: '/availability' },
        { name: t('nav.dashboard'), href: '/availability/dashboard' },
        { name: t('nav.calendarFeeds'), href: '/calendar-feeds' }
      ]
    },
    { 
      name: t('nav.settings'), 
      protected: true,
      dropdown: [
        { name: t('nav.profile'), href: '/profile' },
        { name: t('nav.admin'), href: '/admin' }
      ]
    }
  ];

  // Filter navigation based on authentication
  const visibleNavigation = navigation.filter(item => 
    !item.protected || isAuthenticated
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  const handleLogout = async () => {
    if (confirm(t('auth.logoutConfirm'))) {
      await logout();
    }
  };

  // If not authenticated and not on a public route, show login prompt
  const publicRoutes = ['/login', '/register'];
  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-apple shadow-apple overflow-hidden">
            <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-50 to-purple-50">
              <h1 className="text-apple-title-1 text-primary mb-2">🔐 {t('auth.authRequired')}</h1>
              <p className="text-apple-body text-secondary">{t('auth.pleaseSignIn')}</p>
            </div>
            <div className="px-8 py-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  {t('auth.privateApp')}
                </p>
                <Link
                  href="/login"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-apple-button font-medium hover:bg-blue-700 transition-apple-fast shadow-sm"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                >
                  {t('auth.signIn')}
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
              <div key={item.name} className="relative">
                {item.dropdown ? (
                  // Dropdown item
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === item.name ? null : item.name);
                      }}
                      className={`px-4 py-1.5 rounded-[7px] text-apple-callout font-medium transition-apple-fast whitespace-nowrap flex items-center ${
                        item.dropdown.some(subItem => pathname === subItem.href)
                          ? 'bg-white text-primary shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                          : 'text-secondary hover:text-primary'
                      }`}
                    >
                      {item.name}
                      {item.protected && (
                        <span className="ml-1 text-xs opacity-60">🔒</span>
                      )}
                      <span className="ml-1 text-xs">▼</span>
                    </button>
                    {openDropdown === item.name && (
                      <div className="absolute top-full mt-1 right-0 bg-white rounded-[9px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-apple py-1 min-w-[180px] z-50">
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`block px-4 py-2 text-apple-callout font-medium transition-apple-fast ${
                              pathname === subItem.href
                                ? 'bg-blue-50 text-primary'
                                : 'text-secondary hover:text-primary hover:bg-gray-50'
                            }`}
                            onClick={() => setOpenDropdown(null)}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular item
                  <Link
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
                )}
              </div>
            ))}
          </nav>
        )}
        
        <div className="flex items-center gap-4">
          <div className="text-apple-callout text-secondary">
            Greatest Hit
          </div>
          
          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-[6px] p-1">
            <button
              onClick={() => changeLanguage('en')}
              className={`px-2 py-1 text-xs font-medium rounded-[4px] transition-apple-fast ${
                language === 'en'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('da')}
              className={`px-2 py-1 text-xs font-medium rounded-[4px] transition-apple-fast ${
                language === 'da'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              DA
            </button>
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
                {t('nav.signOut')}
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