"use client";

import { useState, useEffect } from 'react';
import InstrumentChangeIndicator from './InstrumentChangeIndicator';

export default function PerformanceView({ songs, onSetSelect, onGigSelect }) {
  const [gigs, setGigs] = useState([]);
  const [sets, setSets] = useState([]);
  const [selectedGig, setSelectedGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('gigs');

  useEffect(() => {
    loadData();
  }, []);

  // Reset selection when component mounts or props change
  useEffect(() => {
    setSelectedGig(null);
    setError(null);
  }, [onSetSelect, onGigSelect]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [gigsResponse, setsResponse] = await Promise.all([
        fetch('/api/gigs'),
        fetch('/api/sets')
      ]);
      
      if (!gigsResponse.ok || !setsResponse.ok) {
        throw new Error('Failed to load data');
      }
      
      const gigsData = await gigsResponse.json();
      const setsData = await setsResponse.json();
      
      // Filter valid gigs
      const validGigs = (gigsData || []).filter(gig => {
        const hasValidSets = gig.sets && Array.isArray(gig.sets) && gig.sets.length > 0;
        const setsHaveSongs = gig.sets?.some(set => set.songs && Array.isArray(set.songs) && set.songs.length > 0);
        return hasValidSets && setsHaveSongs;
      });
      
      // Filter valid sets
      const validSets = (setsData || []).filter(set => 
        set.songs && Array.isArray(set.songs) && set.songs.length > 0
      );
      
      setGigs(validGigs);
      setSets(validSets);
      setSelectedGig(null);
      
      if (validGigs.length === 0 && validSets.length === 0) {
        setError('No gigs or sets available for performance. Create some sets with songs first.');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const selectGig = (gig) => {
    // Validate gig has required data
    if (!gig || !gig.sets || !Array.isArray(gig.sets) || gig.sets.length === 0) {
      setError('This gig has no sets available for performance');
      return;
    }
    
    // Check if sets have songs
    const setsWithSongs = gig.sets.filter(set => set.songs && Array.isArray(set.songs) && set.songs.length > 0);
    if (setsWithSongs.length === 0) {
      setError('This gig has no sets with songs available for performance');
      return;
    }
    
    // Use callback if provided, otherwise set local state
    if (onGigSelect) {
      onGigSelect(gig);
    } else {
      setSelectedGig(gig);
    }
    setError(null);
  };

  const selectSet = (set) => {
    if (!set || !set.songs || !Array.isArray(set.songs) || set.songs.length === 0) {
      setError('This set has no songs available for performance');
      return;
    }
    
    if (onSetSelect) {
      onSetSelect(set);
    }
    setError(null);
  };

  const backToSelection = () => {
    setSelectedGig(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-600">Loading performance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Performance Error</h3>
          <p className="text-red-700 mt-1">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadData();
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show selection screen unless a gig is explicitly selected
  if (!selectedGig) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">🎭 Performance Mode</h1>
        
        {/* View Mode Toggle */}
        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('gigs')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'gigs'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎪 Full Gigs ({gigs.length})
          </button>
          <button
            onClick={() => setViewMode('sets')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'sets'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎵 Individual Sets ({sets.length})
          </button>
        </div>
        
        {viewMode === 'gigs' ? (
          // Gigs View
          <>
            {gigs.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-yellow-800 font-medium mb-2">No Gigs Ready for Performance</h3>
                  <p className="text-yellow-700">
                    To perform gigs, you need gigs that contain sets with songs.
                  </p>
                  <div className="mt-4 text-sm text-yellow-600">
                    <p>1. Create sets with songs in SetBuilder</p>
                    <p>2. Create gigs with those sets in GigBuilder</p>
                    <p>3. Return here to perform complete gigs</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-6">Select a gig to perform:</p>
                <div className="grid gap-4">
                  {gigs.map((gig, index) => {
                    const totalSongs = gig.sets?.reduce((total, set) => total + (set.songs?.length || 0), 0) || 0;
                    const totalDuration = gig.sets?.reduce((total, set) => {
                      return total + (set.songs?.reduce((setTotal, song) => {
                        const [min, sec] = (song.duration || '0:00').split(':').map(Number);
                        return setTotal + (min * 60 + sec);
                      }, 0) || 0);
                    }, 0) || 0;
                    
                    const hours = Math.floor(totalDuration / 3600);
                    const minutes = Math.floor((totalDuration % 3600) / 60);
                    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                    
                    return (
                      <div key={`gig-${gig.id || index}`} className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{gig.name}</h3>
                            <p className="text-gray-600 text-sm mt-1">
                              {gig.sets?.length || 0} sets • {totalSongs} songs • ~{durationText}
                            </p>
                            {gig.sets && gig.sets.length > 0 && (
                              <div className="mt-2 text-sm text-gray-700">
                                <strong>Sets:</strong> {gig.sets.map((set, setIndex) => 
                                  `${set.name} (${set.songs?.length || 0} songs)`
                                ).join(', ')}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => selectGig(gig)}
                            className="ml-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                          >
                            🎭 Perform This Gig
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          // Individual Sets View
          <>
            {sets.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-yellow-800 font-medium mb-2">No Sets Ready for Performance</h3>
                  <p className="text-yellow-700">
                    To perform individual sets, you need sets with songs.
                  </p>
                  <div className="mt-4 text-sm text-yellow-600">
                    <p>1. Create sets with songs in SetBuilder</p>
                    <p>2. Return here to perform individual sets</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-6">Select an individual set to perform:</p>
                <div className="grid gap-4">
                  {sets.map((set, index) => {
                    const totalDuration = set.songs?.reduce((total, song) => {
                      const [min, sec] = (song.duration || '0:00').split(':').map(Number);
                      return total + (min * 60 + sec);
                    }, 0) || 0;
                    
                    const minutes = Math.floor(totalDuration / 60);
                    const seconds = totalDuration % 60;
                    const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    
                    return (
                      <div key={`set-${set.id || index}`} className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{set.name}</h3>
                            <p className="text-gray-600 text-sm mt-1">
                              {set.songs?.length || 0} songs • {durationText}
                            </p>
                            {set.songs && set.songs.length > 0 && (
                              <div className="mt-2 text-sm text-gray-700">
                                <strong>Songs:</strong> {set.songs.slice(0, 3).map(song => song.title).join(', ')}
                                {set.songs.length > 3 && ` + ${set.songs.length - 3} more`}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => selectSet(set)}
                            className="ml-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            🎵 Perform This Set
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // Performance Mode - Only reached if selectedGig is set
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{selectedGig.name}</h1>
            <p className="text-gray-300">
              {selectedGig.sets?.length || 0} sets • Performance Mode
            </p>
          </div>
          <button
            onClick={backToSelection}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            ← Back to Selection
          </button>
        </div>

        {/* Sets Display */}
        {selectedGig.sets && selectedGig.sets.length > 0 ? (
          selectedGig.sets.map((set, setIndex) => (
            <div key={`set-${set.id || setIndex}`} className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
                Set {setIndex + 1}: {set.name}
              </h2>
              
              {set.songs && set.songs.length > 0 ? (
                <div className="space-y-1">
                  {set.songs.map((song, songIndex) => {
                    let previousSong = null;
                    if (songIndex > 0) {
                      previousSong = set.songs[songIndex - 1];
                    } else if (setIndex > 0) {
                      const previousSet = selectedGig.sets[setIndex - 1];
                      if (previousSet.songs && previousSet.songs.length > 0) {
                        previousSong = previousSet.songs[previousSet.songs.length - 1];
                      }
                    }

                    return (
                      <div key={`song-${song.id || songIndex}`}>
                        {previousSong && (
                          <div className="my-3">
                            <InstrumentChangeIndicator 
                              previousSong={previousSong} 
                              currentSong={song} 
                            />
                          </div>
                        )}
                        
                        <div className="bg-gray-800 p-4 rounded-lg">
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
                                {song.vocalist && <span>🎤 {song.vocalist}</span>}
                                {song.backingTrack && <span>🎵 Backing Track</span>}
                              </div>
                              
                              {song.tags && song.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {song.tags.map((tag, tagIndex) => (
                                    <span
                                      key={`${song.id || songIndex}-tag-${tagIndex}`}
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
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-400 italic">This set has no songs</div>
              )}
            </div>
          ))
        ) : (
          <div className="text-gray-400 italic">This gig has no sets</div>
        )}
      </div>
    </div>
  );
}