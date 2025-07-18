import { NextResponse } from 'next/server';
import { verifySession } from '../../../lib/auth';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET(request) {
  // Verify authentication
  const { authenticated } = await verifySession(request);
  
  if (!authenticated) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    // Get admin stats
    const [songs, sets, authConfig] = await Promise.all([
      redis.get('songs') || [],
      redis.get('sets') || [],
      redis.get('auth_config')
    ]);
    
    const stats = {
      totalSongs: songs.length,
      totalSets: sets.length,
      songsWithDurations: songs.filter(song => song.duration).length,
      songsWithSpotifyUrls: songs.filter(song => song.spotifyUrl).length,
      lastLogin: authConfig?.lastLogin,
      accountCreated: authConfig?.createdAt
    };
    
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to get admin stats' }, { status: 500 });
  }
} 