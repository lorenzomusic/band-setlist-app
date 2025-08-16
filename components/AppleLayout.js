"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useLanguage } from './LanguageProvider';

const AppleLayout = ({ children }) => {
  const pathname = usePathname();
  const { isAuthenticated, user, bandMember, impersonation, stopImpersonation, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Check if user is a replacement band member (non-core member)
  const isReplacementMember = bandMember && !bandMember.isCore;
  
  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.songs'), href: '/songs' },
    { name: t('nav.setBuilder'), href: '/sets' },
    { name: t('nav.gigs'), href: '/gigs' },
    { 
      name: t('nav.planning'), 
      protected: true,
      dropdown: [
        { name: t('nav.setAvailability'), href: '/availability' },
        { name: t('nav.calendar'), href: '/availability/dashboard' },
        { name: t('nav.rehearsals'), href: '/rehearsals' },
        { name: t('nav.calendarFeeds'), href: '/calendar-feeds' }
      ]
    },
    { 
      name: t('nav.settings'), 
      protected: true,
      dropdown: [
        { name: t('nav.profile'), href: '/profile' },
        { name: t('nav.admin'), href: '/admin' },
        { name: 'Band Members', href: '/admin/band-members' }
      ]
    }
  ];

  // Filter navigation based on authentication and user type
  const visibleNavigation = navigation.filter(item => {
    // Check authentication first
    if (item.protected && !isAuthenticated) {
      return false;
    }
    
    // For replacement members, only show Gigs and Settings (profile only)
    if (isReplacementMember) {
      if (item.href === '/gigs') {
        return true; // Allow gigs
      }
      if (item.name === t('nav.settings')) {
        // Filter settings dropdown to only show profile
        item.dropdown = item.dropdown.filter(dropdownItem => 
          dropdownItem.name === t('nav.profile')
        );
        return true;
      }
      return false; // Hide everything else
    }
    
    return true; // Show all navigation for core members and admins
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
      setIsMobileMenuOpen(false);
    };
    
    if (openDropdown || isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown, isMobileMenuOpen]);

  const handleLogout = async () => {
    if (confirm(t('auth.logoutConfirm'))) {
      await logout();
    }
  };

  const handleStopImpersonation = async () => {
    if (confirm('Stop impersonation and return to your admin account?')) {
      const result = await stopImpersonation();
      if (!result.success) {
        alert(`Failed to stop impersonation: ${result.error}`);
      }
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
      {/* Impersonation Status Bar */}
      {impersonation?.isImpersonating && (
        <div className="bg-orange-100 border-b border-orange-200 px-4 py-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-orange-800">
                🎭 Admin Impersonation: You are viewing as <strong>{impersonation.targetUser?.username}</strong>
              </span>
              <span className="text-xs text-orange-600">
                (Admin: {impersonation.originalUser?.username})
              </span>
            </div>
            <button
              onClick={handleStopImpersonation}
              className="px-3 py-1 text-xs bg-orange-200 text-orange-800 rounded hover:bg-orange-300 transition-colors font-medium"
            >
              Stop Impersonation
            </button>
          </div>
        </div>
      )}

      {/* Mobile-First Responsive Header */}
      <header className="backdrop-apple border-b border-apple sticky top-0 z-50">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          {/* Left: Hamburger Menu */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="p-2 -ml-2 text-primary hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Center: Brand */}
          <div className="text-apple-title-3 text-primary font-semibold">
            Greatest Gig
          </div>

          {/* Right: Language Toggle */}
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
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between px-6 lg:px-11 h-[52px]">
          <div className="text-apple-title-3 text-primary font-semibold">
            Greatest Gig
          </div>
          
          {/* Desktop Navigation */}
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
            
            {/* Desktop Language Toggle */}
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
                {/* User Info with Avatar */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-apple-callout text-primary font-medium">
                      {user.username || 'User'}
                    </div>
                    <div className="text-xs text-secondary">
                      {user.isAdmin ? 'Admin' : 'Member'}
                      {bandMember && ` • ${bandMember.instrument}`}
                    </div>
                  </div>
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
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && isAuthenticated && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-apple shadow-apple z-50">
            <nav className="px-4 py-2">
              {visibleNavigation.map((item) => (
                <div key={item.name} className="py-1">
                  {item.dropdown ? (
                    // Mobile dropdown - show all items directly
                    <>
                      <div className="text-apple-callout font-semibold text-primary py-3 border-b border-gray-100">
                        {item.name}
                      </div>
                      {item.dropdown.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`block pl-4 py-3 text-apple-body transition-apple-fast ${
                            pathname === subItem.href
                              ? 'text-blue bg-blue-50'
                              : 'text-secondary hover:text-primary hover:bg-gray-50'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </>
                  ) : (
                    // Regular mobile item
                    <Link
                      href={item.href}
                      className={`block py-4 text-apple-body font-medium transition-apple-fast border-b border-gray-50 ${
                        pathname === item.href
                          ? 'text-blue'
                          : 'text-primary hover:text-blue'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
              
              {/* Mobile User Info */}
              {user && (
                <div className="py-4 border-t border-gray-100 mt-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">
                        {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="text-apple-callout text-primary font-medium">
                        {user.username || 'User'}
                      </div>
                      <div className="text-xs text-secondary">
                        {user.isAdmin ? 'Admin' : 'Member'}
                        {bandMember && ` • ${bandMember.instrument}`}
                      </div>
                      {user.email && (
                        <div className="text-xs text-gray-500">{user.email}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-apple-body text-red-600 font-medium"
                  >
                    {t('nav.signOut')}
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default AppleLayout; 