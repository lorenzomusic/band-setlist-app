'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ApplePanel from './ui/ApplePanel';
import ApplePanelHeader from './ui/ApplePanelHeader';
import AppleButton from './ui/AppleButton';
import AppleSearchInput from './ui/AppleSearchInput';

export default function GigBuilder() {
  const router = useRouter();
  const [gigData, setGigData] = useState({
    name: '',
    venue: '',
    date: '',
    time: '',
    address: '',
    notes: '',
    sets: []
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field, value) => {
    setGigData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/gigs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gigData),
      });

      if (response.ok) {
        router.push('/gigs');
      } else {
        alert('Failed to create gig');
      }
    } catch (error) {
      console.error('Error creating gig:', error);
      alert('Error creating gig');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="apple-container">
      <ApplePanel>
        <ApplePanelHeader
          title="Create New Gig"
          subtitle="Set up your next performance"
        />
        
        <form onSubmit={handleSubmit} className="space-y-6 px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="apple-label">Gig Name</label>
              <AppleSearchInput
                placeholder="Enter gig name"
                value={gigData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="apple-label">Venue</label>
              <AppleSearchInput
                placeholder="Venue name"
                value={gigData.venue}
                onChange={(e) => handleInputChange('venue', e.target.value)}
              />
            </div>
            
            <div>
              <label className="apple-label">Date</label>
              <input
                type="date"
                className="apple-input"
                value={gigData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="apple-label">Time</label>
              <input
                type="time"
                className="apple-input"
                value={gigData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="apple-label">Address</label>
            <AppleSearchInput
              placeholder="Full venue address"
              value={gigData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </div>
          
          <div>
            <label className="apple-label">Notes</label>
            <textarea
              className="apple-textarea"
              placeholder="Additional notes about the gig..."
              value={gigData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <AppleButton 
              variant="secondary"
              onClick={() => router.push('/gigs')}
            >
              Cancel
            </AppleButton>
            <AppleButton 
              type="submit"
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Gig'}
            </AppleButton>
          </div>
        </form>
      </ApplePanel>
    </div>
  );
}