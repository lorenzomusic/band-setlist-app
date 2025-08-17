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
    
    // Check if there are any users in the system (including admin)
    const users = await redis.get(createKey('users')) || [];
    const authConfig = await redis.get(createKey('auth_config'));
    const hasUsers = users.length > 0 || authConfig !== null;
    
    
    if (authenticated) {
      // Check if user is a band member
      const bandMembers = await redis.get(createKey('band-members')) || [];
      const bandMember = bandMembers.find(member => member.userId === session.userId);
      
      // Handle impersonation
      const response = {
        authenticated: true,
        user: {
          id: session.userId,
          username: session.user?.username || session.username,
          email: session.user?.email,
          isAdmin: session.isAdmin
        },
        bandMember: bandMember || null,
        hasUsers
      };

      // Add impersonation info if currently impersonating
      if (session.impersonating) {
        response.impersonating = {
          isImpersonating: true,
          originalUser: {
            id: session.impersonating.originalUserId,
            username: session.impersonating.originalUser?.username || 'Admin'
          },
          targetUser: {
            id: session.impersonating.targetUserId,
            username: session.impersonating.targetUser?.username || 'Unknown User',
            email: session.impersonating.targetUser?.email || ''
          },
          startedAt: session.impersonating.startedAt
        };
      } else {
        response.impersonating = {
          isImpersonating: false
        };
      }
      
      return NextResponse.json(response);
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