import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Get a valid Spotify access token
async function getSpotifyAccessToken() {
  // First try to get stored user token
  const spotifyAuth = await redis.get('spotify_auth');
  
  if (spotifyAuth && spotifyAuth.access_token) {
    // Check if token is still valid
    if (Date.now() < spotifyAuth.expires_at) {
      return spotifyAuth.access_token;
    }
    
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
          return tokenData.access_token;
        }
      } catch (error) {
        console.error('Error refreshing Spotify token:', error);
      }
    }
  }

  // Fall back to client credentials flow (no user context, but can search)
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    }
  } catch (error) {
    console.error('Error getting Spotify client credentials:', error);
  }

  return null;
}

export async function POST(request) {
  try {
    const { title, artist } = await request.json();
    
    if (!title || !artist) {
      return NextResponse.json({ error: 'Title and artist are required' }, { status: 400 });
    }

    const accessToken = await getSpotifyAccessToken();
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unable to get Spotify access token' }, { status: 500 });
    }

    // Search for the track on Spotify
    const query = encodeURIComponent(`track:"${title}" artist:"${artist}"`);
    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=5`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`Spotify search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    if (searchData.tracks && searchData.tracks.items.length > 0) {
      // Return the top matches with confidence scoring
      const results = searchData.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        duration_ms: track.duration_ms,
        duration: formatDuration(track.duration_ms),
        spotify_url: track.external_urls.spotify,
        preview_url: track.preview_url,
        image: track.album.images[0]?.url,
        confidence: calculateConfidence(title, artist, track.name, track.artists[0].name)
      }));

      // Sort by confidence
      results.sort((a, b) => b.confidence - a.confidence);

      return NextResponse.json({ results });
    } else {
      return NextResponse.json({ results: [] });
    }

  } catch (error) {
    console.error('Spotify search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to format duration from milliseconds to MM:SS
function formatDuration(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Simple confidence calculation based on string similarity
function calculateConfidence(originalTitle, originalArtist, foundTitle, foundArtist) {
  const titleSimilarity = similarity(originalTitle.toLowerCase(), foundTitle.toLowerCase());
  const artistSimilarity = similarity(originalArtist.toLowerCase(), foundArtist.toLowerCase());
  return Math.round(((titleSimilarity + artistSimilarity) / 2) * 100);
}

function similarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
} 