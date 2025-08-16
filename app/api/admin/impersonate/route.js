import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { config, createKey } from '../../../../lib/config';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

// Verify admin session
async function verifyAdminSession(request) {
  try {
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    const sessionData = await redis.get(createKey(`session:${sessionToken}`));
    
    if (!sessionData || !sessionData.isAdmin) {
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

// POST - Start user impersonation (admin only)
export async function POST(request) {
  try {
    const session = await verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the user to impersonate
    const users = await redis.get(createKey('users')) || [];
    const targetUser = users.find(u => u.id === userId);
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!targetUser.isActive) {
      return NextResponse.json({ error: 'Cannot impersonate inactive user' }, { status: 400 });
    }

    // Get the session token from cookie
    const sessionToken = request.cookies.get('session')?.value;
    
    // Update the session to include impersonation data
    const updatedSession = {
      ...session,
      impersonating: {
        originalUserId: session.userId,
        originalUser: session.user,
        targetUserId: userId,
        targetUser: {
          id: targetUser.id,
          username: targetUser.username,
          email: targetUser.email,
          isAdmin: false, // Impersonated user should not have admin privileges
          isActive: targetUser.isActive
        },
        startedAt: new Date().toISOString()
      },
      // Override current user data with target user
      userId: targetUser.id,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        isAdmin: false, // Important: remove admin privileges when impersonating
        isActive: targetUser.isActive
      }
    };

    await redis.set(createKey(`session:${sessionToken}`), updatedSession, { ex: 24 * 60 * 60 }); // 24 hour expiry

    return NextResponse.json({ 
      success: true, 
      message: `Now impersonating ${targetUser.username}`,
      impersonating: {
        userId: targetUser.id,
        username: targetUser.username,
        email: targetUser.email
      }
    });
    
  } catch (error) {
    console.error('Error starting impersonation:', error);
    return NextResponse.json({ error: 'Failed to start impersonation' }, { status: 500 });
  }
}

// DELETE - Stop user impersonation (admin only)
export async function DELETE(request) {
  try {
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }
    
    const session = await redis.get(createKey(`session:${sessionToken}`));
    
    if (!session || !session.impersonating) {
      return NextResponse.json({ error: 'Not currently impersonating' }, { status: 400 });
    }

    // Restore original admin session
    const restoredSession = {
      userId: session.impersonating.originalUserId,
      user: session.impersonating.originalUser,
      isAdmin: true,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt
      // Remove impersonating data
    };

    await redis.set(createKey(`session:${sessionToken}`), restoredSession, { ex: 24 * 60 * 60 });

    return NextResponse.json({ 
      success: true, 
      message: 'Stopped impersonation, returned to admin account' 
    });
    
  } catch (error) {
    console.error('Error stopping impersonation:', error);
    return NextResponse.json({ error: 'Failed to stop impersonation' }, { status: 500 });
  }
}