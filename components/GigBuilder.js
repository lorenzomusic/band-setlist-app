'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ApplePanel from './ui/ApplePanel';
import ApplePanelHeader from './ui/ApplePanelHeader';
import AppleButton from './ui/AppleButton';
import AppleSearchInput from './ui/AppleSearchInput';
import AutoDateInput from './ui/AutoDateInput';
import AutoTimeInput from './ui/AutoTimeInput';

// Availability Modal Component
function AvailabilityModal({ isOpen, onClose, date, availability, members }) {
  if (!isOpen) return null;

  const getAvailabilityForMember = (memberId) => {
    return availability.find(entry => entry.memberId === memberId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-600';
      case 'unavailable': return 'text-red-600';
      case 'maybe': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return '✅';
      case 'unavailable': return '❌';
      case 'maybe': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-apple shadow-apple p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Availability for {new Date(date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {members.map(member => {
            const memberAvailability = getAvailabilityForMember(member.id);
            const status = memberAvailability?.status || 'unknown';
            
            return (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{member.name}</div>
                  <div className="text-sm text-gray-600">{member.instrument}</div>
                </div>
                <div className={`flex items-center space-x-2 ${getStatusColor(status)}`}>
                  <span className="text-lg">{getStatusIcon(status)}</span>
                  <span className="font-medium">
                    {status === 'available' ? 'Available' :
                     status === 'unavailable' ? 'Unavailable' :
                     status === 'maybe' ? 'Maybe' : 'Unknown'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-green-600 font-bold">
                {availability.filter(a => a.status === 'available').length}
              </div>
              <div className="text-gray-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-600 font-bold">
                {availability.filter(a => a.status === 'maybe').length}
              </div>
              <div className="text-gray-600">Maybe</div>
            </div>
            <div className="text-center">
              <div className="text-red-600 font-bold">
                {availability.filter(a => a.status === 'unavailable').length}
              </div>
              <div className="text-gray-600">Unavailable</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <AppleButton onClick={onClose} variant="secondary">
            Close
          </AppleButton>
        </div>
      </div>
    </div>
  );
}

export default function GigBuilder() {
  const router = useRouter();
  const [gigData, setGigData] = useState({
    name: '',
    venue: '',
    date: '',
    time: '',
    address: '',
    notes: '',
    sets: [],
    status: 'pending',
    lineup: [],
    contractUploaded: false
  });
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [availabilityModal, setAvailabilityModal] = useState({
    isOpen: false,
    date: null,
    availability: [],
    members: []
  });

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

  const handleInputChange = (field, value) => {
    setGigData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLineupChange = (instrument, memberId) => {
    setGigData(prev => {
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

  const checkAvailability = async () => {
    if (!gigData.date) {
      alert('Please select a date first');
      return;
    }

    try {
      // Convert YYYY-MM-DD to DD-MM-YYYY for API
      const [year, month, day] = gigData.date.split('-');
      const dateStr = `${day}-${month}-${year}`;
      
      const response = await fetch(`/api/availability?startDate=${dateStr}&endDate=${dateStr}`);
      if (response.ok) {
        const availabilityData = await response.json();
        setAvailabilityModal({
          isOpen: true,
          date: gigData.date,
          availability: availabilityData,
          members: members
        });
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      alert('Error checking availability');
    }
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

  const instruments = [
    'Vocals',
    'Guitar',
    'Bass Guitar',
    'Drums',
    'Keys'
  ];

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
              <div className="flex space-x-2">
                <div className="apple-input flex-1">
                  <AutoDateInput
                    value={gigData.date}
                    onChange={(value) => handleInputChange('date', value)}
                    className="w-full"
                    required
                  />
                </div>
                <AppleButton
                  type="button"
                  variant="secondary"
                  onClick={checkAvailability}
                  disabled={!gigData.date}
                  className="whitespace-nowrap"
                >
                  📊 Check Availability
                </AppleButton>
              </div>
            </div>
            
            <div>
              <label className="apple-label">Time</label>
              <div className="apple-input">
                <AutoTimeInput
                  value={gigData.time}
                  onChange={(value) => handleInputChange('time', value)}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="apple-label">Status</label>
              <select
                className="apple-input"
                value={gigData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="pending">⏳ Pending</option>
                <option value="confirmed">✅ Confirmed</option>
                <option value="completed">🎉 Completed</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
            </div>

            <div>
              <label className="apple-label">Contract Uploaded</label>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="contractUploaded"
                  checked={gigData.contractUploaded}
                  onChange={(e) => handleInputChange('contractUploaded', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="contractUploaded" className="text-sm text-gray-700">
                  Contract has been uploaded
                </label>
              </div>
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

          {/* Lineup Section */}
          <div>
            <label className="apple-label">Band Lineup</label>
            <div className="space-y-3">
              {instruments.map((instrument) => {
                const lineupItem = gigData.lineup.find(item => item.instrument === instrument);
                return (
                  <div key={instrument} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
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
              disabled={saving || loadingMembers}
            >
              {saving ? 'Creating...' : 'Create Gig'}
            </AppleButton>
          </div>
        </form>
      </ApplePanel>

      {/* Availability Modal */}
      <AvailabilityModal
        isOpen={availabilityModal.isOpen}
        onClose={() => setAvailabilityModal({ ...availabilityModal, isOpen: false })}
        date={availabilityModal.date}
        availability={availabilityModal.availability}
        members={availabilityModal.members}
      />
    </div>
  );
}