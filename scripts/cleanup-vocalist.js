import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function cleanupVocalist() {
  try {
    console.log('🧹 Starting vocalist cleanup...');
    
    // Get all songs
    const songs = await redis.get('songs') || [];
    console.log(`📊 Found ${songs.length} songs to clean up`);
    
    // Remove leadSinger field from all songs
    const cleanedSongs = songs.map(song => {
      const { leadSinger, ...cleanSong } = song;
      return cleanSong;
    });
    
    // Save back to database
    await redis.set('songs', cleanedSongs);
    
    console.log('✅ Removed leadSinger field from all songs');
    console.log('🎉 Cleanup completed successfully!');
    
    // Verify cleanup
    const verifyNotMissing = cleanedSongs.every(song => song.vocalist);
    console.log(`✅ All songs have vocalist field: ${verifyNotMissing}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupVocalist().then(() => {
  console.log('✨ All done!');
  process.exit(0);
}); 