import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET() {
  try {
    const spotifyAuth = await redis.get('spotify_auth');
    
    if (!spotifyAuth || !spotifyAuth.access_token) {
      return NextResponse.json({ 
        connected: false, 
        message: 'No Spotify account connected' 
      });
    }

    // Check if token is still valid or can be refreshed
    const isTokenValid = Date.now() < spotifyAuth.expires_at;
    const hasRefreshToken = !!spotifyAuth.refresh_token;

    return NextResponse.json({
      connected: true,
      tokenValid: isTokenValid,
      canRefresh: hasRefreshToken,
      user: spotifyAuth.user ? {
        id: spotifyAuth.user.id,
        display_name: spotifyAuth.user.display_name,
        email: spotifyAuth.user.email
      } : null,
      expires_at: spotifyAuth.expires_at,
      scope: spotifyAuth.scope
    });

  } catch (error) {
    console.error('Error checking Spotify status:', error);
    return NextResponse.json({ 
      error: 'Failed to check Spotify status' 
    }, { status: 500 });
  }
} 