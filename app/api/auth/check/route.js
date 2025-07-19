import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Verify session
async function verifySession(request) {
  try {
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!sessionToken) {
      return { authenticated: false, session: null };
    }
    
    const sessionData = await redis.get(`session:${sessionToken}`);
    
    if (!sessionData) {
      return { authenticated: false, session: null };
    }
    
    // Check if session has expired
    if (new Date() > new Date(sessionData.expiresAt)) {
      await redis.del(`session:${sessionToken}`);
      return { authenticated: false, session: null };
    }
    
    return { authenticated: true, session: sessionData };
    
  } catch (error) {
    console.error('Session verification error:', error);
    return { authenticated: false, session: null };
  }
}

export async function GET(request) {
  try {
    const { authenticated, session } = await verifySession(request);
    
    // Check if there are any users in the system
    const users = await redis.get('users') || [];
    const hasUsers = users.length > 0;
    
    if (authenticated) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.userId,
          username: session.username,
          isAdmin: session.isAdmin
        },
        hasUsers
      });
    } else {
      return NextResponse.json({
        authenticated: false,
        hasUsers,
        isFirstTime: !hasUsers // First time if no users exist
      });
    }
    
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      authenticated: false,
      hasUsers: false,
      isFirstTime: true
    });
  }
} 