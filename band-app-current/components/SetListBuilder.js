"use client";

import { useState, useEffect } from 'react';
import { safeDuration } from '../utils/duration';

export default function SetlistBuilder({ songs }) {
  const [setlists, setSetlists] = useState([]);
  const [activeSetlist, setActiveSetlist] = useState(null);
  const [newSetlistName, setNewSetlistName] = useState('');
  const [showNewSetlistForm, setShowNewSetlistForm] = useState(false);

  // Load setlists on component mount
  useEffect(() => {
    loadSetlists();
  }, []);

  const loadSetlists = async () => {
    try {
      const response = await fetch('/api/setlists');
      if (response.ok) {
        const data = await response.json();
        setSetlists(data);
      }
    } catch (error) {
      console.error('Error loading setlists:', error);
    }
  };

  const createSetlist = async () => {
    if (!newSetlistName.trim()) return;

    try {
      const response = await fetch('/api/setlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSetlistName,
          songs: [],
          createdAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const newSetlist = await response.json();
        setSetlists(prev => [...prev, newSetlist]);
        setActiveSetlist(newSetlist);
        setNewSetlistName('');
        setShowNewSetlistForm(false);
      }
    } catch (error) {
      console.error('Error creating setlist:', error);
    }
  };

  const addSongToSetlist = async (song) => {
    if (!activeSetlist) return;

    const updatedSongs = [...activeSetlist.songs, {
      ...song,
      setlistPosition: activeSetlist.songs.length + 1
    }];

    const updatedSetlist = {
      ...activeSetlist,
      songs: updatedSongs
    };

    try {
      const response = await fetch('/api/setlists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSetlist)
      });

      if (response.ok) {
        setActiveSetlist(updatedSetlist);
        setSetlists(prev => 
          prev.map(setlist => 
            setlist.id === updatedSetlist.id ? updatedSetlist : setlist
          )
        );
      }
    } catch (error) {
      console.error('Error updating setlist:', error);
    }
  };

  const removeSongFromSetlist = async (songIndex) => {
    if (!activeSetlist) return;

    const updatedSongs = activeSetlist.songs.filter((_, index) => index !== songIndex);
    
    // Re-number positions
    const reNumberedSongs = updatedSongs.map((song, index) => ({
      ...song,
      setlistPosition: index + 1
    }));

    const updatedSetlist = {
      ...activeSetlist,
      songs: reNumberedSongs
    };

    try {
      const response = await fetch('/api/setlists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSetlist)
      });

      if (response.ok) {
        setActiveSetlist(updatedSetlist);
        setSetlists(prev => 
          prev.map(setlist => 
            setlist.id === updatedSetlist.id ? updatedSetlist : setlist
          )
        );
      }
    } catch (error) {
      console.error('Error updating setlist:', error);
    }
  };

  // Calculate total duration
  const calculateTotalDuration = (setlistSongs) => {
    const totalMinutes = setlistSongs.reduce((total, song) => {
      if (song.duration) {
        const [minutes, seconds] = safeDuration(song.duration).split(':').map(Number);
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
  const getInstrumentWarnings = (setlistSongs) => {
    const warnings = [];
    for (let i = 1; i < setlistSongs.length; i++) {
      const prevSong = setlistSongs[i - 1];
      const currentSong = setlistSongs[i];
      
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
      <h2 className="text-3xl font-bold mb-6 text-center">🎼 Setlist Builder</h2>

      {/* Setlist Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {setlists.map(setlist => (
            <button
              key={setlist.id}
              onClick={() => setActiveSetlist(setlist)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSetlist?.id === setlist.id
                  ? 'bg-blue text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {setlist.name} ({setlist.songs.length} songs)
            </button>
          ))}
          
          <button
            onClick={() => setShowNewSetlistForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            ➕ New Setlist
          </button>
        </div>

        {showNewSetlistForm && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSetlistName}
              onChange={(e) => setNewSetlistName(e.target.value)}
              placeholder="Setlist name (e.g., 'Summer Gigs 2024')"
              className="flex-1 p-2 border border-gray-300 rounded-md"
              onKeyPress={(e) => e.key === 'Enter' && createSetlist()}
            />
            <button
              onClick={createSetlist}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewSetlistForm(false);
                setNewSetlistName('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {activeSetlist ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Song Library */}
          <div>
            <h3 className="text-xl font-bold mb-4">📚 Song Library</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {songs.map((song, index) => (
                <div
                  key={`song-library-${song.id}-${index}`}
                  className="bg-white rounded-md p-3 mb-2 border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => addSongToSetlist(song)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{song.title}</p>
                      {song.medley && (
                        <p className="text-sm text-purple-600">{song.medley} - Part {song.medleyPosition}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>{song.key} | {safeDuration(song.duration)}</p>
                      <p>{song.bassGuitar}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Setlist */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">🎵 {activeSetlist.name}</h3>
              <div className="text-right">
                <p className="text-sm text-gray-600">{activeSetlist.songs.length} songs</p>
                <p className="font-medium">{calculateTotalDuration(activeSetlist.songs)}</p>
              </div>
            </div>

            {/* Instrument Warnings */}
            {activeSetlist.songs.length > 1 && (
              <div className="mb-4">
                {getInstrumentWarnings(activeSetlist.songs).map((warning, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mb-2">
                    <p className="text-sm text-yellow-800">⚠️ {warning}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {activeSetlist.songs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Click songs from the library to add them to this setlist
                </p>
              ) : (
                activeSetlist.songs.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className="bg-white rounded-md p-3 mb-2 border border-gray-200"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {index + 1}. {song.title}
                        </p>
                        {song.medley && (
                          <p className="text-sm text-purple-600">{song.medley} - Part {song.medleyPosition}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm text-gray-600">
                          <p>{song.key} | {safeDuration(song.duration)}</p>
                          <p>{song.bassGuitar}</p>
                        </div>
                        <button
                          onClick={() => removeSongFromSetlist(index)}
                          className="text-red-600 hover:text-red-800 font-bold"
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
          <p className="text-gray-500 mb-4">Select a setlist or create a new one to get started</p>
        </div>
      )}
    </div>
  );
}