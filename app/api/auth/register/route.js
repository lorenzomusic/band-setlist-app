import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { config, createKey } from '../../../../lib/config';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

// Hash password with salt
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Generate session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Generate user ID
function generateUserId() {
  return `user_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

export async function POST(request) {
  try {
    const { username, email, password, invitationCode } = await request.json();
    
    if (!username || !email || !password || !invitationCode) {
      return NextResponse.json({ 
        error: 'Username, email, password, and invitation code are required' 
      }, { status: 400 });
    }

    // Validate input
    if (username.length < 3) {
      return NextResponse.json({ 
        error: 'Username must be at least 3 characters long' 
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({ 
        error: 'Please provide a valid email address' 
      }, { status: 400 });
    }

    // Validate invitation code
    const invitations = await redis.get(createKey('invitations')) || [];
    const invitation = invitations.find(inv => inv.code === invitationCode);

    if (!invitation) {
      return NextResponse.json({ 
        error: 'Invalid invitation code' 
      }, { status: 400 });
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json({ 
        error: 'Invitation has expired' 
      }, { status: 400 });
    }

    if (invitation.usedAt) {
      return NextResponse.json({ 
        error: 'Invitation has already been used' 
      }, { status: 400 });
    }

    // Check if username already exists
    const existingUsers = await redis.get(createKey('users')) || [];
    const usernameExists = existingUsers.some(user => user.username === username);
    const emailExists = existingUsers.some(user => user.email === email);

    if (usernameExists) {
      return NextResponse.json({ 
        error: 'Username already exists' 
      }, { status: 409 });
    }

    if (emailExists) {
      return NextResponse.json({ 
        error: 'Email already registered' 
      }, { status: 409 });
    }

    // Create new user
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = hashPassword(password, salt);
    
    const newUser = {
      id: generateUserId(),
      username,
      email,
      passwordHash: hashedPassword,
      salt,
      isAdmin: invitation.role === 'admin',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    };

    // Add user to users list
    const updatedUsers = [...existingUsers, newUser];
    await redis.set(createKey('users'), updatedUsers);

    // Mark invitation as used
    const updatedInvitations = invitations.map(inv => 
      inv.code === invitationCode 
        ? { ...inv, usedAt: new Date().toISOString() }
        : inv
    );
    await redis.set(createKey('invitations'), updatedInvitations);

    // Create session for the new user
    const sessionToken = generateSessionToken();
    const sessionData = {
      token: sessionToken,
      userId: newUser.id,
      username: newUser.username,
      isAdmin: newUser.isAdmin,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    await redis.set(createKey(`session:${sessionToken}`), sessionData, { ex: 24 * 60 * 60 });

    const response = NextResponse.json({ 
      success: true, 
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.isAdmin
      }
    });
    
    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60
    });
    
    return response;
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
} 