"use client";

import { useState, useEffect } from 'react';
import TagInput from './TagInput';
import InstrumentChangeIndicator from './InstrumentChangeIndicator';
import SetupSummary from './SetupSummary';
import PDFGenerator from './PDFGenerator';
import { useDragDrop } from '../hooks/useDragDrop';
import DraggableSong from './DraggableSong';

export default function SetBuilder({ songs }) {
  const [sets, setSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [newSetName, setNewSetName] = useState('');
  const [showNewSetForm, setShowNewSetForm] = useState(false);
  const [availableSongFilters, setAvailableSongFilters] = useState({
    searchText: '',
    language: 'all',
    key: 'all',
    bassType: 'all',
    guitarType: 'all',
    vocalist: 'all',
    backingTrack: 'all',
    selectedTags: []
  });

  // Load sets on component mount
  useEffect(() => {
    loadSets();
  }, []);

  const loadSets = async () => {
    try {
      const [setsResponse, songsResponse] = await Promise.all([
        fetch('/api/sets'),
        fetch('/api/songs')
      ]);
      
      if (setsResponse.ok && songsResponse.ok) {
        const setsData = await setsResponse.json();
        const songsData = await songsResponse.json();
        
        // Update sets with fresh song data
        const updatedSets = setsData.map(set => ({
          ...set,
          songs: set.songs.map(setSong => {
            // Find the current version of this song
            const currentSong = songsData.find(s => s.id === setSong.id);
            // Return the current song data, or fall back to stored data
            return currentSong || setSong;
          })
        }));
        
        setSets(updatedSets);
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

    // Check if song already exists in the set
    const songExists = activeSet.songs.some(existingSong => 
      existingSong.id === song.id || 
      (existingSong.title === song.title && existingSong.artist === song.artist)
    );
    
    if (songExists) {
      alert('This song is already in the set!');
      return;
    }

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

  const deleteSet = async (setToDelete) => {
    // DEBUG: Add logging to understand the issue
    console.log('Trying to delete set with ID:', setToDelete.id);
    console.log('Type of ID:', typeof setToDelete.id);
    console.log('Set object being deleted:', setToDelete);

    const confirmed = window.confirm(
      `Are you sure you want to delete the set "${setToDelete.name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/sets?id=${setToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setSets(prev => prev.filter(set => set.id !== setToDelete.id));
        
        // If this was the active set, clear it
        if (activeSet?.id === setToDelete.id) {
          setActiveSet(null);
        }
        
        alert(`Set "${setToDelete.name}" has been deleted successfully.`);
      } else {
        const error = await response.json();
        alert(`Failed to delete set: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting set:', error);
      alert('Error deleting set. Please try again.');
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

  // Filter handlers
  const updateAvailableFilter = (filterKey, value) => {
    setAvailableSongFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleAvailableTagChange = (newTags) => {
    setAvailableSongFilters(prev => ({
      ...prev,
      selectedTags: newTags
    }));
  };

  const clearAvailableFilters = () => {
    setAvailableSongFilters({
      searchText: '',
      language: 'all',
      key: 'all',
      bassType: 'all',
      guitarType: 'all',
      vocalist: 'all',
      backingTrack: 'all',
      selectedTags: []
    });
  };

  // Get available songs (songs not in the current set)
  const getAvailableSongs = () => {
    if (!activeSet) return songs;
    return songs.filter(song => !activeSet.songs.some(setSong => setSong.id === song.id));
  };

  // Comprehensive filtering function
  const getFilteredAvailableSongs = () => {
    const availableSongs = getAvailableSongs();
    
    return availableSongs.filter(song => {
      // Text search
      const searchMatch = !availableSongFilters.searchText || 
        song.title.toLowerCase().includes(availableSongFilters.searchText.toLowerCase()) ||
        (song.artist && song.artist.toLowerCase().includes(availableSongFilters.searchText.toLowerCase()));

      // Language filter
      const languageMatch = availableSongFilters.language === 'all' || 
        song.language === availableSongFilters.language;

      // Key filter
      const keyMatch = availableSongFilters.key === 'all' || 
        song.key === availableSongFilters.key;

      // Bass filter
      const bassMatch = availableSongFilters.bassType === 'all' || 
        song.bassGuitar === availableSongFilters.bassType;

      // Guitar filter
      const guitarMatch = availableSongFilters.guitarType === 'all' || 
        song.guitar === availableSongFilters.guitarType;

      // Vocalist filter
      const vocalistMatch = availableSongFilters.vocalist === 'all' || 
        song.vocalist === availableSongFilters.vocalist;

      // Backing track filter
      const backingTrackMatch = availableSongFilters.backingTrack === 'all' || 
        (availableSongFilters.backingTrack === 'yes' && song.backingTrack) ||
        (availableSongFilters.backingTrack === 'no' && !song.backingTrack);

      // Tag filter
      const tagMatch = !availableSongFilters.selectedTags || 
        availableSongFilters.selectedTags.length === 0 ||
        availableSongFilters.selectedTags.some(tag => song.tags && song.tags.includes(tag));

      return searchMatch && languageMatch && keyMatch && bassMatch && 
             guitarMatch && vocalistMatch && backingTrackMatch && tagMatch;
    });
  };

  // Language Analytics Functions
  const calculateLanguageStats = (songs) => {
    // DEBUG: Let's see what we're actually getting
    console.log('=== LANGUAGE ANALYTICS DEBUG ===');
    console.log('Songs received:', songs);
    songs.forEach((song, index) => {
      console.log(`Song ${index + 1}:`, {
        title: song.title,
        language: song.language,
        languageType: typeof song.language,
        vocalist: song.vocalist,
        vocalistType: typeof song.vocalist,
        duration: song.duration
      });
    });
    console.log('=== END DEBUG ===');

    if (!songs || songs.length === 0) {
      return { danish: 0, english: 0, totalDuration: 0 };
    }

    const totalDuration = songs.reduce((sum, song) => {
      if (song.duration) {
        const [minutes, seconds] = song.duration.split(':').map(Number);
        return sum + minutes + (seconds / 60);
      }
      return sum;
    }, 0);

    const danishDuration = songs
      .filter(song => song.language === 'danish')
      .reduce((sum, song) => {
        if (song.duration) {
          const [minutes, seconds] = song.duration.split(':').map(Number);
          return sum + minutes + (seconds / 60);
        }
        return sum;
      }, 0);

    const englishDuration = songs
      .filter(song => song.language === 'english')
      .reduce((sum, song) => {
        if (song.duration) {
          const [minutes, seconds] = song.duration.split(':').map(Number);
          return sum + minutes + (seconds / 60);
        }
        return sum;
      }, 0);

    return {
      danish: totalDuration > 0 ? Math.round((danishDuration / totalDuration) * 100) : 0,
      english: totalDuration > 0 ? Math.round((englishDuration / totalDuration) * 100) : 0,
      totalDuration,
      danishDuration,
      englishDuration
    };
  };

  // Vocalist Analytics Functions
  const calculateVocalistStats = (songs) => {
    if (!songs || songs.length === 0) {
      return { rikke: 0, lorentz: 0, both: 0, totalDuration: 0 };
    }

    const totalDuration = songs.reduce((sum, song) => {
      if (song.duration) {
        const [minutes, seconds] = song.duration.split(':').map(Number);
        return sum + minutes + (seconds / 60);
      }
      return sum;
    }, 0);

    const rikkeDuration = songs
      .filter(song => song.vocalist === 'Rikke' || song.vocalist === 'Both')
      .reduce((sum, song) => {
        if (song.duration) {
          const [minutes, seconds] = song.duration.split(':').map(Number);
          // If both vocalists, split the time
          const timeShare = song.vocalist === 'Both' ? 0.5 : 1;
          return sum + (minutes + (seconds / 60)) * timeShare;
        }
        return sum;
      }, 0);

    const lorentzDuration = songs
      .filter(song => song.vocalist === 'Lorentz' || song.vocalist === 'Both')
      .reduce((sum, song) => {
        if (song.duration) {
          const [minutes, seconds] = song.duration.split(':').map(Number);
          // If both vocalists, split the time
          const timeShare = song.vocalist === 'Both' ? 0.5 : 1;
          return sum + (minutes + (seconds / 60)) * timeShare;
        }
        return sum;
      }, 0);

    const bothDuration = songs
      .filter(song => song.vocalist === 'Both')
      .reduce((sum, song) => {
        if (song.duration) {
          const [minutes, seconds] = song.duration.split(':').map(Number);
          return sum + minutes + (seconds / 60);
        }
        return sum;
      }, 0);

    return {
      rikke: totalDuration > 0 ? Math.round((rikkeDuration / totalDuration) * 100) : 0,
      lorentz: totalDuration > 0 ? Math.round((lorentzDuration / totalDuration) * 100) : 0,
      both: totalDuration > 0 ? Math.round((bothDuration / totalDuration) * 100) : 0,
      totalDuration,
      rikkeDuration,
      lorentzDuration,
      bothDuration
    };
  };

  // Analytics Display Components
  const LanguageAnalytics = ({ songs, className = "" }) => {
    const stats = calculateLanguageStats(songs);
    
    if (!songs || songs.length === 0) {
      return <div className={`text-gray-400 ${className}`}>No songs</div>;
    }

    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-4 mb-2">
          <h4 className="font-semibold text-gray-700">🌍 Language Mix</h4>
          <div className="flex gap-3">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">
              🇩🇰 {stats.danish}%
            </span>
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium">
              🇬🇧 {stats.english}%
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500" 
              style={{ width: `${stats.danish}%` }}
            ></div>
            <div 
              className="bg-red-500" 
              style={{ width: `${stats.english}%` }}
            ></div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{Math.floor(stats.danishDuration)}min Danish</span>
          <span>{Math.floor(stats.englishDuration)}min English</span>
        </div>
      </div>
    );
  };

  const VocalistAnalytics = ({ songs, className = "" }) => {
    const stats = calculateVocalistStats(songs);
    
    if (!songs || songs.length === 0) {
      return <div className={`text-gray-400 ${className}`}>No songs</div>;
    }

    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-4 mb-2">
          <h4 className="font-semibold text-gray-700">🎤 Vocal Distribution</h4>
          <div className="flex gap-3">
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-medium">
              🎤 Rikke {stats.rikke}%
            </span>
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">
              🎤 Lorentz {stats.lorentz}%
            </span>
            {stats.both > 0 && (
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-sm font-medium">
                🎤🎤 Both {stats.both}%
              </span>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div 
              className="bg-purple-500" 
              style={{ width: `${stats.rikke}%` }}
            ></div>
            <div 
              className="bg-green-500" 
              style={{ width: `${stats.lorentz}%` }}
            ></div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{Math.floor(stats.rikkeDuration)}min Rikke</span>
          <span>{Math.floor(stats.lorentzDuration)}min Lorentz</span>
        </div>
      </div>
    );
  };

  const SetAnalytics = ({ songs }) => {
    if (!songs || songs.length === 0) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <LanguageAnalytics songs={songs} />
        <VocalistAnalytics songs={songs} />
        <div className="text-sm text-gray-600 text-center">
          {songs.length} songs • {Math.floor(calculateLanguageStats(songs).totalDuration)}min total
        </div>
      </div>
    );
  };

  // Drag & Drop functionality for songs
  const handleSongReorder = async (newSongs) => {
    if (!activeSet) return;

    const updatedSet = { ...activeSet, songs: newSongs };
    setActiveSet(updatedSet);
    
    // Update in sets array
    const updatedSets = sets.map(set => 
      set.id === activeSet.id ? updatedSet : set
    );
    setSets(updatedSets);
    
    // Save to database
    try {
      const response = await fetch('/api/sets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSet)
      });

      if (!response.ok) {
        console.error('Failed to save reordered songs');
      }
    } catch (error) {
      console.error('Error saving reordered songs:', error);
    }
  };

  const songDragHandlers = useDragDrop(activeSet?.songs || [], handleSongReorder);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-3xl font-black mb-6 text-center text-gray-900">🎼 Set Builder</h2>
      <p className="text-center text-gray-600 mb-6">Create reusable sets that you can use in multiple gigs</p>

      {/* Set Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {sets.map((set, index) => (
            <div key={`set-${set.id || index}`} className="flex items-center gap-1">
              <button
                onClick={() => setActiveSet(set)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSet?.id === set.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {set.name} ({set.songs.length} songs, {calculateTotalDuration(set.songs)})
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSet(set);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-2 rounded-lg text-sm font-medium transition-colors"
                title={`Delete ${set.name}`}
              >
                🗑️
              </button>
            </div>
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
        <>
          {/* Analytics Section */}
          <div className="mb-6">
            <SetAnalytics songs={activeSet.songs} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Current Set - Take 2/3 width on large screens */}
            <div className="xl:col-span-2">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Current Set: {activeSet.name} ({activeSet.songs.length} songs)
                  </h3>
                  <div className="flex gap-2">
                    {activeSet && activeSet.songs && activeSet.songs.length > 0 && (
                      <PDFGenerator 
                        setlist={activeSet.songs} 
                        gigName={`${activeSet.name} - Set`} 
                      />
                    )}
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

                {/* Setup Summary */}
                <SetupSummary songs={activeSet.songs} />

                {/* Expanded Songs Container - No Height Restriction */}
                <div className="bg-purple-50 rounded-lg p-4">
                  {activeSet.songs.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">
                        No songs in this set yet
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Click songs from the library below to add them to this set
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeSet.songs.map((song, index) => (
                        <DraggableSong
                          key={`song-${index}-${song.id || song.title || Math.random()}`}
                          song={song}
                          index={index}
                          previousSong={index > 0 ? activeSet.songs[index - 1] : null}
                          onRemove={removeSongFromSet}
                          dragHandlers={{
                            ...songDragHandlers,
                            handleDragStart: (e, idx) => songDragHandlers.handleDragStart(e, idx),
                            handleDrop: (e, idx) => songDragHandlers.handleDrop(e, idx),
                          }}
                          isDraggedOver={songDragHandlers.dragOverIndex === index}
                          isDragging={songDragHandlers.draggedIndex === index}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Set Analytics - Move to Bottom */}
                {activeSet.songs.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">📊 Set Analytics</h4>
                    <SetAnalytics songs={activeSet.songs} />
                  </div>
                )}
              </div>
            </div>

            {/* Available Songs Section with Filters */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Available Songs</h3>
                <span className="text-sm text-gray-500">
                  {getFilteredAvailableSongs().length} of {getAvailableSongs().length} songs
                </span>
              </div>
              
              {/* Search and Filters */}
              <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                {/* Search */}
                <div>
                  <input
                    type="text"
                    placeholder="🔍 Search songs by title or artist..."
                    value={availableSongFilters.searchText}
                    onChange={(e) => updateAvailableFilter('searchText', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                {/* Filter Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {/* Language Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
                    <select
                      value={availableSongFilters.language}
                      onChange={(e) => updateAvailableFilter('language', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">🌐 All</option>
                      <option value="english">🇬🇧 English</option>
                      <option value="danish">🇩🇰 Danish</option>
                    </select>
                  </div>

                  {/* Key Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Key</label>
                    <select
                      value={availableSongFilters.key}
                      onChange={(e) => updateAvailableFilter('key', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">🎵 All Keys</option>
                      <option value="C">C</option>
                      <option value="C#">C#</option>
                      <option value="D">D</option>
                      <option value="D#">D#</option>
                      <option value="E">E</option>
                      <option value="F">F</option>
                      <option value="F#">F#</option>
                      <option value="G">G</option>
                      <option value="G#">G#</option>
                      <option value="A">A</option>
                      <option value="A#">A#</option>
                      <option value="B">B</option>
                    </select>
                  </div>

                  {/* Bass Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Bass</label>
                    <select
                      value={availableSongFilters.bassType}
                      onChange={(e) => updateAvailableFilter('bassType', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">🎸 All Bass</option>
                      <option value="4-string">4-string</option>
                      <option value="5-string">5-string</option>
                      <option value="synth bass">Synth Bass</option>
                    </select>
                  </div>

                  {/* Guitar Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Guitar</label>
                    <select
                      value={availableSongFilters.guitarType}
                      onChange={(e) => updateAvailableFilter('guitarType', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">🎸 All Guitar</option>
                      <option value="Electric">Electric</option>
                      <option value="Acoustic">Acoustic</option>
                      <option value="12-string">12-string</option>
                      <option value="Classical">Classical</option>
                    </select>
                  </div>

                  {/* Vocalist Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Vocalist</label>
                    <select
                      value={availableSongFilters.vocalist}
                      onChange={(e) => updateAvailableFilter('vocalist', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">🎤 All</option>
                      <option value="Rikke">🎤 Rikke</option>
                      <option value="Lorentz">🎤 Lorentz</option>
                      <option value="Both">🎤🎤 Both</option>
                    </select>
                  </div>

                  {/* Backing Track Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Backing Track</label>
                    <select
                      value={availableSongFilters.backingTrack}
                      onChange={(e) => updateAvailableFilter('backingTrack', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">🎵 All</option>
                      <option value="yes">✅ Has Track</option>
                      <option value="no">❌ No Track</option>
                    </select>
                  </div>
                </div>
                
                {/* Tag Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏷️ Filter by Tags
                  </label>
                  <TagInput
                    tags={availableSongFilters.selectedTags}
                    onChange={handleAvailableTagChange}
                    placeholder="Filter by tags like 'Ballad', 'Wedding', 'High Energy'..."
                  />
                </div>
                
                {/* Results Summary */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-800 font-medium">
                    📊 Showing {getFilteredAvailableSongs().length} of {getAvailableSongs().length} available songs
                  </span>
                </div>
              </div>
              
              {/* Available Songs List - Increased Height */}
              <div className="max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg">
                {getFilteredAvailableSongs().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No songs match your current filters</p>
                    <button
                      onClick={clearAvailableFilters}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {getFilteredAvailableSongs().map((song, index) => (
                      <div key={`available-song-${index}-${song.id || song.title || Math.random()}`} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{song.title}</span>
                              <span className="text-gray-600">by {song.artist}</span>
                              {song.language === 'danish' && <span>🇩🇰</span>}
                              {song.language === 'english' && <span>🇬🇧</span>}
                              {song.vocalist === 'Rikke' && <span>🎤</span>}
                              {song.vocalist === 'Lorentz' && <span>🎤</span>}
                              {song.vocalist === 'Both' && <span>🎤🎤</span>}
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-2">
                              {song.key && <span className="mr-3">Key: {song.key}</span>}
                              {song.duration && <span className="mr-3">⏱️ {song.duration}</span>}
                              {song.backingTrack && <span className="mr-3">🎵 Track</span>}
                            </div>
                            
                            {song.tags && song.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {song.tags.map((tag, tagIndex) => (
                                  <span
                                    key={`${song.id || index}-tag-${tagIndex}`}
                                    className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => addSongToSet(song)}
                            className="ml-3 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Add to Set
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Select a set or create a new one to get started</p>
          <p className="text-sm text-gray-400">Sets are reusable collections of songs you can use in multiple gigs</p>
        </div>
      )}
    </div>
  );
}