"use client";

import { useState, useEffect } from 'react';

export default function GigBuilder({ songs }) {
  const [sets, setSets] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [activeGig, setActiveGig] = useState(null);
  const [newGigName, setNewGigName] = useState('');
  const [showNewGigForm, setShowNewGigForm] = useState(false);

  // Load sets and gigs on component mount
  useEffect(() => {
    loadSets();
    loadGigs();
  }, []);

  const loadSets = async () => {
    try {
      const response = await fetch('/api/sets');
      if (response.ok) {
        const data = await response.json();
        setSets(data);
      }
    } catch (error) {
      console.error('Error loading sets:', error);
    }
  };

  const loadGigs = async () => {
    try {
      const response = await fetch('/api/gigs');
      if (response.ok) {
        const data = await response.json();
        setGigs(data);
      }
    } catch (error) {
      console.error('Error loading gigs:', error);
    }
  };

  const createGig = async () => {
    if (!newGigName.trim()) return;

    try {
      const response = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGigName,
          sets: [],
          createdAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const newGig = await response.json();
        setGigs(prev => [...prev, newGig]);
        setActiveGig(newGig);
        setNewGigName('');
        setShowNewGigForm(false);
      }
    } catch (error) {
      console.error('Error creating gig:', error);
    }
  };

  const addSetToGig = async (set) => {
    if (!activeGig) return;

    const updatedSets = [...activeGig.sets, {
      ...set,
      gigPosition: activeGig.sets.length + 1
    }];

    const updatedGig = {
      ...activeGig,
      sets: updatedSets
    };

    try {
      const response = await fetch('/api/gigs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGig)
      });

      if (response.ok) {
        setActiveGig(updatedGig);
        setGigs(prev => 
          prev.map(gig => 
            gig.id === updatedGig.id ? updatedGig : gig
          )
        );
      }
    } catch (error) {
      console.error('Error updating gig:', error);
    }
  };

  const removeSetFromGig = async (setIndex) => {
    if (!activeGig) return;

    const updatedSets = activeGig.sets.filter((_, index) => index !== setIndex);
    
    // Re-number positions
    const reNumberedSets = updatedSets.map((set, index) => ({
      ...set,
      gigPosition: index + 1
    }));

    const updatedGig = {
      ...activeGig,
      sets: reNumberedSets
    };

    try {
      const response = await fetch('/api/gigs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGig)
      });

      if (response.ok) {
        setActiveGig(updatedGig);
        setGigs(prev => 
          prev.map(gig => 
            gig.id === updatedGig.id ? updatedGig : gig
          )
        );
      }
    } catch (error) {
      console.error('Error updating gig:', error);
    }
  };

  // Calculate total duration for a set
  const calculateSetDuration = (setSongs) => {
    const totalMinutes = setSongs.reduce((total, song) => {
      if (song.duration) {
        const [minutes, seconds] = song.duration.split(':').map(Number);
        return total + minutes + (seconds / 60);
      }
      return total;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calculate total gig duration
  const calculateGigDuration = (gigSets) => {
    const totalMinutes = gigSets.reduce((total, set) => {
      const setMinutes = set.songs.reduce((setTotal, song) => {
        if (song.duration) {
          const [minutes, seconds] = song.duration.split(':').map(Number);
          return setTotal + minutes + (seconds / 60);
        }
        return setTotal;
      }, 0);
      return total + setMinutes;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get total song count
  const getTotalSongCount = (gigSets) => {
    return gigSets.reduce((total, set) => total + set.songs.length, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-3xl font-black mb-6 text-center text-gray-900">🎪 Gig Builder</h2>
      <p className="text-center text-gray-600 mb-6">Combine your reusable sets into complete gigs</p>

      {/* Gig Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {gigs.map(gig => (
            <button
              key={gig.id}
              onClick={() => setActiveGig(gig)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeGig?.id === gig.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {gig.name} ({gig.sets.length} sets, {calculateGigDuration(gig.sets)})
            </button>
          ))}
          
          <button
            onClick={() => setShowNewGigForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            ➕ New Gig
          </button>
        </div>

        {showNewGigForm && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newGigName}
              onChange={(e) => setNewGigName(e.target.value)}
              placeholder="Gig name (e.g., 'Summer Wedding 2024', 'Festival Main Stage')"
              className="flex-1 p-2 border border-gray-300 rounded-md"
              onKeyPress={(e) => e.key === 'Enter' && createGig()}
            />
            <button
              onClick={createGig}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewGigForm(false);
                setNewGigName('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {activeGig ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Sets Library */}
          <div>
            <h3 className="text-xl font-black mb-4 text-gray-900">🎼 Available Sets</h3>
            <p className="text-sm text-gray-800 font-bold mb-4">Click to add sets to your gig</p>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {sets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No sets created yet</p>
                  <p className="text-sm text-gray-400">Create sets in the Sets tab first</p>
                </div>
              ) : (
                sets.map(set => (
                  <div
                    key={set.id}
                    className="bg-white rounded-md p-4 mb-3 border border-gray-200 hover:border-red-300 cursor-pointer transition-colors shadow-sm"
                    onClick={() => addSetToGig(set)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-lg text-gray-900">{set.name}</h4>
                      <div className="text-right">
                        <p className="text-purple-600 font-semibold">{calculateSetDuration(set.songs)}</p>
                        <p className="text-sm text-gray-800 font-bold">{set.songs.length} songs</p>
                      </div>
                    </div>
                    
                    {/* Preview first few songs */}
                    <div className="text-sm text-gray-800 font-bold">
                      {set.songs.slice(0, 3).map((song, index) => (
                        <span key={song.id}>
                          {song.title}
                          {index < Math.min(2, set.songs.length - 1) && ', '}
                        </span>
                      ))}
                      {set.songs.length > 3 && ` +${set.songs.length - 3} more`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Current Gig */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-gray-900">🎪 {activeGig.name}</h3>
              <div className="text-right">
                <p className="text-sm text-gray-600">{activeGig.sets.length} sets</p>
                <p className="font-medium text-red-600">{calculateGigDuration(activeGig.sets)}</p>
                <p className="text-sm text-gray-500">{getTotalSongCount(activeGig.sets)} total songs</p>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {activeGig.sets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No sets in this gig yet</p>
                  <p className="text-sm text-gray-400">Click sets from the library to add them</p>
                </div>
              ) : (
                activeGig.sets.map((set, index) => (
                  <div
                    key={`${set.id}-${index}`}
                    className="bg-white rounded-md p-4 mb-3 border border-gray-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg text-gray-800">
                          Set {index + 1}: {set.name}
                        </h4>
                        <p className="text-sm text-gray-600">{set.songs.length} songs</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-purple-600 font-semibold">{calculateSetDuration(set.songs)}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSetFromGig(index);
                          }}
                          className="text-red-600 hover:text-red-800 font-bold text-lg px-2"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    {/* Break indicator */}
                    {index < activeGig.sets.length - 1 && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-500 italic">
                          ☕ Break (15-20 minutes)
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Select a gig or create a new one to get started</p>
          <p className="text-sm text-gray-400">Gigs are complete events made up of multiple sets</p>
        </div>
      )}
    </div>
  );
}