"use client";

import { useState, useEffect } from 'react';
import PDFGenerator from './PDFGenerator';
import { useDragDrop } from '../hooks/useDragDrop';
import DraggableSet from './DraggableSet';

export default function GigBuilder({ songs }) {
  const [sets, setSets] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [activeGig, setActiveGig] = useState(null);
  const [newGigName, setNewGigName] = useState('');
  const [showNewGigForm, setShowNewGigForm] = useState(false);
  const [setSearchText, setSetSearchText] = useState('');

  // Load sets and gigs on component mount
  useEffect(() => {
    loadSets();
    loadGigs();
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

  const loadGigs = async () => {
    try {
      const [gigsResponse, songsResponse] = await Promise.all([
        fetch('/api/gigs'),
        fetch('/api/songs')
      ]);
      
      if (gigsResponse.ok && songsResponse.ok) {
        const gigsData = await gigsResponse.json();
        const songsData = await songsResponse.json();
        
        // Update gigs with fresh song data in their sets
        const updatedGigs = gigsData.map(gig => ({
          ...gig,
          sets: gig.sets.map(set => ({
            ...set,
            songs: set.songs.map(setSong => {
              // Find the current version of this song
              const currentSong = songsData.find(s => s.id === setSong.id);
              // Return the current song data, or fall back to stored data
              return currentSong || setSong;
            })
          }))
        }));
        
        setGigs(updatedGigs);
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

  // Get total song count for a gig
  const getTotalSongCount = (gigSets) => {
    return gigSets.reduce((total, set) => total + set.songs.length, 0);
  };

  // Search filtering function
  const getFilteredAvailableSets = () => {
    return sets.filter(set => 
      set.name.toLowerCase().includes(setSearchText.toLowerCase())
    );
  };

  // Drag & Drop functionality for sets
  const handleSetReorder = async (newSets) => {
    if (!activeGig) return;

    const updatedGig = { ...activeGig, sets: newSets };
    setActiveGig(updatedGig);
    
    // Update in gigs array
    const updatedGigs = gigs.map(gig => 
      gig.id === activeGig.id ? updatedGig : gig
    );
    setGigs(updatedGigs);
    
    // Save to database
    try {
      const response = await fetch('/api/gigs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGig)
      });

      if (!response.ok) {
        console.error('Failed to save reordered sets');
      }
    } catch (error) {
      console.error('Error saving reordered sets:', error);
    }
  };

  const setDragHandlers = useDragDrop(activeGig?.sets || [], handleSetReorder);

  // Helper function to calculate set analytics
  const calculateSetAnalytics = (set) => {
    if (!set.songs || set.songs.length === 0) {
      return {
        duration: '0:00',
        songCount: 0,
        languageBreakdown: { english: 0, danish: 0 },
        vocalistBreakdown: { Rikke: 0, Lorentz: 0, Both: 0 },
        totalDurationMinutes: 0
      };
    }

    let totalSeconds = 0;
    let englishTime = 0;
    let danishTime = 0;
    let rikkeTime = 0;
    let lorentzTime = 0;
    let bothTime = 0;

    set.songs.forEach(song => {
      const [minutes, seconds] = (song.duration || '0:00').split(':').map(Number);
      const songSeconds = (minutes * 60) + (seconds || 0);
      totalSeconds += songSeconds;

      // Language breakdown
      if (song.language === 'english') {
        englishTime += songSeconds;
      } else if (song.language === 'danish') {
        danishTime += songSeconds;
      }

      // Vocalist breakdown
      if (song.vocalist === 'Rikke') {
        rikkeTime += songSeconds;
      } else if (song.vocalist === 'Lorentz') {
        lorentzTime += songSeconds;
      } else if (song.vocalist === 'Both') {
        bothTime += songSeconds / 2; // Split time for both
        rikkeTime += songSeconds / 2;
        lorentzTime += songSeconds / 2;
      }
    });

    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const durationString = `${totalMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;

    const englishPercent = totalSeconds > 0 ? Math.round((englishTime / totalSeconds) * 100) : 0;
    const danishPercent = 100 - englishPercent;

    const rikkePercent = totalSeconds > 0 ? Math.round((rikkeTime / totalSeconds) * 100) : 0;
    const lorentzPercent = totalSeconds > 0 ? Math.round((lorentzTime / totalSeconds) * 100) : 0;

    // Get common tags from all songs
    const allTags = set.songs.flatMap(song => song.tags || []);
    const tagCounts = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    const commonTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);

    return {
      duration: durationString,
      songCount: set.songs.length,
      languageBreakdown: { english: englishPercent, danish: danishPercent },
      vocalistBreakdown: { Rikke: rikkePercent, Lorentz: lorentzPercent },
      totalDurationMinutes: totalMinutes,
      commonTags
    };
  };

  const deleteGig = async (gigToDelete) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the gig "${gigToDelete.name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/gigs?id=${gigToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setGigs(prev => prev.filter(gig => gig.id !== gigToDelete.id));
        
        // If this was the active gig, clear it
        if (activeGig?.id === gigToDelete.id) {
          setActiveGig(null);
        }
        
        alert(`Gig "${gigToDelete.name}" has been deleted successfully.`);
      } else {
        const error = await response.json();
        alert(`Failed to delete gig: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting gig:', error);
      alert('Error deleting gig. Please try again.');
    }
  };

  // Language Analytics Functions
  const calculateLanguageStats = (songs) => {
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
          const timeShare = song.vocalist === 'Both' ? 0.5 : 1;
          return sum + (minutes + (seconds / 60)) * timeShare;
        }
        return sum;
      }, 0);

    return {
      rikke: totalDuration > 0 ? Math.round((rikkeDuration / totalDuration) * 100) : 0,
      lorentz: totalDuration > 0 ? Math.round((lorentzDuration / totalDuration) * 100) : 0,
      totalDuration,
      rikkeDuration,
      lorentzDuration
    };
  };

  // Get all songs from all sets in a gig
  const getAllGigSongs = (gigSets) => {
    const allSongs = [];
    gigSets.forEach(set => {
      allSongs.push(...set.songs);
    });
    return allSongs;
  };

  // Analytics Display Components
  const GigOverallAnalytics = ({ gigSets }) => {
    const allSongs = getAllGigSongs(gigSets);
    const languageStats = calculateLanguageStats(allSongs);
    const vocalistStats = calculateVocalistStats(allSongs);
    
    if (allSongs.length === 0) return null;

    return (
      <div className="bg-gradient-to-r from-red-50 to-purple-50 p-6 rounded-lg border-2 border-red-200 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">📊 Overall Gig Analytics</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Language Analytics */}
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h4 className="font-semibold text-gray-700">🌍 Language Distribution</h4>
              <div className="flex gap-3">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  🇩🇰 {languageStats.danish}%
                </span>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                  🇬🇧 {languageStats.english}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="flex h-4 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500" 
                  style={{ width: `${languageStats.danish}%` }}
                ></div>
                <div 
                  className="bg-red-500" 
                  style={{ width: `${languageStats.english}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{Math.floor(languageStats.danishDuration)}min Danish</span>
              <span>{Math.floor(languageStats.englishDuration)}min English</span>
            </div>
          </div>

          {/* Vocalist Analytics */}
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h4 className="font-semibold text-gray-700">🎤 Vocal Workload</h4>
              <div className="flex gap-3">
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                  🎤 Rikke {vocalistStats.rikke}%
                </span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  🎤 Lorentz {vocalistStats.lorentz}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="flex h-4 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-500" 
                  style={{ width: `${vocalistStats.rikke}%` }}
                ></div>
                <div 
                  className="bg-green-500" 
                  style={{ width: `${vocalistStats.lorentz}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{Math.floor(vocalistStats.rikkeDuration)}min Rikke</span>
              <span>{Math.floor(vocalistStats.lorentzDuration)}min Lorentz</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 pt-4 border-t border-red-200">
          <span className="text-gray-700 font-medium">
            {allSongs.length} total songs • {Math.floor(languageStats.totalDuration)}min total duration
          </span>
        </div>
      </div>
    );
  };

  // Compact set analytics for individual sets
  const SetAnalyticsCompact = ({ set, setNumber }) => {
    const languageStats = calculateLanguageStats(set.songs);
    const vocalistStats = calculateVocalistStats(set.songs);
    
    if (set.songs.length === 0) return null;

    return (
      <div className="bg-gray-50 p-3 rounded-lg mt-3 border border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex gap-2 mb-1">
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs">
                🇩🇰 {languageStats.danish}%
              </span>
              <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs">
                🇬🇧 {languageStats.english}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="flex h-2 rounded-full overflow-hidden">
                <div className="bg-blue-400" style={{ width: `${languageStats.danish}%` }}></div>
                <div className="bg-red-400" style={{ width: `${languageStats.english}%` }}></div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex gap-2 mb-1">
              <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-xs">
                🎤 Rikke {vocalistStats.rikke}%
              </span>
              <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-xs">
                🎤 Lorentz {vocalistStats.lorentz}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="flex h-2 rounded-full overflow-hidden">
                <div className="bg-purple-400" style={{ width: `${vocalistStats.rikke}%` }}></div>
                <div className="bg-green-400" style={{ width: `${vocalistStats.lorentz}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-3xl font-black mb-6 text-center text-gray-900">🎪 Gig Builder</h2>
      <p className="text-center text-gray-600 mb-6">Combine your reusable sets into complete gigs</p>

      {/* Gig Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {gigs.map((gig, index) => (
            <div key={`gig-${gig.id || index}`} className="flex items-center gap-1">
              <button
                onClick={() => setActiveGig(gig)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeGig?.id === gig.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {gig.name} ({gig.sets.length} sets, {calculateGigDuration(gig.sets)})
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteGig(gig);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-2 rounded-lg text-sm font-medium transition-colors"
                title={`Delete ${gig.name}`}
              >
                🗑️
              </button>
            </div>
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
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Current Gig - Take 2/3 width on large screens */}
            <div className="xl:col-span-2">
              {/* Current Gig */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Current Gig: {activeGig.name} ({activeGig.sets.length} sets)
                  </h3>
                  <div className="flex gap-2">
                    {activeGig && activeGig.sets && activeGig.sets.length > 0 && (
                      <PDFGenerator 
                        setlist={activeGig} 
                        gigName={activeGig.name} 
                      />
                    )}
                  </div>
                </div>

                {/* Overall Gig Analytics */}
                <GigOverallAnalytics gigSets={activeGig.sets} />
                
                {/* Expanded Sets Container - No Height Restriction */}
                <div className="bg-red-50 rounded-lg p-4">
                  {activeGig.sets.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">
                        No sets in this gig yet
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Click sets from the library below to add them to this gig
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeGig.sets.map((set, index) => (
                        <div key={`set-${index}-${set.id || set.name || Math.random()}`}>
                          <DraggableSet
                            set={set}
                            index={index}
                            onRemove={removeSetFromGig}
                            dragHandlers={{
                              ...setDragHandlers,
                              handleDragStart: (e, idx) => setDragHandlers.handleDragStart(e, idx),
                              handleDrop: (e, idx) => setDragHandlers.handleDrop(e, idx),
                            }}
                            isDraggedOver={setDragHandlers.dragOverIndex === index}
                            isDragging={setDragHandlers.draggedIndex === index}
                            totalSets={activeGig.sets.length}
                          >
                            <SetAnalyticsCompact set={set} setNumber={index + 1} />
                          </DraggableSet>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Gig Summary - Move to Bottom */}
                {activeGig.sets.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">🎪 Gig Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {activeGig.sets.length}
                        </p>
                        <p className="text-sm text-gray-600">Sets</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {activeGig.sets.reduce((total, set) => total + (set.songs?.length || 0), 0)}
                        </p>
                        <p className="text-sm text-gray-600">Total Songs</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {calculateGigDuration(activeGig.sets)}
                        </p>
                        <p className="text-sm text-gray-600">Duration</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Available Sets Section with Search */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Available Sets</h3>
                <span className="text-sm text-gray-500">
                  {getFilteredAvailableSets().length} of {sets.length} sets
                </span>
              </div>
              
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="🔍 Search sets by name..."
                  value={setSearchText}
                  onChange={(e) => setSetSearchText(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {/* Available Sets List - Increased Height */}
              <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg">
                {getFilteredAvailableSets().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {setSearchText ? (
                      <>
                        <p>No sets match &quot;{setSearchText}&quot;</p>
                        <button
                          onClick={() => setSetSearchText('')}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Clear search
                        </button>
                      </>
                    ) : (
                      <p>No sets available. Create some sets first!</p>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {getFilteredAvailableSets().map((set, index) => {
                      const analytics = calculateSetAnalytics(set);
                      return (
                        <div key={`available-set-${index}-${set.id || set.name || Math.random()}`} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium text-lg">{set.name}</h4>
                              <div className="text-sm text-gray-600">
                                ⏱️ {analytics.duration} • 🎵 {analytics.songCount} songs
                              </div>
                            </div>
                            <button
                              onClick={() => addSetToGig(set)}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Add to Gig
                            </button>
                          </div>
                          
                          {/* Set Analytics */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {/* Language Breakdown */}
                            <div>
                              <span className="font-medium text-gray-700">Languages:</span>
                              <div className="mt-1">
                                {analytics.languageBreakdown.english > 0 && (
                                  <span className="inline-block mr-3">
                                    🇬🇧 {analytics.languageBreakdown.english}%
                                  </span>
                                )}
                                {analytics.languageBreakdown.danish > 0 && (
                                  <span className="inline-block">
                                    🇩🇰 {analytics.languageBreakdown.danish}%
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Vocalist Breakdown */}
                            <div>
                              <span className="font-medium text-gray-700">Vocals:</span>
                              <div className="mt-1">
                                {analytics.vocalistBreakdown.Rikke > 0 && (
                                  <span className="inline-block mr-2">
                                    🎤 Rikke: {analytics.vocalistBreakdown.Rikke}%
                                  </span>
                                )}
                                {analytics.vocalistBreakdown.Lorentz > 0 && (
                                  <span className="inline-block">
                                    🎤 Lorentz: {analytics.vocalistBreakdown.Lorentz}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Common Tags */}
                          {analytics.commonTags && analytics.commonTags.length > 0 && (
                            <div className="mt-3">
                              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Common Tags:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {analytics.commonTags.map((tag, tagIndex) => (
                                  <span
                                    key={`${set.id || index}-tag-${tagIndex}`}
                                    className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Select a gig or create a new one to get started</p>
          <p className="text-sm text-gray-400">Gigs are complete events made up of multiple sets</p>
        </div>
      )}
    </div>
  );
}