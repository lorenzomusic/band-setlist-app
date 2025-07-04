"use client";

import { useState, useEffect } from 'react';

export default function SetBuilder({ songs }) {
  const [sets, setSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [newSetName, setNewSetName] = useState('');
  const [showNewSetForm, setShowNewSetForm] = useState(false);

  // Load sets on component mount
  useEffect(() => {
    loadSets();
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

  const createSet = async () => {
    if (!newSetName.trim()) return;

    try {
      const response = await fetch('/api/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSetName,
          songs: [],
          createdAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const newSet = await response.json();
        setSets(prev => [...prev, newSet]);
        setActiveSet(newSet);
        setNewSetName('');
        setShowNewSetForm(false);
      }
    } catch (error) {
      console.error('Error creating set:', error);
    }
  };

  const addSongToSet = async (song) => {
    if (!activeSet) return;

    const updatedSongs = [...activeSet.songs, {
      ...song,
      setPosition: activeSet.songs.length + 1
    }];

    const updatedSet = {
      ...activeSet,
      songs: updatedSongs
    };

    try {
      const response = await fetch('/api/sets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSet)
      });

      if (response.ok) {
        setActiveSet(updatedSet);
        setSets(prev => 
          prev.map(set => 
            set.id === updatedSet.id ? updatedSet : set
          )
        );
      }
    } catch (error) {
      console.error('Error updating set:', error);
    }
  };

  const removeSongFromSet = async (songIndex) => {
    if (!activeSet) return;

    const updatedSongs = activeSet.songs.filter((_, index) => index !== songIndex);
    
    // Re-number positions
    const reNumberedSongs = updatedSongs.map((song, index) => ({
      ...song,
      setPosition: index + 1
    }));

    const updatedSet = {
      ...activeSet,
      songs: reNumberedSongs
    };

    try {
      const response = await fetch('/api/sets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSet)
      });

      if (response.ok) {
        setActiveSet(updatedSet);
        setSets(prev => 
          prev.map(set => 
            set.id === updatedSet.id ? updatedSet : set
          )
        );
      }
    } catch (error) {
      console.error('Error updating set:', error);
    }
  };

  // Calculate total duration
  const calculateTotalDuration = (setSongs) => {
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

  // Check for instrument changes
  const getInstrumentWarnings = (setSongs) => {
    const warnings = [];
    for (let i = 1; i < setSongs.length; i++) {
      const prevSong = setSongs[i - 1];
      const currentSong = setSongs[i];
      
      if (prevSong.bassGuitar !== currentSong.bassGuitar) {
        warnings.push(`Bass change after "${prevSong.title}": ${prevSong.bassGuitar} → ${currentSong.bassGuitar}`);
      }
      
      if (prevSong.guitar !== currentSong.guitar) {
        warnings.push(`Guitar change after "${prevSong.title}": ${prevSong.guitar} → ${currentSong.guitar}`);
      }
    }
    return warnings;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-3xl font-black mb-6 text-center text-gray-900">🎼 Set Builder</h2>
      <p className="text-center text-gray-600 mb-6">Create reusable sets that you can use in multiple gigs</p>

      {/* Set Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {sets.map(set => (
            <button
              key={set.id}
              onClick={() => setActiveSet(set)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSet?.id === set.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {set.name} ({set.songs.length} songs, {calculateTotalDuration(set.songs)})
            </button>
          ))}
          
          <button
            onClick={() => setShowNewSetForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            ➕ New Set
          </button>
        </div>

        {showNewSetForm && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="Set name (e.g., 'High Energy Openers', 'Wedding Dance Hits')"
              className="flex-1 p-2 border border-gray-300 rounded-md"
              onKeyPress={(e) => e.key === 'Enter' && createSet()}
            />
            <button
              onClick={createSet}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewSetForm(false);
                setNewSetName('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {activeSet ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Song Library */}
          <div>
            <h3 className="text-xl font-black mb-4 text-gray-900">📚 Song Library</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {songs.map(song => (
                <div
                  key={song.id}
                  className="bg-white rounded-md p-3 mb-2 border border-gray-200 hover:border-purple-300 cursor-pointer transition-colors"
                  onClick={() => addSongToSet(song)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-black text-gray-900">{song.title}</p>
                      {song.medley && (
                        <p className="text-sm text-purple-700 font-bold">{song.medley} - Part {song.medleyPosition}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-900 font-bold">
                      <p>{song.key} | {song.duration}</p>
                      <p>{song.bassGuitar}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Set */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-gray-900">🎵 {activeSet.name}</h3>
              <div className="text-right">
                <p className="text-sm text-gray-800 font-bold">{activeSet.songs.length} songs</p>
                <p className="font-medium text-purple-600">{calculateTotalDuration(activeSet.songs)}</p>
              </div>
            </div>

            {/* Instrument Warnings */}
            {activeSet.songs.length > 1 && (
              <div className="mb-4">
                {getInstrumentWarnings(activeSet.songs).map((warning, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mb-2">
                    <p className="text-sm text-yellow-800">⚠️ {warning}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-purple-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {activeSet.songs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Click songs from the library to add them to this set
                </p>
              ) : (
                activeSet.songs.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className="bg-white rounded-md p-3 mb-2 border border-gray-200"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-black text-gray-900">
                          {index + 1}. {song.title}
                        </p>
                        {song.medley && (
                          <p className="text-sm text-purple-700 font-bold">{song.medley} - Part {song.medleyPosition}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm text-gray-900 font-bold">
                          <p>{song.key} | {song.duration}</p>
                          <p>{song.bassGuitar}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSongFromSet(index);
                          }}
                          className="text-red-600 hover:text-red-800 font-bold text-lg px-2"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Select a set or create a new one to get started</p>
          <p className="text-sm text-gray-400">Sets are reusable collections of songs you can use in multiple gigs</p>
        </div>
      )}
    </div>
  );
}