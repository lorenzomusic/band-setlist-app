import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Generate invitation ID
function generateInvitationId() {
  return `invite_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

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

// GET - List all invitations
export async function GET(request) {
  try {
    // Check if user is admin
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invitations = await redis.get('invitations') || [];

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new invitation
export async function POST(request) {
  try {
    // Check if user is admin
    const session = await verifyAdminSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role, expiresIn } = await request.json();

    // Validate input
    if (!email || !role || !expiresIn) {
      return NextResponse.json({ error: 'Email, role, and expiration are required' }, { status: 400 });
    }

    if (!['admin', 'member', 'guest'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Generate unique invitation code
    const code = crypto.randomBytes(16).toString('hex');
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));

    // Create invitation
    const invitation = {
      id: generateInvitationId(),
      email,
      role,
      code,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      usedAt: null
    };

    // Add invitation to list
    const existingInvitations = await redis.get('invitations') || [];
    const updatedInvitations = [...existingInvitations, invitation];
    await redis.set('invitations', updatedInvitations);

    return NextResponse.json(invitation);
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 