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
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Check if this is the first time setup (admin only)
    const existingAuth = await redis.get('auth_config');
    const users = await redis.get('users') || [];
    
    if (!existingAuth && users.length === 0) {
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
        userId: 'admin',
        username: 'admin',
        isAdmin: true,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      await redis.set(`session:${sessionToken}`, sessionData, { ex: 24 * 60 * 60 });
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'Admin account created and logged in',
        isFirstTime: true,
        user: {
          id: 'admin',
          username: 'admin',
          isAdmin: true
        }
      });
      
      response.cookies.set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60
      });
      
      return response;
    }

    // Check for admin login (legacy support)
    if (username === 'admin' && existingAuth) {
      const hashedPassword = hashPassword(password, existingAuth.salt);
      
      if (hashedPassword === existingAuth.passwordHash) {
        // Update last login
        await redis.set('auth_config', {
          ...existingAuth,
          lastLogin: new Date().toISOString()
        });
        
        // Create session
        const sessionToken = generateSessionToken();
        const sessionData = {
          token: sessionToken,
          userId: 'admin',
          username: 'admin',
          isAdmin: true,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        
        await redis.set(`session:${sessionToken}`, sessionData, { ex: 24 * 60 * 60 });
        
        const response = NextResponse.json({ 
          success: true, 
          message: 'Admin logged in successfully',
          isFirstTime: false,
          user: {
            id: 'admin',
            username: 'admin',
            isAdmin: true
          }
        });
        
        response.cookies.set('session', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60
        });
        
        return response;
      }
    }

    // Check for regular user login
    const user = users.find(u => u.username === username && u.isActive);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Verify password
    const hashedPassword = hashPassword(password, user.salt);
    
    if (hashedPassword !== user.passwordHash) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Update last login
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u
    );
    await redis.set('users', updatedUsers);

    // Create session
    const sessionToken = generateSessionToken();
    const sessionData = {
      token: sessionToken,
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    await redis.set(`session:${sessionToken}`, sessionData, { ex: 24 * 60 * 60 });

    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged in successfully',
      isFirstTime: false,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
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