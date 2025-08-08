import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { config, createKey } from '../../../../lib/config';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

export async function POST(request) {
  try {
    const sessionToken = request.cookies.get('session')?.value;
    
    if (sessionToken) {
      // Remove session from Redis
      await redis.del(createKey(`session:${sessionToken}`));
    }
    
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Clear session cookie
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Expire immediately
    });
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
} 