"use client";

import React, { useState, useEffect } from 'react';
import ApplePanel from './ui/ApplePanel';
import ApplePanelHeader from './ui/ApplePanelHeader';
import AppleButton from './ui/AppleButton';
import AppleSearchInput from './ui/AppleSearchInput';
import AppleMetadataBadge from './ui/AppleMetadataBadge';

export default function AISetlistBuilder() {
  const [songs, setSongs] = useState([]);
  const [generatedSetlist, setGeneratedSetlist] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferences, setPreferences] = useState({
    duration: 90,
    style: 'mixed',
    energy: 'medium'
  });

  useEffect(() => {
    // Load songs from API
    fetch('/api/songs')
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(err => console.error('Error loading songs:', err));
  }, []);

  const generateSetlist = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.floor(preferences.duration / 5));
      
      setGeneratedSetlist(selected.map((song, index) => ({
        ...song,
        position: index + 1
      })));
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h1 className="text-apple-title-1 text-primary mb-2">🤖 AI Setlist Builder</h1>
          <p className="text-apple-body text-secondary">Let AI create the perfect setlist for your gig</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Preferences Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-apple shadow-apple p-6">
            <h2 className="text-apple-title-3 text-primary mb-4">Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <label className="apple-label">
                  Set Duration (minutes)
                </label>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="15"
                  value={preferences.duration}
                  onChange={(e) => setPreferences(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-apple-callout text-secondary mt-1">
                  <span>30min</span>
                  <span>{preferences.duration}min</span>
                  <span>180min</span>
                </div>
              </div>

              <div>
                <label className="apple-label">
                  Musical Style
                </label>
                <select
                  value={preferences.style}
                  onChange={(e) => setPreferences(prev => ({ ...prev, style: e.target.value }))}
                  className="apple-input"
                >
                  <option value="mixed">Mixed Styles</option>
                  <option value="jazz">Jazz Focus</option>
                  <option value="pop">Pop Focus</option>
                  <option value="rock">Rock Focus</option>
                  <option value="ballads">Ballads</option>
                </select>
              </div>

              <div>
                <label className="apple-label">
                  Energy Level
                </label>
                <select
                  value={preferences.energy}
                  onChange={(e) => setPreferences(prev => ({ ...prev, energy: e.target.value }))}
                  className="apple-input"
                >
                  <option value="low">Low Energy</option>
                  <option value="medium">Medium Energy</option>
                  <option value="high">High Energy</option>
                  <option value="mixed">Mixed Energy</option>
                </select>
              </div>

              <button
                onClick={generateSetlist}
                disabled={isGenerating}
                className="w-full bg-blue text-white py-3 px-4 rounded-apple-button hover:bg-blue focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-apple-fast"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Setlist...
                  </div>
                ) : (
                  'Generate Setlist'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Generated Setlist */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-apple shadow-apple overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-light">
              <h3 className="text-apple-title-3 text-primary">Generated Setlist</h3>
              {generatedSetlist.length > 0 && (
                <p className="text-apple-callout text-secondary mt-1">
                  {generatedSetlist.length} songs • ~{Math.round(generatedSetlist.length * 5)} minutes
                </p>
              )}
            </div>

            <div className="p-6">
              {generatedSetlist.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-apple-headline text-primary">No setlist generated</h3>
                  <p className="mt-1 text-apple-body text-secondary">
                    Set your preferences and click &quot;Generate Setlist&quot; to create your perfect setlist.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {generatedSetlist.map((song, index) => (
                    <div key={`ai-setlist-${song.id}-${index}`} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-apple-small">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {song.position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-apple-body text-primary truncate">{song.title}</p>
                        <p className="text-apple-callout text-secondary">{song.artist}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {song.key && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {song.key}
                          </span>
                        )}
                        {song.tempo && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {song.tempo} BPM
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 