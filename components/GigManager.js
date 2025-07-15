'use client';

import { useState, useEffect } from 'react';
import ApplePanel from './ui/ApplePanel';
import ApplePanelHeader from './ui/ApplePanelHeader';
import AppleButton from './ui/AppleButton';
import AppleSearchInput from './ui/AppleSearchInput';
import AppleMetadataBadge from './ui/AppleMetadataBadge';

export default function GigManager() {
  const [gigs, setGigs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGigs();
  }, []);

  const loadGigs = async () => {
    try {
      const response = await fetch('/api/gigs');
      if (response.ok) {
        const data = await response.json();
        setGigs(data);
      }
    } catch (error) {
      console.error('Error loading gigs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGigs = gigs.filter(gig =>
    gig.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gig.venue?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateGigDuration = (sets) => {
    if (!sets || sets.length === 0) return '0:00';
    
    const totalMinutes = sets.reduce((total, set) => {
      const setMinutes = set.songs?.reduce((setTotal, song) => {
        if (song.duration) {
          const [minutes, seconds] = song.duration.split(':').map(Number);
          return setTotal + minutes + (seconds / 60);
        }
        return setTotal;
      }, 0) || 0;
      return total + setMinutes;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="apple-container">
      <ApplePanel>
        <ApplePanelHeader
          title="Gig Manager"
          subtitle="View and manage your upcoming gigs"
        />
        
        <div className="space-y-6 px-8 pb-8">
          {/* Search and Actions */}
          <div className="flex justify-between items-center">
            <div className="w-64">
              <AppleSearchInput
                placeholder="Search gigs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <AppleButton>
              Create New Gig
            </AppleButton>
          </div>
          
          {/* Gigs List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="apple-loading">Loading gigs...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGigs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No gigs found</p>
                </div>
              ) : (
                filteredGigs.map((gig) => (
                  <div key={gig.id} className="apple-card">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="apple-subheading">{gig.name}</h3>
                            <p className="apple-text">{gig.venue || 'No venue'}</p>
                            <p className="apple-text-sm text-gray-500">
                              {formatDate(gig.date)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <AppleMetadataBadge type="sets">
                              {gig.sets?.length || 0} sets
                            </AppleMetadataBadge>
                            <AppleMetadataBadge type="duration">
                              {calculateGigDuration(gig.sets)}
                            </AppleMetadataBadge>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <AppleButton variant="secondary" size="sm">
                            View
                          </AppleButton>
                          <AppleButton variant="secondary" size="sm">
                            Edit
                          </AppleButton>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </ApplePanel>
    </div>
  );
} 