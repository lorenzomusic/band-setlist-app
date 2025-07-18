"use client";

import { useState, useEffect } from 'react';

export default function SpotifyIntegration({ songs, onSongUpdated }) {
  const [spotifyAuth, setSpotifyAuth] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [searchResults, setSearchResults] = useState({});
  const [isLinkingSpotifyUrls, setIsLinkingSpotifyUrls] = useState(false);
  const [linkingProgress, setLinkingProgress] = useState({ current: 0, total: 0 });
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    checkSpotifyConnection();
  }, []);

  const checkSpotifyConnection = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch('/api/spotify/status');
      const data = await response.json();
      
      if (data.connected) {
        setSpotifyAuth(data);
      } else {
        setSpotifyAuth(null);
      }
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
      setSpotifyAuth(null);
    }
    setIsCheckingStatus(false);
  };

  const connectSpotify = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/spotify/auth');
      const data = await response.json();
      
      if (data.authURL) {
        // Store state for validation
        localStorage.setItem('spotify_state', data.state);
        // Redirect to Spotify auth
        window.location.href = data.authURL;
      }
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      alert('Failed to connect to Spotify. Please try again.');
    }
    setIsConnecting(false);
  };

  const disconnectSpotify = async () => {
    // Clear server-side auth (you might want to add a disconnect endpoint)
    setSpotifyAuth(null);
    localStorage.removeItem('spotify_connected');
    localStorage.removeItem('spotify_state');
  };

  const searchSpotifyForSong = async (song) => {
    try {
      const response = await fetch('/api/spotify/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: song.title, artist: song.artist })
      });

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching Spotify:', error);
      return [];
    }
  };

  const linkSpotifyUrlsToAllSongs = async () => {
    setIsLinkingSpotifyUrls(true);
    const songsWithoutSpotifyUrl = songs.filter(song => !song.spotify_url);
    setLinkingProgress({ current: 0, total: songsWithoutSpotifyUrl.length });

    for (let i = 0; i < songsWithoutSpotifyUrl.length; i++) {
      const song = songsWithoutSpotifyUrl[i];
      setLinkingProgress({ current: i + 1, total: songsWithoutSpotifyUrl.length });

      try {
        const results = await searchSpotifyForSong(song);
        
        if (results.length > 0 && results[0].confidence > 70) {
          const bestMatch = results[0];
          
          // Update song with Spotify URL
          const updatedSong = {
            ...song,
            spotify_url: bestMatch.spotify_url,
            duration: bestMatch.duration // Also update duration if it was missing
          };

          // Save to database
          const response = await fetch('/api/songs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedSong)
          });

          if (response.ok && onSongUpdated) {
            onSongUpdated(updatedSong);
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 250));
        
      } catch (error) {
        console.error(`Error linking Spotify URL for "${song.title}":`, error);
      }
    }

    setIsLinkingSpotifyUrls(false);
    setLinkingProgress({ current: 0, total: 0 });
  };

  const createSpotifyPlaylist = async (gigName, gigSongs, isPublic = false) => {
    try {
      const response = await fetch('/api/spotify/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigName,
          songs: gigSongs,
          isPublic
        })
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          playlistUrl: data.playlist.url,
          stats: data.stats,
          searchResults: data.searchResults
        };
      } else {
        throw new Error(data.error || 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Error creating Spotify playlist:', error);
      throw error;
    }
  };

  // Count songs with/without Spotify URLs
  const songsWithSpotifyUrl = songs.filter(song => song.spotify_url).length;
  const songsWithoutSpotifyUrl = songs.length - songsWithSpotifyUrl;

  if (isCheckingStatus) {
    return (
      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-light">
          <h3 className="text-apple-title-3 text-primary flex items-center gap-2">
            <span className="text-2xl">🎵</span>
            Spotify Integration
          </h3>
        </div>
        <div className="p-6 text-center">
          <div className="animate-spin w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Checking Spotify connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-apple shadow-apple overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-light">
        <h3 className="text-apple-title-3 text-primary flex items-center gap-2">
          <span className="text-2xl">🎵</span>
          Spotify Integration
        </h3>
        <p className="text-apple-body text-secondary mt-1">
          Connect with Spotify to link songs and create playlists
        </p>
      </div>

      <div className="p-6">
        {!spotifyAuth?.connected ? (
          /* Not Connected State */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🎧</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Connect Your Spotify Account</h4>
              <p className="text-sm text-gray-600 mb-4">
                Link your Spotify account to automatically find song URLs and create playlists from your setlists.
              </p>
              <button
                onClick={connectSpotify}
                disabled={isConnecting}
                className={`px-6 py-3 rounded-apple-button font-medium transition-apple-fast ${
                  isConnecting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isConnecting ? 'Connecting...' : '🎵 Connect Spotify'}
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 rounded-lg text-left">
              <h5 className="font-medium text-green-900 mb-2">🚀 What you'll get:</h5>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• <strong>Automatic song linking</strong> - Find Spotify URLs for all your songs</li>
                <li>• <strong>Playlist creation</strong> - Turn any gig setlist into a Spotify playlist</li>
                <li>• <strong>Better duration data</strong> - More accurate song lengths</li>
                <li>• <strong>Preview tracks</strong> - Quick audio previews of songs</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Connected State */
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
                <div>
                  <div className="font-medium text-green-800">Connected to Spotify</div>
                  <div className="text-sm text-green-600">
                    Account: {spotifyAuth.user?.display_name || 'Connected'}
                  </div>
                  {!spotifyAuth.tokenValid && (
                    <div className="text-xs text-orange-600">
                      Token expired - will refresh automatically when needed
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={disconnectSpotify}
                className="text-sm text-green-700 hover:text-green-900 underline"
              >
                Disconnect
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{songsWithSpotifyUrl}</div>
                <div className="text-sm text-gray-600">Songs with Spotify URLs</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{songsWithoutSpotifyUrl}</div>
                <div className="text-sm text-gray-600">Songs without URLs</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {songsWithoutSpotifyUrl > 0 && (
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">🔗 Link Spotify URLs</h5>
                  <p className="text-sm text-gray-600 mb-3">
                    Automatically find and add Spotify URLs to {songsWithoutSpotifyUrl} songs.
                  </p>
                  
                  {!isLinkingSpotifyUrls ? (
                    <button
                      onClick={linkSpotifyUrlsToAllSongs}
                      className="px-4 py-2 bg-blue text-white rounded-apple-button hover:bg-blue-700 transition-colors"
                    >
                      🔍 Find Spotify URLs for {songsWithoutSpotifyUrl} songs
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Linking URLs... {linkingProgress.current} of {linkingProgress.total}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(linkingProgress.current / linkingProgress.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Playlist Creation Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">🎧 Create Playlists</h5>
                <p className="text-sm text-blue-800">
                  You can now create Spotify playlists directly from your gig setlists! 
                  Look for the "📱 Create Spotify Playlist" button in your gig management sections.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export the create playlist function for use in other components
export { SpotifyIntegration }; 