import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { config, createKey } from '../../../../../../lib/config';

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

// Hash password with salt
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Generate temporary password
function generateTemporaryPassword() {
  // Generate a readable temporary password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST - Reset user password
export async function POST(request, { params }) {
  try {
    const session = await verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent admin from resetting their own password
    if (id === session.userId) {
      return NextResponse.json({ error: 'Cannot reset your own password' }, { status: 400 });
    }

    const users = await redis.get(createKey('users')) || [];
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate new temporary password
    const temporaryPassword = generateTemporaryPassword();
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = hashPassword(temporaryPassword, salt);

    // Update user with new password
    const updatedUser = {
      ...users[userIndex],
      passwordHash: hashedPassword,
      salt: salt,
      passwordResetAt: new Date().toISOString()
    };

    users[userIndex] = updatedUser;
    await redis.set(createKey('users'), users);

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset successfully',
      temporaryPassword: temporaryPassword
    });
    
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
} 