'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Clock, Music, Users, Volume2, Save, RefreshCw, Play, Download } from 'lucide-react';

const AISetlistBuilder = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedSetlist, setGeneratedSetlist] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  // Form state
  const [duration, setDuration] = useState(60);
  const [englishPercentage, setEnglishPercentage] = useState(70);
  const [energyMix, setEnergyMix] = useState('Balanced');
  const [singerBalance, setSingerBalance] = useState('Equal');
  const [vibe, setVibe] = useState('Crowd-pleasing');
  const [excludeSongs, setExcludeSongs] = useState([]);
  const [includeSongs, setIncludeSongs] = useState([]);
  const [customInstructions, setCustomInstructions] = useState('');

  // Load songs on component mount
  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      const data = await response.json();
      setSongs(data.songs || []);
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  const generateSetlist = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-setlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration,
          englishPercentage,
          energyMix,
          singerBalance,
          vibe,
          excludeSongs,
          includeSongs,
          customInstructions
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedSetlist(data);
        setShowResults(true);
      } else {
        alert('Error generating setlist: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating setlist:', error);
      alert('Failed to generate setlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveSetlist = async () => {
    if (!generatedSetlist?.setlist) return;

    try {
      const response = await fetch('/api/sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: generatedSetlist.setlist.name,
          songs: generatedSetlist.setlist.songs.map(song => song.id),
          createdBy: 'AI Assistant',
          metadata: generatedSetlist.metadata
        }),
      });

      if (response.ok) {
        alert('Setlist saved successfully!');
      } else {
        alert('Error saving setlist');
      }
    } catch (error) {
      console.error('Error saving setlist:', error);
      alert('Failed to save setlist');
    }
  };

  const toggleSongExclusion = (songId) => {
    setExcludeSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const toggleSongInclusion = (songId) => {
    setIncludeSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const formatDuration = (duration) => {
    const mins = Math.floor(duration);
    const secs = Math.round((duration - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="w-10 h-10 text-purple-300" />
            <h1 className="text-4xl font-bold text-white">AI Setlist Builder</h1>
            <Sparkles className="w-10 h-10 text-yellow-300" />
          </div>
          <p className="text-purple-200 text-lg">
            Let AI create the perfect setlist based on your preferences and song data
          </p>
        </div>

        {!showResults ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Volume2 className="w-6 h-6" />
                Setlist Parameters
              </h2>
              
              <div className="space-y-6">
                {/* Duration */}
                <div>
                  <label className="block text-white font-medium mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Target Duration: {duration} minutes
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="180"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* English Percentage */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    English Songs: {englishPercentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={englishPercentage}
                    onChange={(e) => setEnglishPercentage(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Energy Mix */}
                <div>
                  <label className="block text-white font-medium mb-2">Energy Mix</label>
                  <select
                    value={energyMix}
                    onChange={(e) => setEnergyMix(e.target.value)}
                    className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white backdrop-blur-sm"
                  >
                    <option value="Balanced" className="bg-gray-800">Balanced</option>
                    <option value="High Energy" className="bg-gray-800">High Energy</option>
                    <option value="Mellow" className="bg-gray-800">Mellow</option>
                    <option value="Building" className="bg-gray-800">Building Energy</option>
                    <option value="Dynamic" className="bg-gray-800">Dynamic Contrast</option>
                  </select>
                </div>

                {/* Singer Balance */}
                <div>
                  <label className="block text-white font-medium mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Singer Balance
                  </label>
                  <select
                    value={singerBalance}
                    onChange={(e) => setSingerBalance(e.target.value)}
                    className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white backdrop-blur-sm"
                  >
                    <option value="Equal" className="bg-gray-800">Equal Balance</option>
                    <option value="Favor Rikke" className="bg-gray-800">Favor Rikke</option>
                    <option value="Favor Lorentz" className="bg-gray-800">Favor Lorentz</option>
                    <option value="Mostly Rikke" className="bg-gray-800">Mostly Rikke</option>
                    <option value="Mostly Lorentz" className="bg-gray-800">Mostly Lorentz</option>
                  </select>
                </div>

                {/* Vibe */}
                <div>
                  <label className="block text-white font-medium mb-2">Vibe</label>
                  <select
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value)}
                    className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white backdrop-blur-sm"
                  >
                    <option value="Crowd-pleasing" className="bg-gray-800">Crowd-pleasing</option>
                    <option value="Dance Party" className="bg-gray-800">Dance Party</option>
                    <option value="Intimate" className="bg-gray-800">Intimate</option>
                    <option value="Rock Concert" className="bg-gray-800">Rock Concert</option>
                    <option value="Chill Vibes" className="bg-gray-800">Chill Vibes</option>
                    <option value="Nostalgic" className="bg-gray-800">Nostalgic</option>
                  </select>
                </div>

                {/* Custom Instructions */}
                <div>
                  <label className="block text-white font-medium mb-2">Custom Instructions</label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Any specific requests or preferences..."
                    className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 h-20 backdrop-blur-sm"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateSetlist}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate AI Setlist
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Song Selection Panel */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Music className="w-6 h-6" />
                Song Preferences ({songs.length} songs)
              </h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {songs.map((song) => (
                  <div key={song.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-white font-medium">{song.title}</h3>
                        <p className="text-white/70 text-sm">{song.artist}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleSongInclusion(song.id)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                            includeSongs.includes(song.id)
                              ? 'bg-green-500 text-white'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          Must Include
                        </button>
                        <button
                          onClick={() => toggleSongExclusion(song.id)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                            excludeSongs.includes(song.id)
                              ? 'bg-red-500 text-white'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          Exclude
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span>{formatDuration(song.duration)}</span>
                      <span>{song.key}</span>
                      <span>{song.energy || 'Medium'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Results Panel */
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Play className="w-6 h-6" />
                {generatedSetlist?.setlist?.name || 'Generated Setlist'}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={saveSetlist}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => setShowResults(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  New Setlist
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{generatedSetlist?.metadata?.totalDuration?.toFixed(1)}</div>
                <div className="text-white/70 text-sm">Minutes</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{generatedSetlist?.metadata?.songCount}</div>
                <div className="text-white/70 text-sm">Songs</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{generatedSetlist?.metadata?.englishPercentage}%</div>
                <div className="text-white/70 text-sm">English</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">AI</div>
                <div className="text-white/70 text-sm">Generated</div>
              </div>
            </div>

            {/* Setlist */}
            <div className="space-y-3">
              {generatedSetlist?.setlist?.songs?.map((song, index) => (
                <div key={song.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{song.title}</h3>
                        <p className="text-white/70 text-sm">{song.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-white/60">
                      <span>{formatDuration(song.duration)}</span>
                      <span>{song.key}</span>
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">{song.energy || 'Medium'}</span>
                    </div>
                  </div>
                  {song.reasoning && (
                    <p className="text-white/70 text-sm mt-2 ml-12">{song.reasoning}</p>
                  )}
                </div>
              ))}
            </div>

            {/* AI Reasoning */}
            {generatedSetlist?.setlist?.reasoning && (
              <div className="mt-6 bg-white/10 rounded-lg p-4 border border-white/20">
                <h3 className="text-white font-medium mb-2">AI Strategy</h3>
                <p className="text-white/70 text-sm">{generatedSetlist.setlist.reasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #ffffff;
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #ffffff;
        }
      `}</style>
    </div>
  );
};

export default AISetlistBuilder; 