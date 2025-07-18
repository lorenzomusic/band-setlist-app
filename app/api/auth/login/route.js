import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Hash password with salt
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Generate session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Check if this is the first time setup
    const existingAuth = await redis.get('auth_config');
    
    if (!existingAuth) {
      // First time setup - create admin account
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = hashPassword(password, salt);
      
      const authConfig = {
        passwordHash: hashedPassword,
        salt: salt,
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
      
      await redis.set('auth_config', authConfig);
      
      // Create session
      const sessionToken = generateSessionToken();
      const sessionData = {
        token: sessionToken,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        isAdmin: true
      };
      
      await redis.set(`session:${sessionToken}`, sessionData, { ex: 24 * 60 * 60 }); // 24 hours TTL
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'Admin account created and logged in',
        isFirstTime: true
      });
      
      // Set session cookie
      response.cookies.set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 hours
      });
      
      return response;
    }
    
    // Existing login - verify password
    const hashedPassword = hashPassword(password, existingAuth.salt);
    
    if (hashedPassword !== existingAuth.passwordHash) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    
    // Update last login
    await redis.set('auth_config', {
      ...existingAuth,
      lastLogin: new Date().toISOString()
    });
    
    // Create session
    const sessionToken = generateSessionToken();
    const sessionData = {
      token: sessionToken,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isAdmin: true
    };
    
    await redis.set(`session:${sessionToken}`, sessionData, { ex: 24 * 60 * 60 });
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged in successfully',
      isFirstTime: false
    });
    
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
} 