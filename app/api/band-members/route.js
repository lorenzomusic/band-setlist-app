import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// GET /api/band-members - Get all band members
export async function GET() {
  try {
    console.log('Attempting to fetch band members from Redis...');
    
    const members = await redis.get('band_members');
    console.log('Redis response:', members);
    
    // If no members exist yet, return empty array
    if (!members || members.length === 0) {
      console.log('No band members found, returning empty array');
      return NextResponse.json([]);
    }
    
    console.log('Returning band members:', members);
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching band members:', error);
    // Return empty array instead of error to prevent frontend crashes
    return NextResponse.json([]);
  }
}

// POST /api/band-members - Create a new band member
export async function POST(request) {
  try {
    console.log('POST request received');
    
    const body = await request.json();
    console.log('Request body parsed:', body);
    
    const { name, instrument, email, userId, isCore = true } = body;

    console.log('Creating band member:', { name, instrument, email, userId, isCore });

    // Validate required fields
    if (!name || !instrument) {
      console.log('Validation failed: missing name or instrument');
      return NextResponse.json(
        { error: 'Name and instrument are required' },
        { status: 400 }
      );
    }

    console.log('Validation passed');

    // Generate unique ID
    const id = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Generated ID:', id);

    const member = {
      id,
      name,
      instrument,
      email: email || null,
      userId: userId || null,
      isCore,
      createdAt: new Date().toISOString()
    };

    console.log('Storing member in Redis with ID:', id);
    console.log('Member data:', member);

    // Get existing members
    console.log('Getting existing members from Redis...');
    const existingMembers = await redis.get('band_members') || [];
    console.log('Existing members:', existingMembers);
    
    // Add new member to array
    const updatedMembers = [...existingMembers, member];
    console.log('Updated members array:', updatedMembers);
    
    // Store updated array in Redis
    console.log('Storing in Redis...');
    await redis.set('band_members', updatedMembers);
    console.log('Successfully stored member in Redis');

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error creating band member:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
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
    const existingMembers = await redis.get('band_members') || [];
    const memberIndex = existingMembers.findIndex(member => member.id === id);

    if (memberIndex === -1) {
      return NextResponse.json(
        { error: 'Band member not found' },
        { status: 404 }
      );
    }

    const updatedMember = {
      ...existingMembers[memberIndex],
      name: name || existingMembers[memberIndex].name,
      instrument: instrument || existingMembers[memberIndex].instrument,
      email: email !== undefined ? email : existingMembers[memberIndex].email,
      userId: userId !== undefined ? userId : existingMembers[memberIndex].userId,
      isCore: isCore !== undefined ? isCore : existingMembers[memberIndex].isCore,
      updatedAt: new Date().toISOString()
    };

    // Update in Redis
    const updatedMembers = [...existingMembers];
    updatedMembers[memberIndex] = updatedMember;
    await redis.set('band_members', updatedMembers);

    return NextResponse.json(updatedMember);
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
    const existingMembers = await redis.get('band_members') || [];
    const initialLength = existingMembers.length;
    const updatedMembers = existingMembers.filter(member => member.id !== id);

    if (updatedMembers.length === initialLength) {
      return NextResponse.json(
        { error: 'Band member not found' },
        { status: 404 }
      );
    }

    // Delete from Redis
    await redis.set('band_members', updatedMembers);

    return NextResponse.json({ message: 'Band member deleted successfully' });
  } catch (error) {
    console.error('Error deleting band member:', error);
    return NextResponse.json(
      { error: 'Failed to delete band member' },
      { status: 500 }
    );
  }
} 