"use client";

import { useState, useEffect } from 'react';

export default function PerformanceView({ setlist }) {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('large'); // small, medium, large, xl

  // Auto-advance to next song (optional)
  const nextSong = () => {
    if (currentSongIndex < setlist.songs.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
    }
  };

  const prevSong = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex(currentSongIndex - 1);
    }
  };

  const fontSizeClasses = {
    small: 'text-xl md:text-2xl',
    medium: 'text-2xl md:text-4xl',
    large: 'text-3xl md:text-5xl',
    xl: 'text-4xl md:text-6xl'
  };

  const currentSong = setlist.songs[currentSongIndex];

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
            <h1 className="text-xl font-bold">{setlist.name}</h1>
            <p className="text-sm opacity-75">
              Song {currentSongIndex + 1} of {setlist.songs.length}
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {/* Font Size Controls */}
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className={`px-3 py-1 rounded border text-sm ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="small">Small Text</option>
              <option value="medium">Medium Text</option>
              <option value="large">Large Text</option>
              <option value="xl">XL Text</option>
            </select>

            {/* Dark Mode Toggle */}
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
        {setlist.songs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl opacity-75">No songs in this setlist</p>
          </div>
        ) : (
          <>
            {/* Current Song Display */}
            <div className="text-center mb-8">
              <div className={`${fontSizeClasses[fontSize]} font-bold mb-4`}>
                {currentSong.title}
              </div>
              
              {currentSong.medley && (
                <div className={`${fontSize === 'xl' ? 'text-2xl' : 'text-xl'} text-purple-400 mb-4`}>
                  🎼 {currentSong.medley} - Part {currentSong.medleyPosition}
                </div>
              )}

              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 ${
                fontSize === 'xl' ? 'text-lg' : 'text-base'
              }`}>
                <div className={`p-4 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className="font-medium opacity-75">Key</div>
                  <div className="text-2xl font-bold text-blue-400">{currentSong.key}</div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className="font-medium opacity-75">Duration</div>
                  <div className="text-2xl font-bold">{currentSong.duration}</div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className="font-medium opacity-75">Bass</div>
                  <div className="text-xl font-bold text-green-400">{currentSong.bassGuitar}</div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className="font-medium opacity-75">Guitar</div>
                  <div className="text-xl font-bold text-orange-400">{currentSong.guitar}</div>
                </div>
              </div>

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
                disabled={currentSongIndex === 0}
                className={`px-6 py-3 rounded-lg font-bold text-lg transition-colors ${
                  currentSongIndex === 0
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
                disabled={currentSongIndex === setlist.songs.length - 1}
                className={`px-6 py-3 rounded-lg font-bold text-lg transition-colors ${
                  currentSongIndex === setlist.songs.length - 1
                    ? 'opacity-50 cursor-not-allowed'
                    : darkMode
                      ? 'bg-blue-700 hover:bg-blue-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Next ➡️
              </button>
            </div>

            {/* Quick Setlist Overview */}
            <div className={`border-t pt-6 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4 text-center">Full Setlist</h3>
              <div className="grid gap-2">
                {setlist.songs.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    onClick={() => setCurrentSongIndex(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      index === currentSongIndex
                        ? darkMode
                          ? 'bg-blue-800 border-2 border-blue-600'
                          : 'bg-blue-100 border-2 border-blue-500'
                        : darkMode
                          ? 'bg-gray-800 hover:bg-gray-700'
                          : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">
                          {index + 1}. {song.title}
                        </span>
                        {song.medley && (
                          <span className="text-sm text-purple-400 ml-2">
                            ({song.medley})
                          </span>
                        )}
                      </div>
                      <div className="text-sm opacity-75">
                        {song.key} | {song.duration}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}