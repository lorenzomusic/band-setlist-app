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

async function convertSetsToReferences() {
  try {
    console.log('🔄 Converting sets to use song IDs instead of embedded song data...');
    
    // Get current sets
    const sets = await redis.get(createKey('sets')) || [];
    
    console.log(`📊 Found ${sets.length} sets to convert`);
    
    // Convert each set's songs from full objects to just IDs
    const convertedSets = sets.map(set => {
      if (!set.songs || set.songs.length === 0) {
        return set;
      }
      
      // Convert songs to just IDs (preserve order)
      const songIds = set.songs.map(song => {
        console.log(`✅ Converting "${song.title}" to ID reference in set "${set.name}"`);
        return song.id;
      });
      
      return {
        ...set,
        songs: songIds  // Now just an array of song IDs
      };
    });
    
    // Save converted sets
    await redis.set(createKey('sets'), convertedSets);
    
    console.log('🎉 Sets converted successfully!');
    console.log(`📈 Converted ${sets.length} sets to use song ID references`);
    
  } catch (error) {
    console.error('❌ Conversion failed:', error);
    process.exit(1);
  }
}

// Run the conversion
convertSetsToReferences().then(() => {
  console.log('✨ All done!');
  process.exit(0);
});