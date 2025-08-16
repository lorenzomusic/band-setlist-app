import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Environment-aware key creator
function createKey(key) {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    return `prod:${key}`;
  } else if (env === 'staging') {
    return `staging:${key}`;
  } else {
    return `dev:${key}`;
  }
}

async function refreshSets() {
  try {
    console.log('🔄 Refreshing sets with latest song data...');
    
    // Get current songs and sets
    const songs = await redis.get(createKey('songs')) || [];
    const sets = await redis.get(createKey('sets')) || [];
    
    console.log(`📊 Found ${songs.length} songs and ${sets.length} sets`);
    
    // Create a map of songs by ID for quick lookup
    const songMap = new Map();
    songs.forEach(song => {
      songMap.set(song.id, song);
    });
    
    // Update each set with fresh song data
    const updatedSets = sets.map(set => {
      if (!set.songs || set.songs.length === 0) {
        return set;
      }
      
      const updatedSongs = set.songs.map(setSong => {
        const freshSong = songMap.get(setSong.id);
        if (freshSong) {
          console.log(`✅ Updated "${freshSong.title}" in set "${set.name}"`);
          return freshSong; // Replace with fresh data
        } else {
          console.log(`⚠️  Song "${setSong.title}" not found in main songs list`);
          return setSong; // Keep original if not found
        }
      });
      
      return {
        ...set,
        songs: updatedSongs
      };
    });
    
    // Save updated sets
    await redis.set(createKey('sets'), updatedSets);
    
    console.log('🎉 Sets refreshed successfully!');
    console.log(`📈 Updated ${sets.length} sets`);
    
  } catch (error) {
    console.error('❌ Refresh failed:', error);
    process.exit(1);
  }
}

// Run the refresh
refreshSets().then(() => {
  console.log('✨ All done!');
  process.exit(0);
});