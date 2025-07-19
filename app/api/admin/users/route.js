import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Verify admin session
async function verifyAdminSession(request) {
  try {
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    const sessionData = await redis.get(`session:${sessionToken}`);
    
    if (!sessionData || !sessionData.isAdmin) {
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

// GET - List all users (admin only)
export async function GET(request) {
  try {
    const session = await verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const users = await redis.get('users') || [];
    
    // Return users without sensitive data
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));

    return NextResponse.json(safeUsers);
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PUT - Update user (admin only)
export async function PUT(request) {
  try {
    const session = await verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, updates } = await request.json();
    
    if (!userId || !updates) {
      return NextResponse.json({ error: 'User ID and updates are required' }, { status: 400 });
    }

    const users = await redis.get('users') || [];
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user (only allow certain fields to be updated)
    const allowedUpdates = ['isAdmin', 'isActive'];
    const updatedUser = { ...users[userIndex] };
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updatedUser[key] = updates[key];
      }
    });

    users[userIndex] = updatedUser;
    await redis.set('users', users);

    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(request) {
  try {
    const session = await verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === session.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const users = await redis.get('users') || [];
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove user
    users.splice(userIndex, 1);
    await redis.set('users', users);

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
} 