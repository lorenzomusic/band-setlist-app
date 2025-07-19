'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    invitationCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invitationInfo, setInvitationInfo] = useState(null);

  // Check for invitation code in URL
  useEffect(() => {
    const inviteCode = searchParams.get('invite');
    if (inviteCode) {
      setFormData(prev => ({ ...prev, invitationCode: inviteCode }));
      validateInvitation(inviteCode);
    }
  }, [searchParams]);

  const validateInvitation = async (code) => {
    try {
      const response = await fetch(`/api/auth/validate-invitation?code=${code}`);
      if (response.ok) {
        const data = await response.json();
        setInvitationInfo(data);
      } else {
        setError('Invalid or expired invitation code');
      }
    } catch (error) {
      console.error('Error validating invitation:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (!formData.invitationCode) {
      setError('Invitation code is required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          invitationCode: formData.invitationCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(data.error || 'Registration failed');
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
            <h1 className="text-apple-title-1 text-primary mb-2">Join the Band</h1>
            <p className="text-apple-body text-secondary">
              {invitationInfo 
                ? `You're invited to join as a ${invitationInfo.role}!`
                : 'Enter your invitation code to create an account'
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

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            {invitationInfo && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                <strong>Invitation Details:</strong><br />
                Email: {invitationInfo.email}<br />
                Role: {invitationInfo.role}<br />
                Expires: {new Date(invitationInfo.expiresAt).toLocaleDateString()}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="invitationCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Invitation Code
                </label>
                <input
                  type="text"
                  id="invitationCode"
                  name="invitationCode"
                  value={formData.invitationCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-apple-small text-apple-body text-primary placeholder-gray-500 outline-none focus:bg-gray-200 transition-colors"
                  placeholder="Enter your invitation code"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-apple-small text-apple-body text-primary placeholder-gray-500 outline-none focus:bg-gray-200 transition-colors"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-apple-small text-apple-body text-primary placeholder-gray-500 outline-none focus:bg-gray-200 transition-colors"
                  placeholder="Enter your email"
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
                  minLength={6}
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-apple-small text-apple-body text-primary placeholder-gray-500 outline-none focus:bg-gray-200 transition-colors"
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-apple-small text-apple-body text-primary placeholder-gray-500 outline-none focus:bg-gray-200 transition-colors"
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-apple-button font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-apple-fast shadow-sm"
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registration form...</p>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
} 