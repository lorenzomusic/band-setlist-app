import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Get current user's Spotify access token
async function getSpotifyUserToken() {
  const spotifyAuth = await redis.get('spotify_auth');
  
  if (!spotifyAuth || !spotifyAuth.access_token) {
    throw new Error('No Spotify authentication found. Please connect your Spotify account first.');
  }

  // Check if token is still valid
  if (Date.now() >= spotifyAuth.expires_at) {
    // Try to refresh the token
    if (spotifyAuth.refresh_token) {
      try {
        const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: spotifyAuth.refresh_token
          })
        });

        if (refreshResponse.ok) {
          const tokenData = await refreshResponse.json();
          
          // Update stored auth with new token
          const updatedAuth = {
            ...spotifyAuth,
            access_token: tokenData.access_token,
            expires_at: Date.now() + (tokenData.expires_in * 1000),
            ...(tokenData.refresh_token && { refresh_token: tokenData.refresh_token })
          };
          
          await redis.set('spotify_auth', updatedAuth);
          return { token: tokenData.access_token, userId: spotifyAuth.user.id };
        }
      } catch (error) {
        console.error('Error refreshing Spotify token:', error);
      }
    }
    
    throw new Error('Spotify token expired and could not be refreshed. Please reconnect your account.');
  }

  return { token: spotifyAuth.access_token, userId: spotifyAuth.user.id };
}

export async function POST(request) {
  try {
    const { gigName, songs, isPublic = false } = await request.json();
    
    if (!gigName || !songs || !Array.isArray(songs)) {
      return NextResponse.json({ 
        error: 'Gig name and songs array are required' 
      }, { status: 400 });
    }

    const { token, userId } = await getSpotifyUserToken();

    // Create the playlist
    const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${gigName} - Setlist`,
        description: `Setlist for ${gigName} gig. Created by Greatest Gig app.`,
        public: isPublic
      })
    });

    if (!playlistResponse.ok) {
      const error = await playlistResponse.json();
      throw new Error(`Failed to create playlist: ${error.error?.message || 'Unknown error'}`);
    }

    const playlist = await playlistResponse.json();

    // Search for each song and collect Spotify track URIs
    const trackUris = [];
    const searchResults = [];

    for (const song of songs) {
      try {
        // Search for the track on Spotify
        const query = encodeURIComponent(`track:"${song.title}" artist:"${song.artist}"`);
        const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          
          if (searchData.tracks && searchData.tracks.items.length > 0) {
            const track = searchData.tracks.items[0];
            trackUris.push(track.uri);
            searchResults.push({
              originalSong: song,
              spotifyTrack: {
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                spotify_url: track.external_urls.spotify,
                found: true
              }
            });
          } else {
            searchResults.push({
              originalSong: song,
              spotifyTrack: null,
              found: false
            });
          }
        }
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error searching for song "${song.title}":`, error);
        searchResults.push({
          originalSong: song,
          spotifyTrack: null,
          found: false,
          error: error.message
        });
      }
    }

    // Add tracks to playlist if we found any
    if (trackUris.length > 0) {
      // Spotify API limits to 100 tracks per request
      const batchSize = 100;
      for (let i = 0; i < trackUris.length; i += batchSize) {
        const batch = trackUris.slice(i, i + batchSize);
        
        const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: batch
          })
        });

        if (!addTracksResponse.ok) {
          const error = await addTracksResponse.json();
          console.error('Error adding tracks to playlist:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        url: playlist.external_urls.spotify,
        tracks_total: trackUris.length
      },
      searchResults,
      stats: {
        totalSongs: songs.length,
        foundOnSpotify: trackUris.length,
        notFound: songs.length - trackUris.length
      }
    });

  } catch (error) {
    console.error('Spotify playlist creation error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 