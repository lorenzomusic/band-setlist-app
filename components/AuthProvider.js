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

// Routes that are always public (no auth required)
const PUBLIC_ROUTES = ['/login', '/register'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bandMember, setBandMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [impersonation, setImpersonation] = useState({ isImpersonating: false });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuthStatus();
  }, [pathname]);

  // Route protection for replacement members
  useEffect(() => {
    if (isAuthenticated && bandMember && !bandMember.isCore && !isLoading) {
      const allowedRoutes = ['/gigs', '/profile'];
      const isAllowedRoute = allowedRoutes.some(route => pathname.startsWith(route)) || pathname === '/';
      
      if (!isAllowedRoute) {
        console.log('Replacement member blocked from:', pathname);
        router.push('/gigs');
      }
    }
  }, [isAuthenticated, bandMember, pathname, isLoading, router]);

  // Redirect replacement members from home to gigs
  useEffect(() => {
    if (isAuthenticated && bandMember && !bandMember.isCore && pathname === '/') {
      router.push('/gigs');
    }
  }, [isAuthenticated, bandMember, pathname, router]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      
      setIsAuthenticated(data.authenticated);
      setUser(data.authenticated ? data.user : null);
      setBandMember(data.authenticated ? data.bandMember : null);
      setImpersonation(data.authenticated ? data.impersonating : { isImpersonating: false });
      
      // Handle redirects based on authentication status
      if (data.authenticated) {
        // User is logged in
        if (pathname === '/login') {
          // Redirect away from login page if already authenticated
          router.push('/');
        }
      } else {
        // User is not authenticated
        const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
        
        if (!isPublicRoute) {
          // Redirect to login with return URL for all non-public routes
          const returnTo = encodeURIComponent(pathname);
          router.push(`/login?returnTo=${returnTo}`);
        }
      }
      
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
      setBandMember(null);
      setImpersonation({ isImpersonating: false });
      
      // On error, redirect non-public routes to login
      const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
      if (!isPublicRoute) {
        const returnTo = encodeURIComponent(pathname);
        router.push(`/login?returnTo=${returnTo}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      setIsAuthenticated(true);
      setUser(data.user);
      setBandMember(data.bandMember);
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
      setBandMember(null);
      setImpersonation({ isImpersonating: false });
      router.push('/login');
    }
  };

  const startImpersonation = async (userId) => {
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh auth status to get updated impersonation data
        await checkAuthStatus();
        return { success: true, ...data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Impersonation error:', error);
      return { success: false, error: 'Failed to start impersonation' };
    }
  };

  const stopImpersonation = async () => {
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh auth status to get restored admin session
        await checkAuthStatus();
        return { success: true, ...data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Stop impersonation error:', error);
      return { success: false, error: 'Failed to stop impersonation' };
    }
  };

  // Show loading spinner for non-public routes while checking auth
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  if (isLoading && !isPublicRoute) {
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
    bandMember,
    isAuthenticated,
    isLoading,
    impersonation,
    login,
    logout,
    startImpersonation,
    stopImpersonation,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 