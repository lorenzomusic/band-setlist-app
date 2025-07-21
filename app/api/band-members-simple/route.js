import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET() {
  try {
    const members = await redis.get('band_members') || [];
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, instrument } = body;

    if (!name || !instrument) {
      return NextResponse.json(
        { error: 'Name and instrument are required' },
        { status: 400 }
      );
    }

    const member = {
      id: `member_${Date.now()}`,
      name,
      instrument,
      isCore: true,
      createdAt: new Date().toISOString()
    };

    const existingMembers = await redis.get('band_members') || [];
    const updatedMembers = [...existingMembers, member];
    await redis.set('band_members', updatedMembers);

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create band member' },
      { status: 500 }
    );
  }
} 