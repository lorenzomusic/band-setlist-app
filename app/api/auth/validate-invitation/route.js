import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Invitation code is required' }, { status: 400 });
    }

    // Get all invitations
    const invitations = await redis.get('invitations') || [];
    
    // Find the invitation with this code
    const invitation = invitations.find(inv => inv.code === code);

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 });
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    // Check if invitation has already been used
    if (invitation.usedAt) {
      return NextResponse.json({ error: 'Invitation has already been used' }, { status: 409 });
    }

    // Return invitation details (without sensitive info)
    return NextResponse.json({
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt
    });

  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 