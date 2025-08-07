import { Redis } from '@upstash/redis';
import { config, createKey } from './config';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

export async function verifySession(request) {
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

export function requireAuth(handler) {
  return async (request) => {
    const { authenticated } = await verifySession(request);
    
    if (!authenticated) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return handler(request);
  };
} 