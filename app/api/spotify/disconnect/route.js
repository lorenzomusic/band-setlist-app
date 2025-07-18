import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function POST() {
  try {
    // Get current auth to potentially revoke tokens
    const spotifyAuth = await redis.get('spotify_auth');
    
    // Delete stored authentication data
    await redis.del('spotify_auth');
    
    // Optionally revoke the token with Spotify (good practice)
    if (spotifyAuth?.access_token) {
      try {
        await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
          },
          body: new URLSearchParams({
            token: spotifyAuth.access_token,
            token_type_hint: 'access_token'
          })
        });
      } catch (error) {
        console.error('Error revoking token:', error);
        // Continue even if revocation fails
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Spotify account disconnected successfully. All authentication data has been removed.' 
    });
    
  } catch (error) {
    console.error('Error disconnecting Spotify:', error);
    return NextResponse.json({ 
      error: 'Failed to disconnect Spotify account' 
    }, { status: 500 });
  }
} 