"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isAuthenticated) {
      loadUserInfo();
    }
  }, [isAuthenticated]);

  const loadUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.user);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setMessage({ type: '', text: '' });

    // Validation
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      setIsChangingPassword(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setIsChangingPassword(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully! You will be logged out and redirected to login.' });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Logout and redirect after a short delay
        setTimeout(async () => {
          await logout();
          router.push('/login');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInputChange = (e) => {
    setPasswordForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-apple-title-1 text-primary">Profile</h1>
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-apple-title-1 text-primary">Profile</h1>
      
      {/* User Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-apple-title-2 text-primary mb-4">Account Information</h2>
        {userInfo && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg font-medium">
                  {userInfo.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-800">{userInfo.username}</div>
                <div className="text-sm text-gray-600">{userInfo.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Role:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  userInfo.isAdmin 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {userInfo.isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  userInfo.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {userInfo.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Member since:</span>
                <span className="ml-2 text-sm text-gray-600">
                  {new Date(userInfo.createdAt).toLocaleDateString()}
                </span>
              </div>
              {userInfo.lastLogin && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Last login:</span>
                  <span className="ml-2 text-sm text-gray-600">
                    {new Date(userInfo.lastLogin).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-apple-title-2 text-primary mb-4">Change Password</h2>
        
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="Enter your current password"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="Enter your new password"
            />
            <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="Confirm your new password"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="px-4 py-2 bg-blue-600 text-white rounded-apple-button hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          >
            {isChangingPassword ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Security Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">🔐 Security Information</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your password is securely hashed and never stored in plain text</li>
          <li>• Changing your password will log you out of all other sessions</li>
          <li>• If you forget your password, contact your band admin for a reset</li>
          <li>• Sessions automatically expire after 24 hours for security</li>
        </ul>
      </div>
    </div>
  );
} 