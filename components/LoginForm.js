"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ isFirstTime = false }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation for first time setup
    if (isFirstTime) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect to the page they were trying to access
        const returnTo = new URLSearchParams(window.location.search).get('returnTo') || '/';
        router.push(returnTo);
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
      <div className="bg-white rounded-apple shadow-apple p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🎵</div>
          <h1 className="text-apple-title-1 text-primary mb-2">
            {isFirstTime ? 'Welcome to Greatest Gig' : 'Greatest Gig'}
          </h1>
          <p className="text-apple-body text-secondary">
            {isFirstTime 
              ? 'Create your admin password to secure your band management app'
              : 'Enter your password to access your band management app'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-apple-body text-primary font-medium mb-2">
              {isFirstTime ? 'Create Admin Password' : 'Password'}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-apple-small text-apple-body text-primary placeholder-gray-500 outline-none focus:bg-gray-200 transition-colors"
              placeholder={isFirstTime ? 'Choose a secure password' : 'Enter your password'}
              required
              minLength={isFirstTime ? 6 : 1}
              autoComplete={isFirstTime ? 'new-password' : 'current-password'}
            />
            {isFirstTime && (
              <p className="text-apple-callout text-secondary mt-1">
                Choose a strong password you'll remember. You'll need this to access the admin panel.
              </p>
            )}
          </div>

          {isFirstTime && (
            <div>
              <label htmlFor="confirmPassword" className="block text-apple-body text-primary font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border-none rounded-apple-small text-apple-body text-primary placeholder-gray-500 outline-none focus:bg-gray-200 transition-colors"
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-apple-small p-3">
              <p className="text-apple-callout text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue text-white px-6 py-3 rounded-apple-button font-medium hover:bg-blue-600 transition-apple-fast disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isFirstTime ? 'Setting up...' : 'Signing in...'}
              </div>
            ) : (
              isFirstTime ? 'Set Up Admin Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-apple-callout text-secondary text-center">
            🔐 Your data is stored securely and never shared
          </p>
          {isFirstTime && (
            <p className="text-apple-footnote text-secondary text-center mt-2">
              This is a one-time setup. Save your password in a secure location.
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 