import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET(request) {
  try {
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false, isFirstTime: false });
    }
    
    // Check if session exists and is valid
    const sessionData = await redis.get(`session:${sessionToken}`);
    
    if (!sessionData) {
      return NextResponse.json({ authenticated: false, isFirstTime: false });
    }
    
    // Check if session has expired
    if (new Date() > new Date(sessionData.expiresAt)) {
      // Clean up expired session
      await redis.del(`session:${sessionToken}`);
      return NextResponse.json({ authenticated: false, isFirstTime: false });
    }
    
    // Check if this is first time setup
    const authConfig = await redis.get('auth_config');
    const isFirstTime = !authConfig;
    
    return NextResponse.json({ 
      authenticated: true, 
      isAdmin: sessionData.isAdmin,
      isFirstTime: isFirstTime
    });
    
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false, isFirstTime: false }, { status: 500 });
  }
} 