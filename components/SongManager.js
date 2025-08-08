'use client';

import { useState, useEffect, useRef } from 'react';
import ApplePanel from './ui/ApplePanel';
import ApplePanelHeader from './ui/ApplePanelHeader';
import AppleButton from './ui/AppleButton';
import AppleSearchInput from './ui/AppleSearchInput';
import AppleMetadataBadge from './ui/AppleMetadataBadge';
import AddSongForm from './AddSongForm';
import EditSongForm from './EditSongForm';
import { useLanguage } from './LanguageProvider';

export default function SongManager() {
  const { t } = useLanguage();
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterVocalist, setFilterVocalist] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [expandedSongs, setExpandedSongs] = useState(new Set());
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

  const toggleSongExpansion = (songId) => {
    setExpandedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  };

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = filterLanguage === 'all' || song.language === filterLanguage;
    const matchesVocalist = filterVocalist === 'all' || song.vocalist === filterVocalist;
    
    return matchesSearch && matchesLanguage && matchesVocalist;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="px-4 md:px-8 pt-6 md:pt-8 pb-4 md:pb-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h1 className="text-lg md:text-apple-title-1 text-primary mb-2">📚 {t('songs.title')}</h1>
          <p className="text-apple-callout md:text-apple-body text-secondary">Manage your song collection</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="px-4 md:px-8 py-4 md:py-6">
          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 apple-section-spacing">
            <div className="flex-1 sm:max-w-xs">
              <AppleSearchInput
                placeholder={t('songs.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <AppleButton onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? t('common.cancel') : t('songs.addNewSong')}
            </AppleButton>
          </div>

          {/* Add Song Form */}
          {showAddForm && (
            <div ref={addFormRef} className="animate-fade-in apple-section-spacing">
              <AddSongForm 
                onSongAdded={handleSongAdded} 
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Edit Song Form */}
          {editingSong && (
            <div ref={editFormRef} className="animate-fade-in apple-section-spacing">
              <EditSongForm 
                song={editingSong} 
                onSongUpdated={handleSongUpdated}
                onCancel={() => setEditingSong(null)}
              />
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 apple-section-spacing">
            <div>
              <label className="apple-label">{t('songs.language')}</label>
              <select
                className="apple-input"
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
              >
                <option value="all">{t('songs.all')} {t('songs.language')}</option>
                <option value="english">English</option>
                <option value="danish">Danish</option>
              </select>
            </div>
            
            <div>
              <label className="apple-label">{t('songs.vocalist')}</label>
              <select
                className="apple-input"
                value={filterVocalist}
                onChange={(e) => setFilterVocalist(e.target.value)}
              >
                <option value="all">{t('songs.all')} {t('songs.vocalist')}</option>
                <option value="Rikke">Rikke</option>
                <option value="Lorentz">Lorentz</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>
          
          {/* Songs List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="apple-loading">{t('common.loading')}</div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSongs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">{t('songs.noSongsFound')}</p>
                </div>
              ) : (
                filteredSongs.map((song, index) => (
                  <div key={`song-manager-${song.id}-${index}`} className="apple-song-item apple-item-spacing">
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
                        
                        {/* Expand/Collapse Button */}
                        <button
                          onClick={() => toggleSongExpansion(song.id)}
                          className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                          title={expandedSongs.has(song.id) ? 'Collapse details' : 'Expand details'}
                        >
                          {expandedSongs.has(song.id) ? '▼' : '▶'}
                        </button>
                        
                        <AppleButton 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setEditingSong(song)}
                        >
                          {t('songs.edit')}
                        </AppleButton>
                      </div>
                    </div>
                    
                    {/* Expanded Song Details */}
                    {expandedSongs.has(song.id) && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Basic Info */}
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2">{t('songs.basicInfo')}</h4>
                            <div className="space-y-2 text-sm">
                              <div><span className="font-medium">{t('songs.title')}:</span> {song.title}</div>
                              <div><span className="font-medium">{t('songs.artist')}:</span> {song.artist}</div>
                              <div><span className="font-medium">{t('songs.duration')}:</span> {song.duration || t('songs.notSet')}</div>
                              <div><span className="font-medium">{t('songs.language')}:</span> {song.language === 'english' ? 'English 🇬🇧' : 'Danish 🇩🇰'}</div>
                              <div><span className="font-medium">{t('songs.vocalist')}:</span> {song.vocalist}</div>
                            </div>
                          </div>
                          
                          {/* Musical Details */}
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2">{t('songs.musicalDetails')}</h4>
                            <div className="space-y-2 text-sm">
                              <div><span className="font-medium">{t('songs.key')}:</span> {song.key || t('songs.notSet')}</div>
                              <div><span className="font-medium">{t('songs.bpm')}:</span> {song.bpm || t('songs.notSet')}</div>
                              <div><span className="font-medium">{t('songs.bassGuitar')}:</span> {song.bassGuitar || t('songs.notSet')}</div>
                              <div><span className="font-medium">{t('songs.guitar')}:</span> {song.guitar || t('songs.notSet')}</div>
                              <div><span className="font-medium">{t('songs.backingTrack')}:</span> {song.backingTrack ? t('songs.yes') : t('songs.no')}</div>
                            </div>
                          </div>
                          
                          {/* Medley Info */}
                          <div>
                            <h4 className="font-medium text-gray-800 mb-2">Additional Info</h4>
                            <div className="space-y-2 text-sm">
                              {song.medley && (
                                <>
                                  <div><span className="font-medium">Medley:</span> {song.medley}</div>
                                  <div><span className="font-medium">Position:</span> {song.medleyPosition || 'Not set'}</div>
                                </>
                              )}
                              {song.tags && song.tags.length > 0 && (
                                <div>
                                  <span className="font-medium">Tags:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {song.tags.map((tag, tagIndex) => (
                                      <span key={tagIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {song.notes && (
                                <div>
                                  <span className="font-medium">Notes:</span>
                                  <div className="mt-1 text-gray-600 italic">{song.notes}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 