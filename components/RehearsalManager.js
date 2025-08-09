'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ApplePanel from './ui/ApplePanel';
import ApplePanelHeader from './ui/ApplePanelHeader';
import AppleButton from './ui/AppleButton';
import AppleSearchInput from './ui/AppleSearchInput';
import AppleMetadataBadge from './ui/AppleMetadataBadge';

export default function RehearsalManager() {
  const router = useRouter();
  const [rehearsals, setRehearsals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRehearsals, setExpandedRehearsals] = useState(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRehearsal, setEditingRehearsal] = useState(null);

  useEffect(() => {
    loadRehearsals();
  }, []);

  const loadRehearsals = async () => {
    try {
      const response = await fetch('/api/rehearsals');
      if (response.ok) {
        const data = await response.json();
        setRehearsals(data);
      }
    } catch (error) {
      console.error('Error loading rehearsals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRehearsal = async (rehearsalId) => {
    if (!confirm('Are you sure you want to delete this rehearsal?')) return;
    
    try {
      const response = await fetch(`/api/rehearsals?id=${rehearsalId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRehearsals(prev => prev.filter(r => r.id !== rehearsalId));
      } else {
        alert('Failed to delete rehearsal');
      }
    } catch (error) {
      console.error('Error deleting rehearsal:', error);
      alert('Error deleting rehearsal');
    }
  };

  const toggleRehearsalExpansion = (rehearsalId) => {
    setExpandedRehearsals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rehearsalId)) {
        newSet.delete(rehearsalId);
      } else {
        newSet.add(rehearsalId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'planned': return 'Planned';
      case 'confirmed': return 'Confirmed';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Planned';
    }
  };

  const formatDateTime = (date, startTime, endTime) => {
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    return `${dateStr} • ${startTime} - ${endTime}`;
  };

  const filteredRehearsals = rehearsals.filter(rehearsal => {
    const matchesSearch = rehearsal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rehearsal.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rehearsal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <ApplePanel>
            <ApplePanelHeader title="Rehearsals" />
            <div className="p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </ApplePanel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <ApplePanel>
          <ApplePanelHeader title="🎹 Rehearsals" />
          <div className="p-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div className="flex-1 sm:max-w-xs">
                <AppleSearchInput
                  placeholder="Search rehearsals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="planned">Planned</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <AppleButton onClick={() => setShowAddForm(true)}>
                  + Add Rehearsal
                </AppleButton>
              </div>
            </div>

            {/* Add Rehearsal Form */}
            {showAddForm && (
              <RehearsalForm
                onSave={(rehearsal) => {
                  setRehearsals(prev => [...prev, rehearsal]);
                  setShowAddForm(false);
                }}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            {/* Edit Rehearsal Form */}
            {editingRehearsal && (
              <RehearsalForm
                rehearsal={editingRehearsal}
                onSave={(updatedRehearsal) => {
                  setRehearsals(prev => prev.map(r => 
                    r.id === updatedRehearsal.id ? updatedRehearsal : r
                  ));
                  setEditingRehearsal(null);
                }}
                onCancel={() => setEditingRehearsal(null)}
              />
            )}

            {/* Rehearsals List */}
            <div className="space-y-4">
              {filteredRehearsals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No rehearsals match your filters' 
                      : 'No rehearsals scheduled yet'}
                  </p>
                </div>
              ) : (
                filteredRehearsals.map((rehearsal) => (
                  <div key={rehearsal.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {rehearsal.name}
                            </h3>
                            <AppleMetadataBadge className={getStatusColor(rehearsal.status)}>
                              {getStatusText(rehearsal.status)}
                            </AppleMetadataBadge>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="font-medium">
                              📅 {formatDateTime(rehearsal.date, rehearsal.startTime, rehearsal.endTime)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => toggleRehearsalExpansion(rehearsal.id)}
                            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                            title={expandedRehearsals.has(rehearsal.id) ? 'Collapse' : 'Expand'}
                          >
                            {expandedRehearsals.has(rehearsal.id) ? '▼' : '▶'}
                          </button>
                          
                          <AppleButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingRehearsal(rehearsal)}
                          >
                            Edit
                          </AppleButton>
                          
                          <button
                            onClick={() => deleteRehearsal(rehearsal.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedRehearsals.has(rehearsal.id) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          {rehearsal.notes && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">Notes:</h4>
                              <p className="text-gray-700 whitespace-pre-wrap">{rehearsal.notes}</p>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Created: {new Date(rehearsal.createdAt).toLocaleString()}</div>
                            <div>Updated: {new Date(rehearsal.updatedAt).toLocaleString()}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ApplePanel>
      </div>
    </div>
  );
}

// Rehearsal Form Component
function RehearsalForm({ rehearsal, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: rehearsal?.name || '',
    date: rehearsal?.date || '',
    startTime: rehearsal?.startTime || '',
    endTime: rehearsal?.endTime || '',
    notes: rehearsal?.notes || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = rehearsal ? 'PUT' : 'POST';
      const body = rehearsal 
        ? { ...formData, id: rehearsal.id }
        : formData;

      const response = await fetch('/api/rehearsals', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const savedRehearsal = await response.json();
        onSave(savedRehearsal);
      } else {
        alert('Failed to save rehearsal');
      }
    } catch (error) {
      console.error('Error saving rehearsal:', error);
      alert('Error saving rehearsal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">
        {rehearsal ? 'Edit Rehearsal' : 'Add New Rehearsal'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rehearsal Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Band Practice, Song Rehearsal, etc."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="What to practice, special instructions, etc."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : rehearsal ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}