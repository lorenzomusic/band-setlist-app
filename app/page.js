"use client";

import { useState, useEffect } from 'react';
import SongList from '../components/SongList';
import AddSongForm from '../components/AddSongForm';
import SetListBuilder from '../components/SetListBuilder';
import PerformanceView from '../components/PerformanceView';
import PDFGenerator from '../components/PDFGenerator';
import SetBuilder from '../components/SetBuilder';
import GigBuilder from '../components/GigBuilder';
import GigPerformanceView from '../components/GigPerformanceView';
import EditSongForm from '../components/EditSongForm';

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('songs');
  const [selectedSetlist, setSelectedSetlist] = useState(null);
  const [selectedGig, setSelectedGig] = useState(null);
  const [editingSong, setEditingSong] = useState(null);

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
        <h1 className="text-4xl font-black mb-8 text-center text-gray-900">🎵 Band Management App</h1>
        
      {/* Tab Navigation */}
<div className="flex justify-center mb-8">
  <div className="bg-white rounded-lg p-1 shadow-md">
    <button
      onClick={() => setActiveTab('songs')}
      className={`px-4 py-3 rounded-md font-medium transition-colors ${
        activeTab === 'songs'
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:text-gray-800'
      }`}
    >
      📚 Songs
    </button>
    <button
      onClick={() => setActiveTab('sets')}
      className={`px-4 py-3 rounded-md font-medium transition-colors ${
        activeTab === 'sets'
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:text-gray-800'
      }`}
    >
      🎼 Sets
    </button>
    <button
      onClick={() => setActiveTab('setlists')}
      className={`px-4 py-3 rounded-md font-medium transition-colors ${
        activeTab === 'setlists'
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:text-gray-800'
      }`}
    >
      🎪 Gigs
    </button>
    <button
      onClick={() => setActiveTab('performance')}
      className={`px-4 py-3 rounded-md font-medium transition-colors ${
        activeTab === 'performance'
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:text-gray-800'
      }`}
    >
      🎭 Performance
    </button>
  </div>
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
                  />
                ) : (
                  <>
                    <AddSongForm onSongAdded={handleSongAdded} />
                    
                    <div>
                      <p className="text-center mb-6 text-gray-900 font-bold">Found {songs.length} songs in your collection</p>
                      
                      <div className="grid gap-6">
                        {songs.map(song => (
                          <div key={song.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div>
                                  <h2 className="text-2xl font-bold text-gray-800">{song.title}</h2>
                                  {song.artist && (
                                    <p className="text-lg text-gray-700 font-medium">by {song.artist}</p>
                                  )}
                                </div>
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
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

    {activeTab === 'sets' && (
              <SetBuilder songs={songs} />
            )}

            {activeTab === 'setlists' && (
              <GigBuilder songs={songs} />
            )}
           

            {activeTab === 'performance' && (
              <div>
                {gigs.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-xl text-gray-600 mb-4">No gigs created yet</p>
                    <p className="text-gray-500">Create a gig in the Gigs tab first</p>
                  </div>
                ) : (
                  <div>
                    {/* Gig Selector */}
                    <div className="mb-6 text-center">
                      <label className="block text-lg font-black mb-2 text-gray-900">Choose Gig for Performance:</label>
                      <select
                        value={selectedGig?.id || ''}
                        onChange={(e) => {
                          const gig = gigs.find(g => g.id === parseInt(e.target.value));
                          setSelectedGig(gig);
                        }}
                        className="px-4 py-2 border-2 border-gray-400 rounded-lg text-lg font-bold text-gray-900 bg-white"
                      >
                        <option value="">Select a gig...</option>
                        {gigs.map(gig => (
                          <option key={gig.id} value={gig.id}>
                            {gig.name} ({gig.sets.length} sets, {calculateGigDuration(gig.sets)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedGig && selectedGig.sets.length > 0 ? (
  <div className="space-y-8">
    {/* PDF Generator */}
    <PDFGenerator setlist={{
      ...selectedGig,
      songs: selectedGig.sets.flatMap(set => set.songs)
    }} />
    
    {/* Performance View */}
    <GigPerformanceView gig={selectedGig} />
  </div>
                    ) : selectedGig ? (
                      <div className="text-center py-12">
                        <p className="text-xl text-gray-600">This gig has no sets</p>
                        <p className="text-gray-500">Add sets to this gig first</p>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-xl text-gray-600">Select a gig to begin performance</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}