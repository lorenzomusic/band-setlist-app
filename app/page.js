"use client";

import { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import SongList from '../components/SongList';
import AddSongForm from '../components/AddSongForm';
import SetListBuilder from '../components/SetListBuilder';
import PerformanceView from '../components/PerformanceView';
import PDFGenerator from '../components/PDFGenerator';
import SetBuilder from '../components/SetBuilder';
import GigBuilder from '../components/GigBuilder';
import GigPerformanceView from '../components/GigPerformanceView';
import EditSongForm from '../components/EditSongForm';
import TagInput from '../components/TagInput';

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('songs');
  const [selectedSetlist, setSelectedSetlist] = useState(null);
  const [selectedGig, setSelectedGig] = useState(null);
  const [performanceSet, setPerformanceSet] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    searchText: '',
    language: 'all',
    key: 'all',
    bassType: 'all',
    guitarType: 'all',
    backingTrack: 'all',
    vocalist: 'all',
    selectedTags: []
  });

  const getLanguageFlag = (language) => {
    return language === 'danish' ? '🇩🇰' : '🇬🇧';
  };

  // Load songs and gigs
  useEffect(() => {
    loadSongs();
    loadGigs();
  }, []);

  const loadSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      const data = await response.json();
      setSongs(data);
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  const loadGigs = async () => {
    try {
      const response = await fetch('/api/gigs');
      if (response.ok) {
        const data = await response.json();
        setGigs(data);
        if (data.length > 0) {
          setSelectedGig(data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSongAdded = (newSong) => {
    setSongs(prev => [...prev, newSong]);
  };

  const handleEditSong = (song) => {
    setEditingSong(song);
  };

  const handleSongUpdated = (updatedSong) => {
    setSongs(prev => prev.map(song => 
      song.id === updatedSong.id ? updatedSong : song
    ));
    setEditingSong(null);
  };

  const handleCancelEdit = () => {
    setEditingSong(null);
  };

  const handleDeleteSong = async (songId, songTitle) => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${songTitle}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/songs?id=${songId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the song from the local state
        setSongs(prev => prev.filter(song => song.id !== songId));
        alert(`"${songTitle}" has been deleted successfully.`);
      } else {
        const error = await response.json();
        alert(`Failed to delete song: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Error deleting song. Please try again.');
    }
  };

  const handleSongDeleted = (deletedSongId) => {
    setSongs(prev => prev.filter(song => song.id !== deletedSongId));
    setEditingSong(null); // Close the edit form
  };

  const getFilteredSongs = () => {
    return songs.filter(song => {
      const searchTextMatch = !searchFilters.searchText || 
        song.title.toLowerCase().includes(searchFilters.searchText.toLowerCase()) ||
        (song.artist && song.artist.toLowerCase().includes(searchFilters.searchText.toLowerCase()));

      const languageMatch = searchFilters.language === 'all' || 
        song.language === searchFilters.language;

      const keyMatch = searchFilters.key === 'all' || 
        song.key === searchFilters.key;

      const bassMatch = searchFilters.bassType === 'all' || 
        song.bassGuitar === searchFilters.bassType;

      const guitarMatch = searchFilters.guitarType === 'all' || 
        song.guitar === searchFilters.guitarType;

      const backingTrackMatch = searchFilters.backingTrack === 'all' || 
        (searchFilters.backingTrack === 'yes' && song.backingTrack) ||
        (searchFilters.backingTrack === 'no' && !song.backingTrack);

      // Add vocalist filter
      const vocalistMatch = searchFilters.vocalist === 'all' || 
        song.vocalist === searchFilters.vocalist;

      // Add tag filter
      const matchesTags = !searchFilters.selectedTags || searchFilters.selectedTags.length === 0 ||
        searchFilters.selectedTags.some(tag => song.tags && song.tags.includes(tag));

      return searchTextMatch && languageMatch && keyMatch && bassMatch && guitarMatch && backingTrackMatch && vocalistMatch && matchesTags;
    });
  };

  const updateFilter = (filterKey, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleTagChange = (newTags) => {
    setSearchFilters(prev => ({
      ...prev,
      selectedTags: newTags
    }));
  };

  const clearAllFilters = () => {
    setSearchFilters({
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

  // Add tab change handler with state reset
  const handleTabChange = (newTab) => {
    console.log('Switching to tab:', newTab);
    
    // Reset performance state when switching away from performance
    if (activeTab === 'performance' && newTab !== 'performance') {
      console.log('Clearing performance state when leaving performance tab');
      setSelectedGig(null);
      setPerformanceSet(null);
    }
    
    // Reset performance state when entering performance tab
    if (newTab === 'performance') {
      console.log('Entering performance tab - resetting state');
      setSelectedGig(null);
      setPerformanceSet(null);
    }
    
    setActiveTab(newTab);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-black mb-8 text-center text-gray-900">🎵 Greatest Gig</h1>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => handleTabChange('songs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'songs'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Songs
          </button>
          <button
            onClick={() => handleTabChange('setbuilder')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'setbuilder'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Set Builder
          </button>
          <button
            onClick={() => handleTabChange('gigbuilder')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'gigbuilder'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Gig Builder
          </button>
          <button
            onClick={() => handleTabChange('ai-setlist')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'ai-setlist'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Bot className="w-4 h-4" />
            AI Setlist Builder
          </button>
          <button
            onClick={() => handleTabChange('performance')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'performance'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-200 dark:text-gray-700 dark:hover:bg-gray-300'
            }`}
          >
            Performance
          </button>
        </div>

        {loading ? (
          <p className="text-center">Loading... 🎵</p>
        ) : (
          <>
            {activeTab === 'songs' && (
              <div>
                {editingSong ? (
                  <EditSongForm 
                    song={editingSong}
                    onSongUpdated={handleSongUpdated}
                    onCancel={handleCancelEdit}
                    onSongDeleted={handleSongDeleted}
                  />
                ) : (
                  <>
                    <AddSongForm onSongAdded={handleSongAdded} />

                    {/* Search & Filter Component */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-l-4 border-purple-500">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                          🔍 Search & Filter Songs
                        </h2>
                        {(searchFilters.searchText || Object.values(searchFilters).some(value => value !== 'all' && value !== '')) && (
                          <button
                            onClick={clearAllFilters}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            ✕ Clear Filters
                          </button>
                        )}
                      </div>

                      {/* Search Bar */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🎵 Search Songs
                        </label>
                        <input
                          type="text"
                          value={searchFilters.searchText}
                          onChange={(e) => updateFilter('searchText', e.target.value)}
                          placeholder="Search by song title or artist..."
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                        />
                      </div>

                      {/* Filter Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {/* Language Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                          <select
                            value={searchFilters.language}
                            onChange={(e) => updateFilter('language', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="all">🌍 All Languages</option>
                            <option value="english">🇬🇧 English</option>
                            <option value="danish">🇩🇰 Danish</option>
                          </select>
                        </div>

                        {/* Key Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                          <select
                            value={searchFilters.key}
                            onChange={(e) => updateFilter('key', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="all">🎹 All Keys</option>
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
                            <option value="Am">Am</option>
                            <option value="Bm">Bm</option>
                            <option value="Cm">Cm</option>
                            <option value="Dm">Dm</option>
                            <option value="Em">Em</option>
                            <option value="Fm">Fm</option>
                            <option value="Gm">Gm</option>
                          </select>
                        </div>

                        {/* Bass Type Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bass Guitar</label>
                          <select
                            value={searchFilters.bassType}
                            onChange={(e) => updateFilter('bassType', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="all">🎸 All Bass Types</option>
                            <option value="4-string">4-string</option>
                            <option value="5-string">5-string</option>
                            <option value="synth bass">Synth bass</option>
                          </select>
                        </div>

                        {/* Guitar Type Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Guitar</label>
                          <select
                            value={searchFilters.guitarType}
                            onChange={(e) => updateFilter('guitarType', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="all">🎸 All Guitar Types</option>
                            <option value="Electric">Electric</option>
                            <option value="Acoustic">Acoustic</option>
                            <option value="12-string">12-string</option>
                            <option value="Classical">Classical</option>
                          </select>
                        </div>

                        {/* Backing Track Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Backing Track</label>
                          <select
                            value={searchFilters.backingTrack}
                            onChange={(e) => updateFilter('backingTrack', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="all">🎵 All Songs</option>
                            <option value="yes">✅ Has Backing Track</option>
                            <option value="no">❌ No Backing Track</option>
                          </select>
                        </div>

                        {/* Vocalist Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vocalist</label>
                          <select
                            value={searchFilters.vocalist}
                            onChange={(e) => updateFilter('vocalist', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="all">🎤 All Vocalists</option>
                            <option value="Rikke">🎤 Rikke</option>
                            <option value="Lorentz">🎤 Lorentz</option>
                            <option value="Both">🎤🎤 Both</option>
                          </select>
                        </div>
                      </div>

                      {/* Tag Filter */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🏷️ Filter by Tags
                        </label>
                        <TagInput
                          tags={searchFilters.selectedTags}
                          onChange={handleTagChange}
                          placeholder="Add tags to filter songs..."
                        />
                      </div>

                      {/* Results Summary */}
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                        <span className="text-purple-800 font-medium">
                          📊 Showing {getFilteredSongs().length} of {songs.length} songs
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="grid gap-6">
                        {getFilteredSongs().map((song, index) => (
                          <div key={`song-${song.id || index}`} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="flex items-center gap-3">
                                  <h2 className="text-2xl font-bold text-gray-800">{song.title}</h2>
                                  <span className="text-2xl">{getLanguageFlag(song.language)}</span>
                                </div>
                                {song.artist && (
                                  <p className="text-lg text-gray-700 font-medium">by {song.artist}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                                  Key: {song.key}
                                </span>
                              </div>
                            </div>
                            {song.medley && (
                              <p className="text-sm text-purple-600 font-medium mt-1">
                                🎼 {song.medley} - Part {song.medleyPosition}
                              </p>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                              <div className="bg-gray-50 p-3 rounded">
                                <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Duration</span>
                                <p className="text-gray-800 font-semibold">{song.duration}</p>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Bass Guitar</span>
                                <p className="text-gray-800 font-semibold">{song.bassGuitar}</p>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Guitar</span>
                                <p className="text-gray-800 font-semibold">{song.guitar}</p>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Language</span>
                                <p className="text-gray-800 font-semibold flex items-center gap-1">
                                  {getLanguageFlag(song.language)} {song.language === 'danish' ? 'Danish' : 'English'}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Vocalist</span>
                                <p className="text-gray-800 font-semibold">
                                  {song.vocalist === 'Both' ? '🎤🎤 Both' : `🎤 ${song.vocalist}`}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-3 rounded">
                                <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Backing Track</span>
                                <p className="text-gray-800 font-semibold">
                                  {song.backingTrack ? '✅ Yes' : '❌ No'}
                                </p>
                              </div>
                            </div>
                            
                            {song.form && (
                              <div className="mb-4">
                                <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Song Form</span>
                                <p className="text-gray-800 mt-1 text-sm bg-yellow-50 p-2 rounded">{song.form}</p>
                              </div>
                            )}
                            
                            {song.notes && (
                              <div className="mb-4">
                                <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Notes</span>
                                <p className="text-gray-800 mt-1 text-sm italic bg-green-50 p-2 rounded">{song.notes}</p>
                              </div>
                            )}
                            
                            {song.tags && song.tags.length > 0 && (
                              <div className="mb-4">
                                <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Tags</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {song.tags.map((tag, tagIndex) => (
                                    <span
                                      key={`${song.id || index}-tag-${tagIndex}`}
                                      className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex gap-3 items-center">
                              {song.youtubeLink && (
                                <a 
                                  href={song.youtubeLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                  🎵 Listen on YouTube
                                </a>
                              )}
                              <button
                                onClick={() => handleEditSong(song)}
                                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                ✏️ Edit Song
                              </button>
                              <button
                                onClick={() => handleDeleteSong(song.id, song.title)}
                                className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'setbuilder' && (
              <SetBuilder songs={songs} />
            )}

            {activeTab === 'gigbuilder' && (
              <GigBuilder songs={songs} />
            )}

            {activeTab === 'ai-setlist' && (
              <div className="min-h-screen">
                <iframe 
                  src="/ai-setlist" 
                  className="w-full h-screen border-0"
                  title="AI Setlist Builder"
                />
              </div>
            )}
           
            {activeTab === 'performance' && (
              <div>
                {selectedGig ? (
                  // Show selected gig performance
                  <GigPerformanceView 
                    gig={selectedGig} 
                    onBack={() => {
                      setSelectedGig(null);
                      setPerformanceSet(null);
                    }}
                  />
                ) : performanceSet ? (
                  // Show individual set performance
                  <div className="min-h-screen bg-gray-900 text-white rounded-lg">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h1 className="text-3xl font-bold">{performanceSet.name}</h1>
                          <p className="text-gray-300">Individual Set Performance</p>
                        </div>
                        <button
                          onClick={() => setPerformanceSet(null)}
                          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          ← Back to Selection
                        </button>
                      </div>
                      
                      <div className="space-y-1">
                        {performanceSet.songs?.map((song, index) => (
                          <div key={`perf-song-${song.id || index}`} className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-xl font-bold text-white">{song.title}</h3>
                                <p className="text-gray-300">{song.artist}</p>
                                
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                  {song.key && <span>Key: {song.key}</span>}
                                  {song.duration && <span>⏱️ {song.duration}</span>}
                                  <span>🎸 Bass: {song.bassGuitar}</span>
                                  <span>🎸 Guitar: {song.guitar}</span>
                                  {song.language === 'danish' && <span>🇩🇰 Danish</span>}
                                  {song.language === 'english' && <span>🇬🇧 English</span>}
                                  <span>🎤 {song.vocalist}</span>
                                  {song.backingTrack && <span>🎵 Backing Track</span>}
                                </div>
                                
                                {song.tags && song.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {song.tags.map((tag, tagIndex) => (
                                      <span
                                        key={`perf-tag-${song.id || index}-${tagIndex}`}
                                        className="inline-flex items-center px-2 py-1 bg-purple-600 text-purple-100 text-xs rounded-full"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                {song.notes && (
                                  <div className="mt-2 p-2 bg-gray-700 rounded">
                                    <p className="text-yellow-300 text-sm">{song.notes}</p>
                                  </div>
                                )}
                              </div>
                              
                              {song.youtubeLink && (
                                <a
                                  href={song.youtubeLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                  YouTube
                                </a>
                              )}
                            </div>
                          </div>
                        )) || <p className="text-gray-400">No songs in this set</p>}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Show selection screen - PerformanceView with callbacks
                  <PerformanceView 
                    songs={songs}
                    onSetSelect={(set) => {
                      console.log('Set selected for performance:', set.name);
                      setPerformanceSet(set);
                      setSelectedGig(null);
                    }}
                    onGigSelect={(gig) => {
                      console.log('Gig selected for performance:', gig.name);
                      setSelectedGig(gig);
                      setPerformanceSet(null);
                    }}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}