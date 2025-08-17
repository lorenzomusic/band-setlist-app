"use client";

import { useState, useEffect } from 'react';
import AppleButton from './ui/AppleButton';
import AppleSearchInput from './ui/AppleSearchInput';
import AutoDateInput from './ui/AutoDateInput';
import AutoTimeInput from './ui/AutoTimeInput';

export default function EditGigForm({ gig, onGigUpdated, onCancel }) {
  const [formData, setFormData] = useState({
    name: gig.name || '',
    venue: gig.venue || '',
    date: gig.date || '',
    time: gig.time || '',
    address: gig.address || '',
    notes: gig.notes || '',
    status: gig.status || 'pending',
    lineup: gig.lineup || [],
  });
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await fetch('/api/band-members');
      if (response.ok) {
        const membersData = await response.json();
        setMembers(membersData);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Update form data when gig changes
  useEffect(() => {
    setFormData({
      name: gig.name || '',
      venue: gig.venue || '',
      date: gig.date || '',
      time: gig.time || '',
      address: gig.address || '',
      notes: gig.notes || '',
      status: gig.status || 'pending',
      lineup: gig.lineup || [],
      });
  }, [gig]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLineupChange = (instrument, memberId) => {
    setFormData(prev => {
      const newLineup = [...prev.lineup];
      const existingIndex = newLineup.findIndex(item => item.instrument === instrument);
      
      // Find the selected member to get their isCore status
      const selectedMember = members.find(member => member.id === memberId);
      const isReplacement = selectedMember ? !selectedMember.isCore : false;
      
      if (existingIndex !== -1) {
        if (memberId) {
          newLineup[existingIndex] = { instrument, memberId, isReplacement };
        } else {
          // Remove the lineup item if no member is selected
          newLineup.splice(existingIndex, 1);
        }
      } else if (memberId) {
        newLineup.push({ instrument, memberId, isReplacement });
      }
      
      return { ...prev, lineup: newLineup };
    });
  };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/gigs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: gig.id,
          sets: gig.sets || [], // Preserve existing sets
          comments: gig.comments || [] // Preserve existing comments
        }),
      });

      if (response.ok) {
        const updatedGig = await response.json();
        onGigUpdated(updatedGig);
      } else {
        alert('Failed to update gig');
      }
    } catch (error) {
      console.error('Error updating gig:', error);
      alert('Error updating gig');
    } finally {
      setSaving(false);
    }
  };

  const instruments = [
    'Vocals',
    'Guitar',
    'Bass Guitar',
    'Drums',
    'Keys'
  ];

  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-4">
      <h4 className="font-medium text-blue-800 mb-4">Edit Gig Details</h4>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="apple-label">Gig Name</label>
            <AppleSearchInput
              placeholder="Enter gig name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label className="apple-label">Venue</label>
            <input
              type="text"
              name="venue"
              className="apple-input"
              placeholder="Venue name"
              value={formData.venue}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="apple-label">Date</label>
            <div className="apple-input">
              <AutoDateInput
                value={formData.date}
                onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
                className="w-full"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="apple-label">Time</label>
            <div className="apple-input">
              <AutoTimeInput
                value={formData.time}
                onChange={(value) => setFormData(prev => ({ ...prev, time: value }))}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="apple-label">Status</label>
            <select
              name="status"
              className="apple-input"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="pending">⏳ Pending</option>
              <option value="confirmed">✅ Confirmed</option>
              <option value="completed">🎉 Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>

        </div>
        
        <div>
          <label className="apple-label">Address</label>
          <input
            type="text"
            name="address"
            className="apple-input"
            placeholder="Full venue address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        {/* Lineup Section */}
        <div>
          <label className="apple-label">Band Lineup</label>
          <div className="space-y-3">
            {instruments.map((instrument) => {
              const lineupItem = formData.lineup.find(item => item.instrument === instrument);
              return (
                <div key={instrument} className="flex items-center space-x-4 p-3 bg-white rounded-lg border">
                  <div className="w-24 text-sm font-medium text-gray-700">{instrument}</div>
                  
                  <select
                    className="flex-1 apple-input"
                    value={lineupItem?.memberId || ''}
                    onChange={(e) => handleLineupChange(instrument, e.target.value)}
                  >
                    <option value="">Select member...</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.instrument}) {!member.isCore ? '(Replacement)' : ''}
                      </option>
                    ))}
                  </select>
                  
                  {lineupItem?.memberId && (
                    <div className="text-xs text-gray-600">
                      {lineupItem?.isReplacement ? (
                        <span className="text-orange-600 font-medium">🔄 Replacement Member</span>
                      ) : (
                        <span className="text-green-600 font-medium">⭐ Core Member</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div>
          <label className="apple-label">Notes</label>
          <textarea
            name="notes"
            className="apple-textarea"
            placeholder="Additional notes about the gig..."
            value={formData.notes}
            onChange={handleChange}
            rows={3}
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <AppleButton 
            variant="secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </AppleButton>
          <AppleButton 
            type="submit"
            disabled={saving || loadingMembers}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </AppleButton>
        </div>
      </form>
    </div>
  );
} 