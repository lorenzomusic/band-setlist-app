"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Routes that require authentication
const PROTECTED_ROUTES = ['/admin', '/ai-setlist'];

// Routes that are always public (no auth required)
const PUBLIC_ROUTES = ['/login', '/'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuthStatus();
  }, [pathname]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      
      setIsAuthenticated(data.authenticated);
      setUser(data.authenticated ? { isAdmin: data.isAdmin } : null);
      
      // Handle redirects based on authentication status
      if (data.authenticated) {
        // User is logged in
        if (pathname === '/login') {
          // Redirect away from login page if already authenticated
          router.push('/');
        }
      } else {
        // User is not authenticated
        if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
          // Redirect to login with return URL
          const returnTo = encodeURIComponent(pathname);
          router.push(`/login?returnTo=${returnTo}`);
        }
      }
      
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
      
      // On error, redirect protected routes to login
      if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
        const returnTo = encodeURIComponent(pathname);
        router.push(`/login?returnTo=${returnTo}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (response.ok) {
      setIsAuthenticated(true);
      setUser({ isAdmin: true });
      return { success: true, ...data };
    } else {
      return { success: false, error: data.error };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      router.push('/login');
    }
  };

  // Show loading spinner for protected routes while checking auth
  if (isLoading && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="bg-white rounded-apple shadow-apple p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-blue border-t-transparent rounded-full animate-spin"></div>
            <span className="text-apple-body text-secondary">Checking authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 