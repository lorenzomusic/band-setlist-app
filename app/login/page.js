"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '../../components/LoginForm';

export default function LoginPage() {
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      
      if (data.authenticated) {
        // Already logged in, redirect to intended page or home
        const returnTo = searchParams.get('returnTo') || '/';
        router.push(returnTo);
        return;
      }
      
      // Check if this is first time setup
      setIsFirstTime(data.isFirstTime);
      
    } catch (error) {
      console.error('Auth check error:', error);
      setIsFirstTime(false); // Default to regular login on error
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="bg-white rounded-apple shadow-apple p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-blue border-t-transparent rounded-full animate-spin"></div>
            <span className="text-apple-body text-secondary">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return <LoginForm isFirstTime={isFirstTime} />;
} 