import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { config, createKey } from '../../../../../lib/config';

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

// DELETE - Delete invitation
export async function DELETE(request, { params }) {
  try {
    // Check if user is admin
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get existing invitations
    const invitations = await redis.get(createKey('invitations')) || [];
    const updatedInvitations = invitations.filter(inv => inv.id !== id);

    // Update invitations list
    await redis.set(createKey('invitations'), updatedInvitations);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 