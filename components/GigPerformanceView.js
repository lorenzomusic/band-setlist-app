"use client";

import { useState, useEffect } from 'react';
import InstrumentChangeIndicator from './InstrumentChangeIndicator';

export default function GigPerformanceView({ gig }) {
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('large');
  const [showAllSongs, setShowAllSongs] = useState(false);

  // Get all songs flattened from all sets
  const getAllSongs = () => {
    const allSongs = [];
    gig.sets.forEach((set, setIdx) => {
      set.songs.forEach((song, songIdx) => {
        allSongs.push({
          ...song,
          setIndex: setIdx,
          songIndex: songIdx,
          setName: set.name,
          globalIndex: allSongs.length
        });
      });
    });
    return allSongs;
  };

  const allSongs = getAllSongs();
  const currentSet = gig.sets[currentSetIndex];
  const currentSong = currentSet?.songs[currentSongIndex];

  // Navigation functions
  const nextSong = () => {
    if (!currentSet) return;
    
    if (currentSongIndex < currentSet.songs.length - 1) {
      // Next song in current set
      setCurrentSongIndex(currentSongIndex + 1);
    } else if (currentSetIndex < gig.sets.length - 1) {
      // Next set
      setCurrentSetIndex(currentSetIndex + 1);
      setCurrentSongIndex(0);
    }
  };

  const prevSong = () => {
    if (currentSongIndex > 0) {
      // Previous song in current set
      setCurrentSongIndex(currentSongIndex - 1);
    } else if (currentSetIndex > 0) {
      // Previous set, last song
      setCurrentSetIndex(currentSetIndex - 1);
      setCurrentSongIndex(gig.sets[currentSetIndex - 1].songs.length - 1);
    }
  };

  const goToSet = (setIndex) => {
    setCurrentSetIndex(setIndex);
    setCurrentSongIndex(0);
  };

  const goToSong = (setIndex, songIndex) => {
    setCurrentSetIndex(setIndex);
    setCurrentSongIndex(songIndex);
  };

  // Calculate progress
  const getCurrentGlobalSongIndex = () => {
    let count = 0;
    for (let i = 0; i < currentSetIndex; i++) {
      count += gig.sets[i].songs.length;
    }
    return count + currentSongIndex;
  };

  const getTotalSongs = () => {
    return gig.sets.reduce((total, set) => total + set.songs.length, 0);
  };

  // Calculate durations
  const calculateSetDuration = (set) => {
    const totalMinutes = set.songs.reduce((total, song) => {
      if (song.duration) {
        const [minutes, seconds] = song.duration.split(':').map(Number);
        return total + minutes + (seconds / 60);
      }
      return total;
    }, 0);
    return Math.round(totalMinutes);
  };

  const isAtSetEnd = currentSongIndex === currentSet?.songs.length - 1;
  const isLastSet = currentSetIndex === gig.sets.length - 1;
  const isGigEnd = isAtSetEnd && isLastSet;

  const fontSizeClasses = {
    small: 'text-xl md:text-2xl',
    medium: 'text-2xl md:text-4xl',
    large: 'text-3xl md:text-5xl',
    xl: 'text-4xl md:text-6xl'
  };

  if (!currentSong) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">No songs in this gig</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${
      darkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      {/* Header Controls */}
      <div className={`p-4 border-b ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{gig.name}</h1>
            <div className="text-sm font-bold text-gray-800">
              <p>Set {currentSetIndex + 1} of {gig.sets.length}: {currentSet.name}</p>
              <p>Song {currentSongIndex + 1} of {currentSet.songs.length} in set | Overall {getCurrentGlobalSongIndex() + 1} of {getTotalSongs()}</p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {/* View Toggle */}
            <button
              onClick={() => setShowAllSongs(!showAllSongs)}
              className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${
                showAllSongs
                  ? darkMode
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-blue-600 border-blue-500 text-white'
                  : darkMode
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'
              }`}
            >
              {showAllSongs ? '🎵 Current' : '📋 All Songs'}
            </button>

            {/* Font Size */}
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className={`px-3 py-1 rounded border-2 text-sm font-bold ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-400 text-gray-900'
              }`}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xl">XL</option>
            </select>

            {/* Dark Mode */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-3 py-1 rounded border text-sm font-medium transition-colors ${
                darkMode
                  ? 'bg-yellow-600 border-yellow-500 text-white hover:bg-yellow-700'
                  : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-900'
              }`}
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Performance Area */}
      <div className="max-w-6xl mx-auto p-6">
        {showAllSongs ? (
          /* All Songs View */
          <div>
            <h2 className="text-3xl font-black mb-6 text-center text-gray-900">Complete Gig Overview</h2>
            {gig.sets.map((set, setIdx) => (
              <div key={`set-${setIdx}`} className={`mb-8 p-4 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-xl font-black ${
                    setIdx === currentSetIndex ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    Set {setIdx + 1}: {set.name}
                  </h3>
                  <p className="text-sm opacity-75">
                    {set.songs.length} songs, {calculateSetDuration(set)} min
                  </p>
                </div>
                
                <div className="grid gap-2">
                  {set.songs.map((song, songIdx) => {
                    // Check for instrument changes from previous song (even across sets)
                    let previousSong = null;
                    if (songIdx > 0) {
                      previousSong = set.songs[songIdx - 1];
                    } else if (setIdx > 0) {
                      const previousSet = gig.sets[setIdx - 1];
                      if (previousSet.songs && previousSet.songs.length > 0) {
                        previousSong = previousSet.songs[previousSet.songs.length - 1];
                      }
                    }

                    return (
                      <div key={`${setIdx}-${songIdx}`}>
                        {/* Instrument Change Indicator */}
                        {previousSong && (
                          <div className="my-2">
                            <InstrumentChangeIndicator 
                              previousSong={previousSong} 
                              currentSong={song} 
                            />
                          </div>
                        )}
                        
                        {/* Song Display */}
                        <div
                          onClick={() => goToSong(setIdx, songIdx)}
                          className={`p-3 rounded cursor-pointer transition-colors ${
                            setIdx === currentSetIndex && songIdx === currentSongIndex
                              ? darkMode
                                ? 'bg-red-700 border-2 border-red-500'
                                : 'bg-red-100 border-2 border-red-500'
                              : darkMode
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {songIdx + 1}. {song.title}
                            </span>
                            <span className="text-sm opacity-75">
                              {song.key} | {song.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {setIdx < gig.sets.length - 1 && (
                  <div className="mt-4 py-2 text-center border-t border-dashed border-gray-400">
                    <p className="text-sm opacity-75 italic">☕ Break (15-20 minutes)</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Current Song View */
          <div>
            {/* Set Progress */}
            <div className="text-center mb-4">
              <div className="flex justify-center gap-2 mb-2">
                {gig.sets.map((set, idx) => (
                  <button
                    key={`nav-set-${idx}`}
                    onClick={() => goToSet(idx)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      idx === currentSetIndex
                        ? 'bg-red-600 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Set {idx + 1}
                  </button>
                ))}
              </div>
              <p className="text-sm opacity-75">
                Current: Set {currentSetIndex + 1} - {currentSet.name}
              </p>
            </div>

            {/* Current Song Display */}
            <div className="text-center mb-8">
              <div>
                <div className={`${fontSizeClasses[fontSize]} font-bold mb-2`}>
                  {currentSong.title}
                </div>
                {currentSong.artist && (
                  <div className={`${fontSize === 'xl' ? 'text-2xl' : 'text-xl'} text-gray-600 mb-4`}>
                    by {currentSong.artist}
                  </div>
                )}
              </div>
              
              {currentSong.medley && (
                <div className={`${fontSize === 'xl' ? 'text-2xl' : 'text-xl'} text-purple-400 mb-4`}>
                  🎼 {currentSong.medley} - Part {currentSong.medleyPosition}
                </div>
              )}

              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 ${
                fontSize === 'xl' ? 'text-lg' : 'text-base'
              }`}>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="font-medium opacity-75">Key</div>
                  <div className="text-2xl font-bold text-blue-400">{currentSong.key}</div>
                </div>
                
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="font-medium opacity-75">Duration</div>
                  <div className="text-2xl font-bold">{currentSong.duration}</div>
                </div>
                
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="font-medium opacity-75">Bass</div>
                  <div className="text-xl font-bold text-green-400">{currentSong.bassGuitar}</div>
                </div>
                
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="font-medium opacity-75">Guitar</div>
                  <div className="text-xl font-bold text-orange-400">{currentSong.guitar}</div>
                </div>
              </div>

              {/* Set End Warning */}
              {isAtSetEnd && !isLastSet && (
                <div className={`mb-6 p-4 rounded-lg border-2 border-yellow-500 ${
                  darkMode ? 'bg-yellow-900' : 'bg-yellow-50'
                }`}>
                  <p className="text-yellow-600 font-bold">🎭 END OF SET {currentSetIndex + 1}</p>
                  <p className="text-sm">Break time! Next: {gig.sets[currentSetIndex + 1].name}</p>
                </div>
              )}

              {/* Gig End */}
              {isGigEnd && (
                <div className={`mb-6 p-4 rounded-lg border-2 border-green-500 ${
                  darkMode ? 'bg-green-900' : 'bg-green-50'
                }`}>
                  <p className="text-green-600 font-bold">🎉 FINAL SONG!</p>
                  <p className="text-sm">Last song of the gig!</p>
                </div>
              )}

              {currentSong.form && (
                <div className={`mb-6 p-4 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-yellow-50'
                }`}>
                  <div className="font-medium opacity-75 mb-2">Song Form</div>
                  <div className={`${fontSize === 'xl' ? 'text-lg' : 'text-base'}`}>
                    {currentSong.form}
                  </div>
                </div>
              )}

              {currentSong.notes && (
                <div className={`mb-6 p-4 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-green-50'
                }`}>
                  <div className="font-medium opacity-75 mb-2">Notes</div>
                  <div className={`${fontSize === 'xl' ? 'text-lg' : 'text-base'} italic`}>
                    {currentSong.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={prevSong}
                disabled={currentSetIndex === 0 && currentSongIndex === 0}
                className={`px-6 py-3 rounded-lg font-bold text-lg transition-colors ${
                  currentSetIndex === 0 && currentSongIndex === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                ⬅️ Previous
              </button>
              
              <button
                onClick={nextSong}
                disabled={isGigEnd}
                className={`px-6 py-3 rounded-lg font-bold text-lg transition-colors ${
                  isGigEnd
                    ? 'opacity-50 cursor-not-allowed'
                    : darkMode
                      ? 'bg-red-700 hover:bg-red-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isAtSetEnd && !isLastSet ? '☕ Break → Next Set' : 'Next ➡️'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}