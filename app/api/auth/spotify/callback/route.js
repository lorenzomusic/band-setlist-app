import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/admin?spotify_error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/admin?spotify_error=missing_code', request.url));
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3001/api/auth/spotify/callback'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Get user profile information
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to get user profile');
    }

    const profileData = await profileResponse.json();

    // Store the tokens in Redis
    const spotifyAuth = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      scope: tokenData.scope,
      user: {
        id: profileData.id,
        display_name: profileData.display_name,
        email: profileData.email,
        images: profileData.images
      },
      created_at: new Date().toISOString()
    };

    await redis.set('spotify_auth', spotifyAuth);

    // Redirect back to admin with success
    return NextResponse.redirect(new URL('/admin?spotify_connected=true', request.url));

  } catch (error) {
    console.error('Spotify OAuth error:', error);
    return NextResponse.redirect(new URL(`/admin?spotify_error=${encodeURIComponent(error.message)}`, request.url));
  }
} 