import { Redis } from '@upstash/redis';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Multiple API sources for song data
const API_SOURCES = {
  // Spotify Web API (most reliable)
  SPOTIFY: {
    name: 'Spotify',
    searchUrl: 'https://api.spotify.com/v1/search',
    accessTokenUrl: 'https://accounts.spotify.com/api/token',
  },
  // MusicBrainz (free, no API key needed)
  MUSICBRAINZ: {
    name: 'MusicBrainz',
    searchUrl: 'https://musicbrainz.org/ws/2/recording',
  },
  // iTunes/Apple Music (free)
  ITUNES: {
    name: 'iTunes',
    searchUrl: 'https://itunes.apple.com/search',
  }
};

// Rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Format duration from milliseconds to MM:SS
function formatDuration(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Parse existing duration to check if it's valid
function isValidDuration(duration) {
  if (!duration) return false;
  // Check if it's already in MM:SS format
  const mmssPattern = /^\d{1,2}:\d{2}$/;
  return mmssPattern.test(duration.toString());
}

// Get Spotify access token
async function getSpotifyAccessToken() {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.log('⚠️  Spotify credentials not found, skipping Spotify API');
    return null;
  }

  try {
    const response = await fetch(API_SOURCES.SPOTIFY.accessTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('❌ Error getting Spotify token:', error.message);
    return null;
  }
}

// Search Spotify for song duration
async function searchSpotify(song, accessToken) {
  if (!accessToken) return null;

  try {
    const query = encodeURIComponent(`track:"${song.title}" artist:"${song.artist}"`);
    const response = await fetch(`${API_SOURCES.SPOTIFY.searchUrl}?q=${query}&type=track&limit=1`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    
    if (data.tracks && data.tracks.items.length > 0) {
      const track = data.tracks.items[0];
      return {
        duration: formatDuration(track.duration_ms),
        source: 'Spotify',
        confidence: calculateConfidence(song, track.name, track.artists[0].name)
      };
    }
  } catch (error) {
    console.error(`❌ Spotify search error for "${song.title}":`, error.message);
  }

  return null;
}

// Search iTunes for song duration
async function searchiTunes(song) {
  try {
    const query = encodeURIComponent(`${song.title} ${song.artist}`);
    const response = await fetch(`${API_SOURCES.ITUNES.searchUrl}?term=${query}&media=music&entity=song&limit=1`);
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const track = data.results[0];
      return {
        duration: formatDuration(track.trackTimeMillis),
        source: 'iTunes',
        confidence: calculateConfidence(song, track.trackName, track.artistName)
      };
    }
  } catch (error) {
    console.error(`❌ iTunes search error for "${song.title}":`, error.message);
  }

  return null;
}

// Search MusicBrainz for song duration
async function searchMusicBrainz(song) {
  try {
    const query = encodeURIComponent(`"${song.title}" AND artist:"${song.artist}"`);
    const response = await fetch(`${API_SOURCES.MUSICBRAINZ.searchUrl}?query=${query}&fmt=json&limit=1`);
    
    const data = await response.json();
    
    if (data.recordings && data.recordings.length > 0) {
      const recording = data.recordings[0];
      if (recording.length) {
        return {
          duration: formatDuration(recording.length),
          source: 'MusicBrainz',
          confidence: calculateConfidence(song, recording.title, recording['artist-credit'][0].name)
        };
      }
    }
  } catch (error) {
    console.error(`❌ MusicBrainz search error for "${song.title}":`, error.message);
  }

  return null;
}

// Calculate confidence score based on title and artist match
function calculateConfidence(originalSong, foundTitle, foundArtist) {
  const titleSimilarity = similarity(originalSong.title.toLowerCase(), foundTitle.toLowerCase());
  const artistSimilarity = similarity(originalSong.artist.toLowerCase(), foundArtist.toLowerCase());
  return (titleSimilarity + artistSimilarity) / 2;
}

// Simple string similarity function
function similarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance calculation
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

// Main function to find song duration
async function findSongDuration(song, spotifyToken) {
  console.log(`🔍 Searching for: "${song.title}" by ${song.artist}`);

  const results = [];

  // Try Spotify first (most reliable)
  if (spotifyToken) {
    const spotifyResult = await searchSpotify(song, spotifyToken);
    if (spotifyResult) results.push(spotifyResult);
    await delay(100); // Rate limiting
  }

  // Try iTunes
  const itunesResult = await searchiTunes(song);
  if (itunesResult) results.push(itunesResult);
  await delay(100);

  // Try MusicBrainz
  const musicbrainzResult = await searchMusicBrainz(song);
  if (musicbrainzResult) results.push(musicbrainzResult);
  await delay(500); // MusicBrainz has stricter rate limits

  // Choose the best result based on confidence
  if (results.length === 0) {
    console.log(`❌ No duration found for "${song.title}"`);
    return null;
  }

  // Sort by confidence and prefer Spotify
  results.sort((a, b) => {
    if (a.source === 'Spotify' && b.source !== 'Spotify') return -1;
    if (b.source === 'Spotify' && a.source !== 'Spotify') return 1;
    return b.confidence - a.confidence;
  });

  const bestResult = results[0];
  console.log(`✅ Found duration: ${bestResult.duration} (${bestResult.source}, confidence: ${(bestResult.confidence * 100).toFixed(1)}%)`);
  
  return bestResult.duration;
}

// Main script execution
async function updateSongDurations(options = {}) {
  const { forceUpdate = false, dryRun = false } = options;
  
  console.log('🎵 Starting song duration update...\n');
  
  try {
    // Get all songs from database
    const songs = await redis.get('songs') || [];
    console.log(`📊 Found ${songs.length} songs in database\n`);

    // Filter songs that need duration updates
    const songsToUpdate = songs.filter(song => {
      if (forceUpdate) return true;
      return !isValidDuration(song.duration);
    });

    console.log(`🎯 ${songsToUpdate.length} songs need duration updates\n`);

    if (songsToUpdate.length === 0) {
      console.log('✅ All songs already have valid durations!');
      return;
    }

    // Get Spotify access token
    const spotifyToken = await getSpotifyAccessToken();
    if (spotifyToken) {
      console.log('✅ Spotify API access granted\n');
    }

    const results = {
      updated: 0,
      failed: 0,
      skipped: 0
    };

    // Process each song
    for (let i = 0; i < songsToUpdate.length; i++) {
      const song = songsToUpdate[i];
      console.log(`\n[${i + 1}/${songsToUpdate.length}] Processing: "${song.title}" by ${song.artist}`);
      
      if (!song.title || !song.artist) {
        console.log('⚠️  Skipping: Missing title or artist');
        results.skipped++;
        continue;
      }

      const duration = await findSongDuration(song, spotifyToken);
      
      if (duration) {
        if (!dryRun) {
          // Update the song in the database
          const updatedSongs = songs.map(s => 
            s.id === song.id ? { ...s, duration } : s
          );
          
          await redis.set('songs', updatedSongs);
        }
        
        console.log(`${dryRun ? '🔍 Would update' : '💾 Updated'}: "${song.title}" duration to ${duration}`);
        results.updated++;
      } else {
        console.log(`❌ Failed to find duration for: "${song.title}"`);
        results.failed++;
      }

      // Progress indicator
      if ((i + 1) % 5 === 0) {
        console.log(`\n📈 Progress: ${i + 1}/${songsToUpdate.length} processed`);
      }
    }

    // Final report
    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL REPORT');
    console.log('='.repeat(50));
    console.log(`✅ Successfully ${dryRun ? 'found durations for' : 'updated'}: ${results.updated} songs`);
    console.log(`❌ Failed to find durations: ${results.failed} songs`);
    console.log(`⚠️  Skipped: ${results.skipped} songs`);
    console.log(`📊 Total processed: ${results.updated + results.failed + results.skipped} songs`);
    
    if (dryRun) {
      console.log('\n🔍 This was a dry run. Use --update to actually save changes.');
    } else {
      console.log('\n🎉 Database updated successfully!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    forceUpdate: args.includes('--force'),
    dryRun: !args.includes('--update')
  };

  if (args.includes('--help')) {
    console.log(`
🎵 Song Duration Update Script

Usage: node update-song-durations.js [options]

Options:
  --update      Actually update the database (default is dry run)
  --force       Update all songs, even those with existing durations
  --help        Show this help message

Examples:
  node update-song-durations.js                 # Dry run for songs missing durations
  node update-song-durations.js --update        # Update songs missing durations
  node update-song-durations.js --update --force # Update ALL songs

Environment Variables (optional):
  SPOTIFY_CLIENT_ID      Spotify API client ID
  SPOTIFY_CLIENT_SECRET  Spotify API client secret
    `);
    process.exit(0);
  }

  updateSongDurations(options).then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

export { updateSongDurations }; 