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

// PUT - Update specific user
export async function PUT(request, { params }) {
  try {
    const session = await verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const updates = await request.json();

    const users = await redis.get('users') || [];
    const userIndex = users.findIndex(u => u.id === id);
    
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
      message: 'User updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete specific user
export async function DELETE(request, { params }) {
  try {
    const session = await verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent admin from deleting themselves
    if (id === session.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const users = await redis.get('users') || [];
    const userIndex = users.findIndex(u => u.id === id);
    
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