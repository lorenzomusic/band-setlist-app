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

async function convertGigsToReferences() {
  try {
    console.log('🔄 Converting gigs to use song IDs instead of embedded song data...');
    
    // Get current gigs
    const gigs = await redis.get(createKey('gigs')) || [];
    
    console.log(`📊 Found ${gigs.length} gigs to convert`);
    
    // Convert each gig's sets to use song IDs
    const convertedGigs = gigs.map(gig => {
      if (!gig.sets || gig.sets.length === 0) {
        return gig;
      }
      
      const convertedSets = gig.sets.map(set => {
        if (!set.songs || set.songs.length === 0) {
          return set;
        }
        
        // Convert songs to just IDs (preserve order)
        const songIds = set.songs.map(song => {
          console.log(`✅ Converting "${song.title}" to ID reference in gig "${gig.name}" set "${set.name}"`);
          return song.id;
        });
        
        return {
          ...set,
          songs: songIds  // Now just an array of song IDs
        };
      });
      
      return {
        ...gig,
        sets: convertedSets
      };
    });
    
    // Save converted gigs
    await redis.set(createKey('gigs'), convertedGigs);
    
    console.log('🎉 Gigs converted successfully!');
    console.log(`📈 Converted ${gigs.length} gigs to use song ID references`);
    
  } catch (error) {
    console.error('❌ Conversion failed:', error);
    process.exit(1);
  }
}

// Run the conversion
convertGigsToReferences().then(() => {
  console.log('✨ All done!');
  process.exit(0);
});