import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Verify user session
async function verifySession(request) {
  try {
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    const sessionData = await redis.get(`session:${sessionToken}`);
    
    if (!sessionData) {
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

// Hash password with salt
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// POST - Change user password
export async function POST(request) {
  try {
    const session = await verifySession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    // Get user information
    const users = await redis.get('users') || [];
    const userIndex = users.findIndex(u => u.id === session.userId);
    
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[userIndex];

    // Verify current password
    const currentPasswordHash = hashPassword(currentPassword, user.salt);
    
    if (currentPasswordHash !== user.passwordHash) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Generate new password hash
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newPasswordHash = hashPassword(newPassword, newSalt);

    // Update user with new password
    const updatedUser = {
      ...user,
      passwordHash: newPasswordHash,
      salt: newSalt,
      passwordChangedAt: new Date().toISOString()
    };

    users[userIndex] = updatedUser;
    await redis.set('users', users);

    // Invalidate all sessions for this user (force re-login)
    const allSessions = await redis.keys('session:*');
    for (const sessionKey of allSessions) {
      const sessionData = await redis.get(sessionKey);
      if (sessionData && sessionData.userId === session.userId) {
        await redis.del(sessionKey);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password changed successfully. You will need to log in again.'
    });
    
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
} 