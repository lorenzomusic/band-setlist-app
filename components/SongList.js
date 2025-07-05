"use client";

import { useState, useEffect } from 'react';

export default function SongList() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/songs')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch songs');
        }
        return response.json();
      })
      .then(data => {
        setSongs(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading songs:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const getLanguageFlag = (language) => {
    return language === 'danish' ? '🇩��' : '🇬🇧';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Band Song Database</h1>
        <p className="text-center">Loading songs... 🎵</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Band Song Database</h1>
        <p className="text-center text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">🎵 Band Song Database</h1>
      <p className="text-center mb-6 text-gray-600">Found {songs.length} songs in your collection</p>
      
      <div className="grid gap-6">
        {songs.map(song => (
          <div key={song.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{song.title}</h2>
                {song.medley && (
                  <p className="text-sm text-purple-600 font-medium mt-1">
                    🎼 {song.medley} - Part {song.medleyPosition}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                  Key: {song.key}
                </span>
                <div className="mt-2 text-2xl">
                  {getLanguageFlag(song.language)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
            
            {song.youtubeLink && (
              <div>
                <a 
                  href={song.youtubeLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  🎵 Listen on YouTube
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}