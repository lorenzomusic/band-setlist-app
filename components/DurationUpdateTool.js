"use client";

import { useState } from 'react';

export default function DurationUpdateTool({ songs, onSongsUpdated }) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [updateMode, setUpdateMode] = useState('missing'); // 'missing' or 'all'

  // Check if duration is valid (MM:SS format)
  const isValidDuration = (duration) => {
    if (!duration) return false;
    const mmssPattern = /^\d{1,2}:\d{2}$/;
    return mmssPattern.test(duration.toString());
  };

  // Count songs that need updates
  const getSongsNeedingUpdate = () => {
    if (updateMode === 'all') return songs;
    return songs.filter(song => !isValidDuration(song.duration));
  };

  const songsToUpdate = getSongsNeedingUpdate();

  // Search for single song duration using iTunes API (free, no auth needed)
  const searchSongDuration = async (song) => {
    try {
      const query = encodeURIComponent(`${song.title} ${song.artist}`);
      const response = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=1`);
      
      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const track = data.results[0];
        const durationMs = track.trackTimeMillis;
        
        if (durationMs) {
          const totalSeconds = Math.floor(durationMs / 1000);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          
          return {
            success: true,
            duration: formattedDuration,
            source: 'iTunes',
            foundTitle: track.trackName,
            foundArtist: track.artistName
          };
        }
      }
      
      return { success: false, error: 'No results found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Update song duration in database
  const updateSongInDatabase = async (songId, duration) => {
    try {
      const songToUpdate = songs.find(s => s.id === songId);
      if (!songToUpdate) throw new Error('Song not found');

      const updatedSong = { ...songToUpdate, duration };
      
      const response = await fetch('/api/songs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSong)
      });

      if (!response.ok) throw new Error('Failed to update song');
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  // Main update process
  const startDurationUpdate = async () => {
    setIsRunning(true);
    setResults([]);
    setShowResults(true);
    
    const updateResults = [];
    const total = songsToUpdate.length;
    
    setProgress({ current: 0, total });

    for (let i = 0; i < songsToUpdate.length; i++) {
      const song = songsToUpdate[i];
      
      setProgress({ current: i + 1, total });
      
      const result = {
        song: song,
        originalDuration: song.duration,
        success: false,
        error: null,
        newDuration: null,
        source: null
      };

      try {
        // Search for duration
        const searchResult = await searchSongDuration(song);
        
        if (searchResult.success) {
          // Update in database
          await updateSongInDatabase(song.id, searchResult.duration);
          
          result.success = true;
          result.newDuration = searchResult.duration;
          result.source = searchResult.source;
          result.foundTitle = searchResult.foundTitle;
          result.foundArtist = searchResult.foundArtist;
        } else {
          result.error = searchResult.error;
        }
      } catch (error) {
        result.error = error.message;
      }

      updateResults.push(result);
      setResults([...updateResults]);

      // Rate limiting - wait between requests
      if (i < songsToUpdate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsRunning(false);
    
    // Refresh songs list if any updates were successful
    const successfulUpdates = updateResults.filter(r => r.success);
    if (successfulUpdates.length > 0 && onSongsUpdated) {
      onSongsUpdated();
    }
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <div className="bg-white rounded-apple shadow-apple overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-light">
        <h3 className="text-apple-title-3 text-primary">🎵 Duration Update Tool</h3>
        <p className="text-apple-body text-secondary mt-1">
          Automatically fetch song durations from iTunes database
        </p>
      </div>

      <div className="p-6">
        {/* Update Mode Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Update Mode</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="missing"
                checked={updateMode === 'missing'}
                onChange={(e) => setUpdateMode(e.target.value)}
                disabled={isRunning}
                className="mr-2"
              />
              <span className="text-sm">
                Only songs missing durations ({songs.filter(s => !isValidDuration(s.duration)).length} songs)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="all"
                checked={updateMode === 'all'}
                onChange={(e) => setUpdateMode(e.target.value)}
                disabled={isRunning}
                className="mr-2"
              />
              <span className="text-sm">All songs ({songs.length} songs)</span>
            </label>
          </div>
        </div>

        {/* Status and Controls */}
        <div className="mb-6">
          {!isRunning ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Ready to update {songsToUpdate.length} songs
              </div>
              <button
                onClick={startDurationUpdate}
                disabled={songsToUpdate.length === 0}
                className={`px-6 py-3 rounded-apple-button font-medium transition-apple-fast ${
                  songsToUpdate.length === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue text-white hover:bg-blue-700'
                }`}
              >
                {songsToUpdate.length === 0 ? 'No Songs to Update' : `🚀 Start Duration Update`}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Processing song {progress.current} of {progress.total}...
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                Please wait... This may take a few minutes.
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {showResults && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">Update Results</h4>
              {!isRunning && (
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">✅ Success: {successCount}</span>
                  <span className="text-red-600">❌ Failed: {failCount}</span>
                </div>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div 
                  key={`${result.song.id}-${index}`}
                  className={`p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {result.song.title} - {result.song.artist}
                      </div>
                      {result.success ? (
                        <div className="text-xs text-green-700 mt-1">
                          Duration updated: {result.originalDuration || 'None'} → {result.newDuration}
                          <div className="text-gray-600">
                            Found: "{result.foundTitle}" by {result.foundArtist} ({result.source})
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-red-700 mt-1">
                          Failed: {result.error}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {result.success ? (
                        <span className="text-green-600 text-xl">✅</span>
                      ) : (
                        <span className="text-red-600 text-xl">❌</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!isRunning && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowResults(false)}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Hide Results
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">ℹ️ How it works</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Searches iTunes database for accurate song durations</li>
            <li>• Automatically updates your song database</li>
            <li>• Rate-limited to be respectful to the API</li>
            <li>• Shows confidence by displaying the matched song details</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 