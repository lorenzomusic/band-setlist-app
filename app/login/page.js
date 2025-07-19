"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    // Check if this is first time setup
    const checkFirstTime = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        setIsFirstTime(!data.authenticated && !data.hasUsers);
      } catch (error) {
        console.error('Error checking first time setup:', error);
      }
    };
    
    checkFirstTime();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to return URL or home
        router.push(returnUrl);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-apple shadow-apple overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <h1 className="text-apple-title-1 text-primary mb-2">
              {isFirstTime ? 'Setup Admin Account' : 'Sign In'}
            </h1>
            <p className="text-apple-body text-secondary">
              {isFirstTime 
                ? 'Create your admin account to get started'
                : 'Access your Greatest Gig account'
              }
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  {isFirstTime ? 'Admin Username' : 'Username'}
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-apple-small text-apple-body text-primary placeholder-gray-500 outline-none focus:bg-gray-200 transition-colors"
                  placeholder={isFirstTime ? "admin" : "Enter your username"}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-apple-small text-apple-body text-primary placeholder-gray-500 outline-none focus:bg-gray-200 transition-colors"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-apple-button font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-apple-fast shadow-sm"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                {isLoading ? 'Signing In...' : (isFirstTime ? 'Create Admin Account' : 'Sign In')}
              </button>
            </form>

            {!isFirstTime && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                    Create one
                  </Link>
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Forgot your password?{' '}
                  <button 
                    onClick={() => alert('Contact your band admin to reset your password. They can reset it from the Admin panel.')}
                    className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    Contact Admin
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="apple-loading">Loading...</div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
} 