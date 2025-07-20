import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// GET /api/band-members - Get all band members
export async function GET() {
  try {
    const members = await redis.hgetall('band_members');
    
    // Convert Redis hash to array of objects
    const membersArray = Object.keys(members).map(id => ({
      id,
      ...JSON.parse(members[id])
    }));

    return NextResponse.json(membersArray);
  } catch (error) {
    console.error('Error fetching band members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch band members' },
      { status: 500 }
    );
  }
}

// POST /api/band-members - Create a new band member
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, instrument, email, userId, isCore = true } = body;

    // Validate required fields
    if (!name || !instrument) {
      return NextResponse.json(
        { error: 'Name and instrument are required' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const member = {
      name,
      instrument,
      email: email || null,
      userId: userId || null,
      isCore,
      createdAt: new Date().toISOString()
    };

    // Store in Redis
    await redis.hset('band_members', id, JSON.stringify(member));

    return NextResponse.json({ id, ...member }, { status: 201 });
  } catch (error) {
    console.error('Error creating band member:', error);
    return NextResponse.json(
      { error: 'Failed to create band member' },
      { status: 500 }
    );
  }
}

// PUT /api/band-members - Update a band member
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, instrument, email, userId, isCore } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Check if member exists
    const existingMember = await redis.hget('band_members', id);
    if (!existingMember) {
      return NextResponse.json(
        { error: 'Band member not found' },
        { status: 404 }
      );
    }

    const existingData = JSON.parse(existingMember);
    const updatedMember = {
      ...existingData,
      name: name || existingData.name,
      instrument: instrument || existingData.instrument,
      email: email !== undefined ? email : existingData.email,
      userId: userId !== undefined ? userId : existingData.userId,
      isCore: isCore !== undefined ? isCore : existingData.isCore,
      updatedAt: new Date().toISOString()
    };

    // Update in Redis
    await redis.hset('band_members', id, JSON.stringify(updatedMember));

    return NextResponse.json({ id, ...updatedMember });
  } catch (error) {
    console.error('Error updating band member:', error);
    return NextResponse.json(
      { error: 'Failed to update band member' },
      { status: 500 }
    );
  }
}

// DELETE /api/band-members - Delete a band member
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Check if member exists
    const existingMember = await redis.hget('band_members', id);
    if (!existingMember) {
      return NextResponse.json(
        { error: 'Band member not found' },
        { status: 404 }
      );
    }

    // Delete from Redis
    await redis.hdel('band_members', id);

    return NextResponse.json({ message: 'Band member deleted successfully' });
  } catch (error) {
    console.error('Error deleting band member:', error);
    return NextResponse.json(
      { error: 'Failed to delete band member' },
      { status: 500 }
    );
  }
} 