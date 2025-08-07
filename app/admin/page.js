"use client";

import { useState, useEffect } from 'react';
import SpotifyIntegration from '../../components/SpotifyIntegration';
import UserManagementTab from '../../components/UserManagementTab';
import { useLanguage } from '../../components/LanguageProvider';

export default function AdminPage() {
  const { t } = useLanguage();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('spotify');

  // Load songs
  useEffect(() => {
    loadSongs();
    
    // Check for Spotify auth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('spotify_connected') === 'true') {
      localStorage.setItem('spotify_connected', JSON.stringify({ connected: true }));
      // Remove URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      setActiveTab('spotify'); // Switch to Spotify tab
    } else if (urlParams.get('spotify_error')) {
      alert(`Spotify connection failed: ${urlParams.get('spotify_error')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadSongs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/songs');
      if (response.ok) {
        const songsData = await response.json();
        setSongs(songsData);
      }
    } catch (error) {
      console.error('Error loading songs:', error);
      alert('Failed to load songs');
    } finally {
      setLoading(false);
    }
  };

  const handleSongsUpdated = () => {
    // Reload songs after updates
    loadSongs();
  };

  const handleSongUpdated = (updatedSong) => {
    // Update individual song in the list
    setSongs(prev => prev.map(song => 
      song.id === updatedSong.id ? updatedSong : song
    ));
  };

  // Count songs with/without durations
  const songsWithDurations = songs.filter(song => {
    if (!song.duration) return false;
    const mmssPattern = /^\d{1,2}:\d{2}$/;
    return mmssPattern.test(song.duration.toString());
  }).length;

  const songsWithoutDurations = songs.length - songsWithDurations;

  // Count songs with/without Spotify URLs
  const songsWithSpotifyUrl = songs.filter(song => song.spotify_url).length;
  const songsWithoutSpotifyUrl = songs.length - songsWithSpotifyUrl;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.loadingAdminPanel')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-apple shadow-apple overflow-hidden">
          <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <h1 className="text-apple-title-1 text-primary mb-2">⚙️ {t('admin.title')}</h1>
            <p className="text-apple-body text-secondary">{t('admin.subtitle')}</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-apple shadow-apple p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">{t('admin.totalSongs')}</p>
                <p className="text-2xl font-bold text-primary">{songs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-apple shadow-apple p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">{t('admin.withDurations')}</p>
                <p className="text-2xl font-bold text-green-600">{songsWithDurations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-apple shadow-apple p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎧</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">{t('admin.spotifyUrls')}</p>
                <p className="text-2xl font-bold text-green-600">{songsWithSpotifyUrl}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-apple shadow-apple p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">{t('admin.missingData')}</p>
                <p className="text-2xl font-bold text-red-600">{songsWithoutDurations + songsWithoutSpotifyUrl}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-apple shadow-apple overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('spotify')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'spotify'
                    ? 'border-blue text-blue bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🎵 Spotify Integration
              </button>
              <button
                onClick={() => setActiveTab('database')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'database'
                    ? 'border-blue text-blue bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💾 Database Management
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-blue text-blue bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Analytics
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'border-blue text-blue bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 User Management
              </button>
              <button
                onClick={() => setActiveTab('band-members')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'band-members'
                    ? 'border-blue text-blue bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🎸 Band Members
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'spotify' && (
              <SpotifyIntegration 
                songs={songs} 
                onSongUpdated={handleSongUpdated} 
              />
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <h3 className="text-apple-title-3 text-primary">Database Management</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-3">🔄 Data Refresh</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Reload all data from the database to reflect any external changes.
                    </p>
                    <button
                      onClick={loadSongs}
                      className="px-4 py-2 bg-blue text-white rounded-apple-button hover:bg-blue-700 transition-colors"
                    >
                      Refresh Data
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-3">📈 Database Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Songs:</span>
                        <span className="font-medium">{songs.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">With Valid Durations:</span>
                        <span className="font-medium">{songsWithDurations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">With Spotify URLs:</span>
                        <span className="font-medium">{songsWithSpotifyUrl}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completion Rate:</span>
                        <span className="font-medium">
                          {songs.length > 0 ? Math.round(((songsWithDurations + songsWithSpotifyUrl) / (songs.length * 2)) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Duration and Spotify URL updates are permanent and will affect all sets and gigs</li>
                    <li>• The system expects durations in MM:SS format (e.g., "3:45")</li>
                    <li>• Always backup your data before making bulk changes</li>
                    <li>• Spotify integration requires authentication for playlist creation</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-apple-title-3 text-primary">Song Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-4">🌍 Language Distribution</h4>
                    <div className="space-y-3">
                      {['english', 'danish'].map(lang => {
                        const count = songs.filter(s => s.language === lang).length;
                        const percentage = songs.length > 0 ? Math.round((count / songs.length) * 100) : 0;
                        return (
                          <div key={lang} className="flex items-center justify-between">
                            <span className="capitalize text-gray-600">{lang}:</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium w-12">{count} ({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-4">🎤 Vocalist Distribution</h4>
                    <div className="space-y-3">
                      {['Rikke', 'Lorentz', 'Both'].map(vocalist => {
                        const count = songs.filter(s => s.vocalist === vocalist).length;
                        const percentage = songs.length > 0 ? Math.round((count / songs.length) * 100) : 0;
                        return (
                          <div key={vocalist} className="flex items-center justify-between">
                            <span className="text-gray-600">{vocalist}:</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-500 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium w-12">{count} ({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-4">📊 Data Quality Report</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue">{songsWithDurations}</div>
                      <div className="text-xs text-gray-600">Complete Durations</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{songsWithSpotifyUrl}</div>
                      <div className="text-xs text-gray-600">Spotify URLs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {songs.filter(s => s.artist && s.artist.trim()).length}
                      </div>
                      <div className="text-xs text-gray-600">With Artist Info</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {songs.filter(s => s.tags && s.tags.length > 0).length}
                      </div>
                      <div className="text-xs text-gray-600">Tagged Songs</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <UserManagementTab />
            )}

            {activeTab === 'band-members' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-apple-title-3 text-primary">Band Member Management</h3>
                  <button
                    onClick={() => window.location.href = '/admin/band-members'}
                    className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Manage Band Members →
                  </button>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-800 mb-3">🎸 Band Member System</h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Manage your band's core members and replacements. Track who plays what instrument 
                    and link members to user accounts for enhanced collaboration.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-blue-800 mb-2">Core Members:</h5>
                      <ul className="text-blue-700 space-y-1">
                        <li>• Kim (Drummer)</li>
                        <li>• Flemming (Bass player)</li>
                        <li>• Rikke (Lead vocal)</li>
                        <li>• Kenneth (Keys)</li>
                        <li>• Lorentz (Lead vocal and guitar)</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-blue-800 mb-2">Features:</h5>
                      <ul className="text-blue-700 space-y-1">
                        <li>• Mark members as core vs replacement</li>
                        <li>• Link to existing user accounts</li>
                        <li>• Track instruments and contact info</li>
                        <li>• Full CRUD operations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-apple shadow-apple p-6">
          <h3 className="text-apple-title-3 text-primary mb-4">🚀 Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/songs'}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
            >
              <div className="text-blue text-xl mb-2">🎵</div>
              <div className="font-medium text-gray-800">Manage Songs</div>
              <div className="text-sm text-gray-600">Add, edit, or remove songs</div>
            </button>

            <button
              onClick={() => window.location.href = '/setbuilder'}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
            >
              <div className="text-green-600 text-xl mb-2">📋</div>
              <div className="font-medium text-gray-800">Build Sets</div>
              <div className="text-sm text-gray-600">Create and organize setlists</div>
            </button>

            <button
              onClick={() => window.location.href = '/gigs'}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
            >
              <div className="text-purple-600 text-xl mb-2">🎤</div>
              <div className="font-medium text-gray-800">Manage Gigs</div>
              <div className="text-sm text-gray-600">Plan upcoming performances</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 