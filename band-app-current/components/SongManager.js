'use client';

import { useState, useEffect, useRef } from 'react';
import ApplePanel from './ui/ApplePanel';
import ApplePanelHeader from './ui/ApplePanelHeader';
import AppleButton from './ui/AppleButton';
import AppleSearchInput from './ui/AppleSearchInput';
import AppleMetadataBadge from './ui/AppleMetadataBadge';
import AddSongForm from './AddSongForm';
import EditSongForm from './EditSongForm';

export default function SongManager() {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterVocalist, setFilterVocalist] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const editFormRef = useRef(null);
  const addFormRef = useRef(null);

  useEffect(() => {
    loadSongs();
  }, []);

  // Scroll to edit form when it's opened
  useEffect(() => {
    if (editingSong && editFormRef.current) {
      setTimeout(() => {
        editFormRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100); // Small delay to ensure form is rendered
    }
  }, [editingSong]);

  // Scroll to add form when it's opened
  useEffect(() => {
    if (showAddForm && addFormRef.current) {
      setTimeout(() => {
        addFormRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100); // Small delay to ensure form is rendered
    }
  }, [showAddForm]);

  const loadSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      if (response.ok) {
        const data = await response.json();
        setSongs(data);
      }
    } catch (error) {
      console.error('Error loading songs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSongAdded = (newSong) => {
    setSongs(prev => [...prev, newSong]);
    setShowAddForm(false);
  };

  const handleSongUpdated = (updatedSong) => {
    setSongs(prev => prev.map(song => song.id === updatedSong.id ? updatedSong : song));
    setEditingSong(null);
  };

  const handleSongDeleted = (songId) => {
    setSongs(prev => prev.filter(song => song.id !== songId));
  };

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = filterLanguage === 'all' || song.language === filterLanguage;
    const matchesVocalist = filterVocalist === 'all' || song.vocalist === filterVocalist;
    
    return matchesSearch && matchesLanguage && matchesVocalist;
  });

  return (
    <div className="apple-container">
      <ApplePanel>
        <ApplePanelHeader
          title="Song Library"
          subtitle="Manage your song collection"
        />
        
        <div className="space-y-6 px-8 pb-8">
          {/* Add Song Form */}
          {showAddForm && (
            <div ref={addFormRef} className="animate-fade-in">
              <AddSongForm 
                onSongAdded={handleSongAdded} 
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Edit Song Form */}
          {editingSong && (
            <div ref={editFormRef} className="animate-fade-in">
              <EditSongForm 
                song={editingSong} 
                onSongUpdated={handleSongUpdated}
                onCancel={() => setEditingSong(null)}
              />
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="apple-label">Search</label>
              <AppleSearchInput
                placeholder="Search songs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="apple-label">Language</label>
              <select
                className="apple-input"
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
              >
                <option value="all">All Languages</option>
                <option value="english">English</option>
                <option value="danish">Danish</option>
              </select>
            </div>
            
            <div>
              <label className="apple-label">Vocalist</label>
              <select
                className="apple-input"
                value={filterVocalist}
                onChange={(e) => setFilterVocalist(e.target.value)}
              >
                <option value="all">All Vocalists</option>
                <option value="Rikke">Rikke</option>
                <option value="Lorentz">Lorentz</option>
                <option value="Both">Both</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <AppleButton onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Cancel' : 'Add New Song'}
              </AppleButton>
            </div>
          </div>
          
          {/* Songs List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="apple-loading">Loading songs...</div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSongs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No songs found</p>
                </div>
              ) : (
                filteredSongs.map((song, index) => (
                  <div key={`song-manager-${song.id}-${index}`} className="apple-song-item">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="apple-song-title">{song.title}</div>
                          <div className="apple-song-artist">{song.artist}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <AppleMetadataBadge type="duration">
                          {song.duration || '0:00'}
                        </AppleMetadataBadge>
                        <AppleMetadataBadge type="language">
                          {song.language === 'english' ? '🇬🇧' : '🇩🇰'}
                        </AppleMetadataBadge>
                        <AppleMetadataBadge type="vocalist">
                          {song.vocalist}
                        </AppleMetadataBadge>
                        <AppleButton 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setEditingSong(song)}
                        >
                          Edit
                        </AppleButton>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </ApplePanel>
    </div>
  );
} 