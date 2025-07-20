"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BandMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    instrument: '',
    email: '',
    userId: '',
    isCore: true
  });
  const router = useRouter();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/band-members');
      if (response.ok) {
        const membersData = await response.json();
        setMembers(membersData);
      } else {
        console.error('Failed to load band members');
      }
    } catch (error) {
      console.error('Error loading band members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingMember ? '/api/band-members' : '/api/band-members';
      const method = editingMember ? 'PUT' : 'POST';
      const body = editingMember ? { ...formData, id: editingMember.id } : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowAddForm(false);
        setEditingMember(null);
        setFormData({ name: '', instrument: '', email: '', userId: '', isCore: true });
        loadMembers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving band member:', error);
      alert('Failed to save band member');
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      instrument: member.instrument,
      email: member.email || '',
      userId: member.userId || '',
      isCore: member.isCore
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this band member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/band-members?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadMembers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting band member:', error);
      alert('Failed to delete band member');
    }
  };

  const initializeCoreMembers = async () => {
    const coreMembers = [
      { name: 'Kim', instrument: 'Drummer', email: '', userId: '', isCore: true },
      { name: 'Flemming', instrument: 'Bass player', email: '', userId: '', isCore: true },
      { name: 'Rikke', instrument: 'Lead vocal', email: '', userId: '', isCore: true },
      { name: 'Kenneth', instrument: 'Keys', email: '', userId: '', isCore: true },
      { name: 'Lorentz', instrument: 'Lead vocal and guitar', email: '', userId: '', isCore: true }
    ];

    try {
      for (const member of coreMembers) {
        await fetch('/api/band-members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(member),
        });
      }
      loadMembers();
      alert('Core members initialized successfully!');
    } catch (error) {
      console.error('Error initializing core members:', error);
      alert('Failed to initialize core members');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading band members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-apple shadow-apple overflow-hidden">
          <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-apple-title-1 text-primary mb-2">👥 Band Members</h1>
                <p className="text-apple-body text-secondary">Manage your band's core and replacement members</p>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ← Back to Admin
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-apple shadow-apple p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-primary">{members.length}</div>
                <div className="text-sm text-secondary">Total Members</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-apple shadow-apple p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-green-600">
                  {members.filter(m => m.isCore).length}
                </div>
                <div className="text-sm text-secondary">Core Members</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-apple shadow-apple p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-orange-600">
                  {members.filter(m => !m.isCore).length}
                </div>
                <div className="text-sm text-secondary">Replacements</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-apple shadow-apple p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-apple-title-2 text-primary">Band Members</h2>
            <div className="flex gap-3">
              {members.length === 0 && (
                <button
                  onClick={initializeCoreMembers}
                  className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Initialize Core Members
                </button>
              )}
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingMember(null);
                  setFormData({ name: '', instrument: '', email: '', userId: '', isCore: true });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                + Add Member
              </button>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-apple-title-3 text-primary mb-4">
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instrument *
                    </label>
                    <input
                      type="text"
                      value={formData.instrument}
                      onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User ID (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                      placeholder="Link to existing user"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isCore"
                    checked={formData.isCore}
                    onChange={(e) => setFormData({ ...formData, isCore: e.target.checked })}
                    className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
                  />
                  <label htmlFor="isCore" className="ml-2 text-sm text-gray-700">
                    Core Member (uncheck for replacement)
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {editingMember ? 'Update Member' : 'Add Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingMember(null);
                      setFormData({ name: '', instrument: '', email: '', userId: '', isCore: true });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-4">
            {members.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl opacity-30 mb-2">👥</div>
                <p className="text-apple-body text-secondary">No band members yet</p>
                <p className="text-sm text-gray-500 mt-2">Click "Initialize Core Members" to add the 5 core members</p>
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className={`p-4 rounded-lg border ${
                    member.isCore 
                      ? 'bg-white border-green-200 shadow-sm' 
                      : 'bg-orange-50 border-orange-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        member.isCore ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        <span className="text-lg">
                          {member.isCore ? '⭐' : '🔄'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{member.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            member.isCore 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {member.isCore ? 'Core' : 'Replacement'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{member.instrument}</p>
                        {member.email && (
                          <p className="text-xs text-gray-500">{member.email}</p>
                        )}
                        {member.userId && (
                          <p className="text-xs text-blue-600">Linked to user: {member.userId}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 