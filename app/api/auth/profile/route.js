import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { config, createKey } from '../../../../lib/config';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

// Verify user session
async function verifySession(request) {
  try {
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    const sessionData = await redis.get(createKey(`session:${sessionToken}`));
    
    if (!sessionData) {
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

// GET - Get user profile
export async function GET(request) {
  try {
    const session = await verifySession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user information
    const users = await redis.get(createKey('users')) || [];
    const user = users.find(u => u.id === session.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Error getting profile:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
} 