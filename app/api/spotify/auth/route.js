import { NextResponse } from 'next/server';

// Generate random string for state parameter
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export async function GET() {
  const state = generateRandomString(16);
  const scope = 'playlist-modify-public playlist-modify-private user-read-private user-read-email';
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3001/api/auth/spotify/callback',
    state: state
  });

  const authURL = `https://accounts.spotify.com/authorize?${params.toString()}`;
  
  return NextResponse.json({ authURL, state });
} 