import { Redis } from '@upstash/redis'
import fs from 'fs';
import path from 'path';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function POST() {
  try {
    const dataPath = path.join(process.cwd(), 'data');
    
    let songs = [];
    let sets = [];
    let gigs = [];

    // Try to read existing JSON files
    try {
      const songsPath = path.join(dataPath, 'songs.json');
      if (fs.existsSync(songsPath)) {
        const songsData = fs.readFileSync(songsPath, 'utf8');
        songs = JSON.parse(songsData);
        console.log(`Found ${songs.length} songs to migrate`);
      }
    } catch (error) {
      console.log('No songs.json found or error reading it');
    }

    try {
      const setsPath = path.join(dataPath, 'sets.json');
      if (fs.existsSync(setsPath)) {
        const setsData = fs.readFileSync(setsPath, 'utf8');
        sets = JSON.parse(setsData);
        console.log(`Found ${sets.length} sets to migrate`);
      }
    } catch (error) {
      console.log('No sets.json found or error reading it');
    }

    try {
      const gigsPath = path.join(dataPath, 'gigs.json');
      if (fs.existsSync(gigsPath)) {
        const gigsData = fs.readFileSync(gigsPath, 'utf8');
        gigs = JSON.parse(gigsData);
        console.log(`Found ${gigs.length} gigs to migrate`);
      }
    } catch (error) {
      console.log('No gigs.json found or error reading it');
    }

    // Ensure all items have IDs
    songs = songs.map(song => ({
      ...song,
      id: song.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9))
    }));

    sets = sets.map(set => ({
      ...set,
      id: set.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9))
    }));

    gigs = gigs.map(gig => ({
      ...gig,
      id: gig.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9))
    }));

    // Store in Redis
    await redis.set('songs', songs);
    await redis.set('sets', sets);
    await redis.set('gigs', gigs);

    console.log('Migration completed successfully');

    return Response.json({ 
      success: true,
      message: 'Migration completed successfully',
      migrated: {
        songs: songs.length,
        sets: sets.length,
        gigs: gigs.length
      }
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return Response.json({ 
      success: false,
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
} 