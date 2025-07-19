"use client";

import { useState, useEffect } from 'react';

export default function UserManagementTab() {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    role: 'member',
    expiresIn: '7' // days
  });

  useEffect(() => {
    loadUsers();
    loadInvitations();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await fetch('/api/admin/invitations');
      if (response.ok) {
        const invitationsData = await response.json();
        setInvitations(invitationsData);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInvitation = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvitation)
      });

      if (response.ok) {
        const invitation = await response.json();
        setInvitations(prev => [...prev, invitation]);
        setNewInvitation({ email: '', role: 'member', expiresIn: '7' });
        alert('Invitation created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create invitation: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
      alert('Failed to create invitation');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUsers(prev => prev.filter(user => user.id !== userId));
        alert('User deleted successfully');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const resetUserPassword = async (userId, username) => {
    if (!confirm(`Are you sure you want to reset the password for ${username}?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Password reset successful!\n\nNew temporary password: ${data.temporaryPassword}\n\nPlease share this with the user and ask them to change it on their next login.`);
      } else {
        const error = await response.json();
        alert(`Failed to reset password: ${error.message}`);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Failed to reset password');
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, isActive: !isActive } : user
        ));
      } else {
        alert('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user status');
    }
  };

  const copyInvitationLink = (code) => {
    const link = `${window.location.origin}/register?invite=${code}`;
    navigator.clipboard.writeText(link);
    alert('Invitation link copied to clipboard!');
  };

  const deleteInvitation = async (invitationId) => {
    try {
      const response = await fetch(`/api/admin/invitations/${invitationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        alert('Invitation deleted successfully');
      } else {
        alert('Failed to delete invitation');
      }
    } catch (error) {
      console.error('Error deleting invitation:', error);
      alert('Failed to delete invitation');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-apple-title-3 text-primary">User Management</h3>
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-apple-title-3 text-primary">User Management</h3>
      
      {/* Create Invitation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-800 mb-4">📧 Create Invitation</h4>
        <form onSubmit={createInvitation} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={newInvitation.email}
                onChange={(e) => setNewInvitation(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                placeholder="bandmember@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={newInvitation.role}
                onChange={(e) => setNewInvitation(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              >
                <option value="member">Band Member</option>
                <option value="admin">Admin</option>
                <option value="guest">Guest</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires In
              </label>
              <select
                value={newInvitation.expiresIn}
                onChange={(e) => setNewInvitation(prev => ({ ...prev, expiresIn: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-apple-button hover:bg-blue-700 transition-colors shadow-sm"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          >
            Create Invitation
          </button>
        </form>
      </div>

      {/* Active Users */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-800 mb-4">👥 Active Users ({users.length})</h4>
        {users.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{user.username}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.isAdmin 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.isAdmin ? 'Admin' : 'Member'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => toggleUserStatus(user.id, user.isActive)}
                    className={`px-3 py-1 text-xs rounded ${
                      user.isActive 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  {!user.isAdmin && (
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  )}
                  {!user.isAdmin && (
                    <button
                      onClick={() => resetUserPassword(user.id, user.username)}
                      className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                    >
                      Reset Password
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-800 mb-4">📨 Pending Invitations ({invitations.length})</h4>
        {invitations.length === 0 ? (
          <p className="text-gray-500">No pending invitations.</p>
        ) : (
          <div className="space-y-3">
            {invitations.map(invitation => (
              <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{invitation.email}</div>
                  <div className="text-sm text-gray-600">
                    Role: {invitation.role} • Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyInvitationLink(invitation.code)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => deleteInvitation(invitation.id)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-800 mb-2">ℹ️ How It Works</h5>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Create invitations for band members you want to add</li>
          <li>• Share the invitation link with them via email or message</li>
          <li>• Users can only register with a valid invitation code</li>
          <li>• Invitations expire automatically for security</li>
          <li>• Admins can manage user permissions and status</li>
        </ul>
      </div>
    </div>
  );
} 