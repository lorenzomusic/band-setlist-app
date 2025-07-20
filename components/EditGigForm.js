"use client";

import { useState, useEffect } from 'react';
import AppleButton from './ui/AppleButton';
import AppleSearchInput from './ui/AppleSearchInput';

export default function EditGigForm({ gig, onGigUpdated, onCancel }) {
  const [formData, setFormData] = useState({
    name: gig.name || '',
    venue: gig.venue || '',
    date: gig.date || '',
    time: gig.time || '',
    address: gig.address || '',
    notes: gig.notes || '',
  });
  const [saving, setSaving] = useState(false);

  // Update form data when gig changes
  useEffect(() => {
    setFormData({
      name: gig.name || '',
      venue: gig.venue || '',
      date: gig.date || '',
      time: gig.time || '',
      address: gig.address || '',
      notes: gig.notes || '',
    });
  }, [gig]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
          sets: gig.sets || [] // Preserve existing sets
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
            <AppleSearchInput
              placeholder="Venue name"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="apple-label">Date</label>
            <input
              type="date"
              name="date"
              className="apple-input"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label className="apple-label">Time</label>
            <input
              type="time"
              name="time"
              className="apple-input"
              value={formData.time}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div>
          <label className="apple-label">Address</label>
          <AppleSearchInput
            placeholder="Full venue address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
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
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </AppleButton>
        </div>
      </form>
    </div>
  );
} 