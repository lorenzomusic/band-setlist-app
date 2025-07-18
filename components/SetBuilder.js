"use client";

import { useState, useEffect, useCallback } from 'react';
import TagInput from './TagInput';
import InstrumentChangeIndicator from './InstrumentChangeIndicator';
import SetupSummary from './SetupSummary';
import PDFGenerator from './PDFGenerator';
import DraggableSong from './DraggableSong';
import { safeDuration } from '../utils/duration';
import { getMedleysFromSongs, getMedleyStats, organizeSetByMedleys, flattenOrganizedSet } from '../utils/medley';

export default function SetBuilder({ songs: propSongs }) {
  const [songs, setSongs] = useState([]);
  const [sets, setSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [newSetName, setNewSetName] = useState('');
  const [showNewSetForm, setShowNewSetForm] = useState(false);
  const [viewMode, setViewMode] = useState('songs'); // 'songs' or 'medleys'
  const [organizedSet, setOrganizedSet] = useState([]);
  const [collapsedMedleys, setCollapsedMedleys] = useState(new Set());
  const [allMedleysCollapsed, setAllMedleysCollapsed] = useState(false);
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

  // Load sets and songs on component mount
  useEffect(() => {
    loadSets();
  }, []);

  // Add this effect to reorganize the set when songs change
  useEffect(() => {
    if (activeSet && activeSet.songs) {
      const organized = organizeSetByMedleys(activeSet.songs);
      setOrganizedSet(organized);
    } else {
      setOrganizedSet([]);
    }
  }, [activeSet?.songs]);

  const loadSets = async () => {
    try {
      const [setsResponse, songsResponse] = await Promise.all([
        fetch('/api/sets'),
        fetch('/api/songs')
      ]);
      
      if (setsResponse.ok && songsResponse.ok) {
        const setsData = await setsResponse.json();
        const songsData = await songsResponse.json();
        
        // Set songs state
        setSongs(songsData);
        
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

    const newSet = {
      id: `set_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      name: newSetName.trim(),
      songs: [], // ALWAYS include this
      createdAt: new Date().toISOString(),
      createdBy: 'User',
      metadata: {}
    };
    
    console.log('Creating new set:', newSet);
    
    try {
      const response = await fetch('/api/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSet)
      });

      if (response.ok) {
        const apiResponse = await response.json();
        console.log('API Response:', apiResponse);
        
        // FIXED: Extract the actual set from the API response
        const createdSet = apiResponse.set || apiResponse; // Handle both response formats
        
        // Ensure the set has a songs array
        if (!createdSet.songs) {
          createdSet.songs = [];
        }
        
        console.log('Actual set data:', createdSet);
        console.log('New set created and activated');
        
        // Add to sets array
        setSets(prev => [...prev, createdSet]);
        
        // Set as active - use the actual set, not the API response
        setActiveSet(createdSet);
        
        setNewSetName('');
        setShowNewSetForm(false);
      }
    } catch (error) {
      console.error('Error creating set:', error);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/json'));
      console.log('Dropped data:', data);
      if (data) {
        addSongToSet(data);
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  const addSongToSet = useCallback((song, dropIndex = -1) => {
    console.log('Adding/reordering song in active set:', song.title);
    if (!activeSet) {
      console.log('No active set to add to');
      return;
    }
    const existingIndex = (activeSet?.songs || []).findIndex(s => s.id === song.id);
    if (existingIndex !== -1) {
      // Song already exists - show user-friendly message
      console.log('Song already in set at position', existingIndex);
      alert(`"${song.title}" is already in this set`);
      return; // For now, don't reorder - just prevent duplicates
    } else {
      // New song - add to set
      console.log('Adding new song to set');
      const updatedSet = {
        ...activeSet,
        songs: [...(activeSet?.songs || []), song]
      };
      console.log('Updated set with new song:', updatedSet.name, 'now has', updatedSet.songs.length, 'songs');
      setSets(prevSets => 
        prevSets.map(set => 
          set.id === activeSet.id ? updatedSet : set
        )
      );
      setActiveSet(updatedSet);
    }
  }, [activeSet, setSets, setActiveSet]);

  const removeSongFromSet = async (songId) => {
    if (!activeSet) return;
    
    const updatedSet = {
      ...activeSet,
      songs: activeSet.songs.filter(s => s.id !== songId)
    };
    
    try {
      const response = await fetch(`/api/sets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSet),
      });
      
      if (response.ok) {
        setActiveSet(updatedSet);
        setSets(prev => prev.map(s => s.id === activeSet.id ? updatedSet : s));
        console.log('Removed song from set');
      } else {
        console.error('Failed to remove song from set');
      }
    } catch (error) {
      console.error('Error removing song from set:', error);
    }
  };

  const deleteSet = async (setToDelete) => {
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
        return total + safeDuration(song.duration);
      }
      return total;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.ceil(totalMinutes % 60);
    
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
    if (!songs || songs.length === 0) return [];
    if (!activeSet) return songs;
    return songs.filter(song => !(activeSet?.songs || []).some(setSong => setSong.id === song.id));
  };

  // Get available medleys (medleys not fully in the current set)
  const getAvailableMedleys = () => {
    const availableSongs = getAvailableSongs();
    const medleys = getMedleysFromSongs(availableSongs);
    
    return Object.entries(medleys).map(([name, songs]) => ({
      name,
      songs,
      ...getMedleyStats(songs)
    }));
  };

  // Add medley to set
  const handleAddMedley = async (medley) => {
    if (!activeSet) {
      alert('Please select or create a set first');
      return;
    }
    
    // Add all songs from the medley to the current set
    const updatedSongs = [...(activeSet.songs || [])];
    medley.songs.forEach(song => {
      if (!updatedSongs.find(s => s.id === song.id)) {
        updatedSongs.push(song);
      }
    });
    
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
        setSets(prev => prev.map(s => s.id === activeSet.id ? updatedSet : s));
        console.log('Added medley:', medley.name);
      } else {
        alert('Failed to save set. Please try again.');
      }
    } catch (err) {
      alert('Failed to save set. Please try again.');
      console.error(err);
    }
  };

  const handleMoveMedley = async (index, direction) => {
    const newOrganized = [...organizedSet];
    const item = newOrganized[index];
    
    let newIndex;
    switch (direction) {
      case 'top':
        newIndex = 0;
        break;
      case 'up':
        newIndex = Math.max(0, index - 1);
        break;
      case 'down':
        newIndex = Math.min(newOrganized.length - 1, index + 1);
        break;
      case 'bottom':
        newIndex = newOrganized.length - 1;
        break;
      default:
        return;
    }
    
    // Remove item from current position and insert at new position
    newOrganized.splice(index, 1);
    newOrganized.splice(newIndex, 0, item);
    
    // Convert back to flat song list and update
    const flatSongs = flattenOrganizedSet(newOrganized);
    const updatedSet = { ...activeSet, songs: flatSongs };
    
    try {
      const response = await fetch('/api/sets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSet)
      });
      
      if (response.ok) {
        setActiveSet(updatedSet);
        setSets(prev => prev.map(s => s.id === activeSet.id ? updatedSet : s));
      }
    } catch (error) {
      console.error('Error moving medley:', error);
    }
  };

  const handleMoveItem = async (index, direction) => {
    // This handles individual song movement within the organized structure
    const newOrganized = [...organizedSet];
    const item = newOrganized[index];
    
    let newIndex;
    switch (direction) {
      case 'top':
        newIndex = 0;
        break;
      case 'up':
        newIndex = Math.max(0, index - 1);
        break;
      case 'down':
        newIndex = Math.min(newOrganized.length - 1, index + 1);
        break;
      case 'bottom':
        newIndex = newOrganized.length - 1;
        break;
      default:
        return;
    }
    
    // Remove item from current position and insert at new position
    newOrganized.splice(index, 1);
    newOrganized.splice(newIndex, 0, item);
    
    // Convert back to flat song list and update
    const flatSongs = flattenOrganizedSet(newOrganized);
    const updatedSet = { ...activeSet, songs: flatSongs };
    
    try {
      const response = await fetch('/api/sets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSet)
      });
      
      if (response.ok) {
        setActiveSet(updatedSet);
        setSets(prev => prev.map(s => s.id === activeSet.id ? updatedSet : s));
      }
    } catch (error) {
      console.error('Error moving item:', error);
    }
  };

  const handleRemoveMedley = async (index) => {
    if (confirm('Remove entire medley from set?')) {
      const newOrganized = [...organizedSet];
      newOrganized.splice(index, 1);
      
      const flatSongs = flattenOrganizedSet(newOrganized);
      const updatedSet = { ...activeSet, songs: flatSongs };
      
      try {
        const response = await fetch('/api/sets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSet)
        });
        
        if (response.ok) {
          setActiveSet(updatedSet);
          setSets(prev => prev.map(s => s.id === activeSet.id ? updatedSet : s));
        }
      } catch (error) {
        console.error('Error removing medley:', error);
      }
    }
  };

  // Medley collapse/expand handlers
  const toggleMedleyCollapse = (medleyId) => {
    setCollapsedMedleys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(medleyId)) {
        newSet.delete(medleyId);
      } else {
        newSet.add(medleyId);
      }
      return newSet;
    });
  };

  const toggleAllMedleys = () => {
    const medleyIds = organizedSet
      .filter(item => item.type === 'medley')
      .map(item => item.id);
    
    if (allMedleysCollapsed) {
      // Expand all
      setCollapsedMedleys(new Set());
      setAllMedleysCollapsed(false);
    } else {
      // Collapse all
      setCollapsedMedleys(new Set(medleyIds));
      setAllMedleysCollapsed(true);
    }
  };

  // Update allMedleysCollapsed state when individual medleys change
  useEffect(() => {
    const medleyIds = organizedSet
      .filter(item => item.type === 'medley')
      .map(item => item.id);
    
    const allCollapsed = medleyIds.length > 0 && medleyIds.every(id => collapsedMedleys.has(id));
    setAllMedleysCollapsed(allCollapsed);
  }, [collapsedMedleys, organizedSet]);

  // Comprehensive filtering function
  const getFilteredAvailableSongs = () => {
    const availableSongs = getAvailableSongs();
    
    if (!availableSongs || availableSongs.length === 0) return [];
    
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

  // Filter medleys based on search
  const getFilteredAvailableMedleys = () => {
    const availableMedleys = getAvailableMedleys();
    
    if (!availableMedleys || availableMedleys.length === 0) return [];
    
    return availableMedleys.filter(medley => {
      // Text search
      const searchMatch = !availableSongFilters.searchText || 
        medley.name.toLowerCase().includes(availableSongFilters.searchText.toLowerCase()) ||
        medley.songs.some(song => 
          song.title.toLowerCase().includes(availableSongFilters.searchText.toLowerCase()) ||
          (song.artist && song.artist.toLowerCase().includes(availableSongFilters.searchText.toLowerCase()))
        );

      return searchMatch;
    });
  };

  // Language Analytics Functions
  const calculateLanguageStats = (songs) => {
    if (!songs || songs.length === 0) {
      return { danish: 0, english: 0, totalDuration: 0 };
    }

    const totalDuration = songs.reduce((sum, song) => {
      if (song.duration) {
        return sum + safeDuration(song.duration);
      }
      return sum;
    }, 0);

    const danishDuration = songs
      .filter(song => song.language === 'danish')
      .reduce((sum, song) => {
        if (song.duration) {
          return sum + safeDuration(song.duration);
        }
        return sum;
      }, 0);

    const englishDuration = songs
      .filter(song => song.language === 'english')
      .reduce((sum, song) => {
        if (song.duration) {
          return sum + safeDuration(song.duration);
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
        return sum + safeDuration(song.duration);
      }
      return sum;
    }, 0);

    const rikkeDuration = songs
      .filter(song => song.vocalist === 'Rikke' || song.vocalist === 'Both')
      .reduce((sum, song) => {
        if (song.duration) {
          // If both vocalists, split the time
          const timeShare = song.vocalist === 'Both' ? 0.5 : 1;
          return sum + safeDuration(song.duration) * timeShare;
        }
        return sum;
      }, 0);

    const lorentzDuration = songs
      .filter(song => song.vocalist === 'Lorentz' || song.vocalist === 'Both')
      .reduce((sum, song) => {
        if (song.duration) {
          // If both vocalists, split the time
          const timeShare = song.vocalist === 'Both' ? 0.5 : 1;
          return sum + safeDuration(song.duration) * timeShare;
        }
        return sum;
      }, 0);

    const bothDuration = songs
      .filter(song => song.vocalist === 'Both')
      .reduce((sum, song) => {
        if (song.duration) {
          return sum + safeDuration(song.duration);
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
              className="bg-blue" 
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

  return (
    <>
      {/* Header */}
      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h1 className="text-apple-title-1 text-primary mb-2">🎼 Set Builder</h1>
          <p className="text-apple-body text-secondary">Create reusable sets that you can use in multiple gigs</p>
        </div>
      </div>

      {/* Set Selection */}
      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-light">
          <h3 className="text-apple-title-3 text-primary">Your Sets</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {sets.map((set, index) => (
              <div key={`set-${set.id || index}`} className="flex items-center gap-1">
                <button
                  onClick={() => setActiveSet(set)}
                  className={`px-4 py-2 rounded-apple-button font-medium transition-apple-fast ${
                    activeSet?.id === set.id
                      ? 'bg-blue text-white'
                      : 'bg-gray-100 text-primary hover:bg-gray-200'
                  }`}
                >
                  {set.name} ({(set.songs || []).length} songs, {calculateTotalDuration(set.songs || [])})
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSet(set);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-2 rounded-apple-button text-sm font-medium transition-apple-fast"
                  title={`Delete ${set.name}`}
                >
                  🗑️
                </button>
              </div>
            ))}
            
            <button
              onClick={() => setShowNewSetForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-apple-button font-medium hover:bg-green-700 transition-apple-fast"
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
                className="flex-1 apple-input"
                onKeyPress={(e) => e.key === 'Enter' && createSet()}
              />
              <button
                onClick={createSet}
                className="px-4 py-2 bg-green-600 text-white rounded-apple-button hover:bg-green-700 transition-apple-fast"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewSetForm(false);
                  setNewSetName('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-apple-button hover:bg-gray-600 transition-apple-fast"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {activeSet ? (
        <>
          {/* Analytics Section */}
          <div className="mb-6">
            <SetAnalytics songs={activeSet?.songs || []} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Current Set - Take 2/3 width on large screens */}
            <div className="xl:col-span-2">
              {/* Apple-style Active Set Display */}
              <div className="bg-white rounded-apple shadow-apple overflow-hidden">
                {/* Apple-style panel header */}
                <div className="px-8 pt-8 pb-6 border-b border-light bg-gradient-to-b from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-apple-title-1 text-primary mb-1">
                        {activeSet.name}
                      </h1>
                      <p className="text-apple-body text-secondary">
                        {activeSet.songs ? activeSet.songs.length : 0} songs • 
                        {activeSet.songs ? Math.ceil(activeSet.songs.reduce((total, song) => {
                          const duration = typeof song.duration === 'string' ? 
                            song.duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0) / 60 :
                            song.duration || 0;
                          return total + duration;
                        }, 0)) : 0} minutes total
                      </p>
                    </div>
                    
                    {/* Global Medley Toggle */}
                    {organizedSet.some(item => item.type === 'medley') && (
                      <button
                        onClick={toggleAllMedleys}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                        title={allMedleysCollapsed ? 'Expand all medleys' : 'Collapse all medleys'}
                      >
                        {allMedleysCollapsed ? (
                          <>
                            <span className="text-xs">📋</span>
                            Expand All
                          </>
                        ) : (
                          <>
                            <span className="text-xs">📝</span>
                            Collapse All
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  <span className="inline-flex items-center gap-1.5 bg-blue text-white px-3 py-1.5 rounded-2xl text-xs font-medium mt-4">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    Active Set
                  </span>
                </div>

                {/* Enhanced Set Display with Medley Grouping */}
                <div className="px-8 py-6">
                  {organizedSet && organizedSet.length > 0 ? (
                    <div className="space-y-4">
                      {organizedSet.map((item, index) => (
                        <div key={item.id}>
                          {item.type === 'medley' ? (
                            // Medley Group
                            <div className="bg-purple-50 border border-purple-200 rounded-lg overflow-hidden">
                              {/* Medley Header */}
                              <div className="flex items-center justify-between p-4 bg-purple-100 border-b border-purple-200">
                                <div className="flex items-center space-x-3">
                                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                  <h3 className="font-semibold text-purple-800">{item.name} Medley</h3>
                                  <span className="text-xs text-purple-600 bg-purple-200 px-2 py-1 rounded-full">
                                    {item.songs.length} songs
                                  </span>
                                  
                                  {/* Individual Medley Collapse Toggle */}
                                  <button
                                    onClick={() => toggleMedleyCollapse(item.id)}
                                    className="text-purple-600 hover:text-purple-800 ml-2"
                                    title={collapsedMedleys.has(item.id) ? 'Expand medley' : 'Collapse medley'}
                                  >
                                    {collapsedMedleys.has(item.id) ? '▶' : '▼'}
                                  </button>
                                </div>
                                
                                {/* Medley Reorder Controls */}
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => handleMoveMedley(index, 'top')}
                                    disabled={index === 0}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                                      index === 0 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white text-purple-600 hover:bg-purple-200 hover:scale-105 active:scale-95 shadow-sm'
                                    }`}
                                    title="Move to top"
                                  >
                                    ⤴
                                  </button>
                                  <button
                                    onClick={() => handleMoveMedley(index, 'up')}
                                    disabled={index === 0}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                                      index === 0 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white text-purple-600 hover:bg-purple-200 hover:scale-105 active:scale-95 shadow-sm'
                                    }`}
                                    title="Move up"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    onClick={() => handleMoveMedley(index, 'down')}
                                    disabled={index === organizedSet.length - 1}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                                      index === organizedSet.length - 1 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white text-purple-600 hover:bg-purple-200 hover:scale-105 active:scale-95 shadow-sm'
                                    }`}
                                    title="Move down"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    onClick={() => handleMoveMedley(index, 'bottom')}
                                    disabled={index === organizedSet.length - 1}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                                      index === organizedSet.length - 1 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white text-purple-600 hover:bg-purple-200 hover:scale-105 active:scale-95 shadow-sm'
                                    }`}
                                    title="Move to bottom"
                                  >
                                    ⤵
                                  </button>
                                  <button
                                    onClick={() => handleRemoveMedley(index)}
                                    className="w-7 h-7 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 hover:scale-105 active:scale-95 flex items-center justify-center text-xs transition-all shadow-sm ml-2"
                                    title="Remove entire medley"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                              
                              {/* Medley Songs - Only show if not collapsed */}
                              {!collapsedMedleys.has(item.id) && (
                                <div className="space-y-1 p-4">
                                  {item.songs.map((song, songIndex) => (
                                    <div
                                      key={song.id}
                                      className="group flex items-center justify-between bg-white p-3 rounded-lg border-l-4 border-purple-300 hover:bg-purple-50 transition-colors"
                                    >
                                      <div className="flex items-center space-x-3 flex-1">
                                        <span className="text-xs text-purple-600 w-8 text-center font-mono bg-purple-100 rounded px-1">#{song.medleyPosition || songIndex + 1}</span>
                                        <div className="flex-1">
                                          <div className="text-apple-body text-primary font-medium">{song.title}</div>
                                          <div className="text-apple-callout text-secondary">by {song.artist}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <div className="flex gap-2">
                                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{song.key}</span>
                                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{song.duration}</span>
                                          {song.language && (
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                              {song.language === 'english' ? '🇺🇸' : song.language === 'danish' ? '🇩🇰' : '🌐'}
                                            </span>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => removeSongFromSet(song.id)}
                                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-xs transition-all"
                                          title="Remove this song"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            // Individual Song
                            <div className="group flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center space-x-4 flex-1">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="text-apple-body text-primary font-medium">{item.song.title}</div>
                                  <div className="text-apple-callout text-secondary">by {item.song.artist}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="flex gap-2">
                                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{item.song.key}</span>
                                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{item.song.duration}</span>
                                  {item.song.language && (
                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                      {item.song.language === 'english' ? '🇺🇸' : item.song.language === 'danish' ? '🇩🇰' : '🌐'}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Individual Song Reorder Controls */}
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleMoveItem(index, 'top')}
                                    disabled={index === 0}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                                      index === 0 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white text-gray-600 hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-sm'
                                    }`}
                                    title="Move to top"
                                  >
                                    ⤴
                                  </button>
                                  <button
                                    onClick={() => handleMoveItem(index, 'up')}
                                    disabled={index === 0}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                                      index === 0 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white text-gray-600 hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-sm'
                                    }`}
                                    title="Move up"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    onClick={() => handleMoveItem(index, 'down')}
                                    disabled={index === organizedSet.length - 1}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                                      index === organizedSet.length - 1 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white text-gray-600 hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-sm'
                                    }`}
                                    title="Move down"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    onClick={() => handleMoveItem(index, 'bottom')}
                                    disabled={index === organizedSet.length - 1}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                                      index === organizedSet.length - 1 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white text-gray-600 hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-sm'
                                    }`}
                                    title="Move to bottom"
                                  >
                                    ⤵
                                  </button>
                                  <button
                                    onClick={() => removeSongFromSet(item.song.id)}
                                    className="w-7 h-7 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 hover:scale-105 active:scale-95 flex items-center justify-center text-xs transition-all shadow-sm ml-2"
                                    title="Remove song"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-8 py-12 text-center">
                      <div className="text-3xl opacity-30 mb-4">🎵</div>
                      <h3 className="text-apple-headline text-primary mb-2">No Songs in Set</h3>
                      <p className="text-apple-body text-secondary">Add songs from the available content list</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Set Analytics - Move to Bottom */}
              {activeSet.songs && activeSet.songs.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-apple">
                  <h4 className="font-semibold text-gray-800 mb-3">📊 Set Analytics</h4>
                  <SetAnalytics songs={activeSet?.songs || []} />
                </div>
              )}
            </div>

            {/* Apple-style Available Songs/Medleys - Now Sticky */}
            <div className="sticky top-6 self-start">
              <div className="bg-white rounded-apple shadow-apple overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-light">
                  <h3 className="text-apple-title-3 text-primary">Available Content</h3>
                </div>
                
                <div className="p-6 pb-0">
                  {/* Toggle between Songs and Medleys */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('songs')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          viewMode === 'songs'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-gray-600 hover:text-primary'
                        }`}
                      >
                        Songs ({getFilteredAvailableSongs().length})
                      </button>
                      <button
                        onClick={() => setViewMode('medleys')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          viewMode === 'medleys'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-gray-600 hover:text-primary'
                        }`}
                      >
                        Medleys ({getFilteredAvailableMedleys().length})
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder={`Search ${viewMode}...`}
                      value={availableSongFilters.searchText}
                      onChange={(e) => updateAvailableFilter('searchText', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-none rounded-apple-small text-apple-body text-primary placeholder-gray-500 outline-none focus:bg-gray-200 transition-colors pr-10"
                    />
                    {availableSongFilters.searchText && (
                      <button
                        onClick={() => updateAvailableFilter('searchText', '')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-300 hover:bg-gray-400 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                        title="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="overflow-y-auto" style={{ height: 'calc(100vh - 300px)', minHeight: '300px', maxHeight: '600px' }}>
                  {/* Songs or Medleys List */}
                  {viewMode === 'songs' ? (
                    // Songs view
                    getFilteredAvailableSongs().length > 0 ? (
                      getFilteredAvailableSongs().map((song, index) => (
                        <div
                          key={`available-songs-${song.id}-${index}`}
                          className="px-6 py-3 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                          onClick={async () => {
                            if (!activeSet) {
                              alert('Please select or create a set first');
                              return;
                            }
                            if ((activeSet.songs || []).some(s => s.id === song.id)) {
                              alert(`"${song.title}" is already in this set`);
                              return;
                            }
                            const updatedSet = {
                              ...activeSet,
                              songs: [...(activeSet.songs || []), song]
                            };
                            try {
                              const response = await fetch('/api/sets', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updatedSet)
                              });
                              if (response.ok) {
                                setActiveSet(updatedSet);
                                setSets(prev => prev.map(s => s.id === activeSet.id ? updatedSet : s));
                                console.log('Added song:', song.title);
                              } else {
                                alert('Failed to save set. Please try again.');
                              }
                            } catch (err) {
                              alert('Failed to save set. Please try again.');
                              console.error(err);
                            }
                          }}
                        >
                          <div className="text-apple-body text-primary mb-0.5">
                            {song.title}
                          </div>
                          <div className="text-apple-callout text-secondary">
                            {song.artist} • {song.key} • {song.duration}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center">
                        <div className="text-2xl opacity-30 mb-2">🔍</div>
                        <p className="text-apple-body text-secondary">
                          {availableSongFilters.searchText ? 'No songs found matching your search' : 'No songs available'}
                        </p>
                      </div>
                    )
                  ) : (
                    // Medleys view
                    getFilteredAvailableMedleys().length > 0 ? (
                      getFilteredAvailableMedleys().map((medley, index) => (
                        <div
                          key={`available-medley-${medley.name}-${index}`}
                          className="px-6 py-4 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                          onClick={() => handleAddMedley(medley)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-apple-body text-primary font-medium mb-1">{medley.name}</h4>
                              <p className="text-apple-callout text-secondary mb-2">
                                {medley.songCount} songs • {medley.totalDuration}m total
                              </p>
                              <div className="flex gap-2 mb-2">
                                {medley.languages.length > 0 && (
                                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                    {medley.languages.join(', ')}
                                  </span>
                                )}
                                {medley.vocalists.length > 0 && (
                                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                    {medley.vocalists.join(', ')}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {medley.songs.map(song => song.title).join(' • ')}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent double-click
                                handleAddMedley(medley);
                              }}
                              className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                            >
                              Add Medley
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center">
                        <div className="text-2xl opacity-30 mb-2">🎼</div>
                        <p className="text-apple-body text-secondary">
                          {availableSongFilters.searchText ? 'No medleys found matching your search' : 'No medleys available'}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="px-8 py-20 text-center bg-white rounded-apple shadow-apple">
          <div className="text-5xl opacity-30 mb-4">📋</div>
          <h3 className="text-apple-headline text-primary mb-2">No Active Set Selected</h3>
          <p className="text-apple-body text-secondary">Please select a set from the list above or create a new one</p>
        </div>
      )}
    </>
  );
}