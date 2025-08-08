import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { config, createKey } from '../../../../lib/config';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

// Verify session
async function verifySession(request) {
  try {
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!sessionToken) {
      return { authenticated: false, session: null };
    }
    
    const sessionData = await redis.get(createKey(`session:${sessionToken}`));
    
    if (!sessionData) {
      return { authenticated: false, session: null };
    }
    
    // Check if session has expired
    if (new Date() > new Date(sessionData.expiresAt)) {
      await redis.del(createKey(`session:${sessionToken}`));
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
    const users = await redis.get(createKey('users')) || [];
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