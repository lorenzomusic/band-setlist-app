import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// GET /api/availability - Get availability for a specific date range
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate parameters are required' },
        { status: 400 }
      );
    }

    console.log('Fetching availability for date range:', { startDate, endDate });

    // Get all availability entries with error handling
    let allAvailability;
    try {
      allAvailability = await redis.get('availability');
    } catch (error) {
      console.log('Redis data type conflict in GET, clearing corrupted data...');
      await redis.del('availability');
      allAvailability = null;
    }
    
    const availabilityArray = Array.isArray(allAvailability) ? allAvailability : [];
    
    // Filter by date range
    const filteredAvailability = availabilityArray.filter(entry => {
      const entryDate = entry.dateString;
      return entryDate >= startDate && entryDate <= endDate;
    });

    console.log('Returning availability entries:', filteredAvailability.length);
    return NextResponse.json(filteredAvailability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

// POST /api/availability - Create or update availability entry
export async function POST(request) {
  try {
    const body = await request.json();
    const { dateString, memberId, status, comment = '' } = body;

    console.log('Creating/updating availability:', { dateString, memberId, status, comment });

    // Validate required fields
    if (!dateString || !memberId || !status) {
      return NextResponse.json(
        { error: 'dateString, memberId, and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['available', 'maybe', 'unavailable'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be available, maybe, or unavailable' },
        { status: 400 }
      );
    }

    // Validate date format (DD-MM-YYYY)
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dateRegex.test(dateString)) {
      return NextResponse.json(
        { error: 'dateString must be in DD-MM-YYYY format' },
        { status: 400 }
      );
    }

    // Generate unique ID for the availability entry
    const id = `availability_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const availabilityEntry = {
      id,
      dateString,
      memberId,
      status,
      comment,
      createdAt: new Date().toISOString()
    };

    // Get existing availability entries with error handling
    let existingAvailability;
    try {
      existingAvailability = await redis.get('availability');
    } catch (error) {
      console.log('Redis data type conflict in POST, clearing corrupted data...');
      await redis.del('availability');
      existingAvailability = null;
    }
    
    const availabilityArray = Array.isArray(existingAvailability) ? existingAvailability : [];
    
    // Check if an entry already exists for this date and member
    const existingIndex = availabilityArray.findIndex(
      entry => entry.dateString === dateString && entry.memberId === memberId
    );

    let updatedAvailability;
    if (existingIndex !== -1) {
      // Update existing entry
      availabilityArray[existingIndex] = {
        ...availabilityArray[existingIndex],
        status,
        comment,
        updatedAt: new Date().toISOString()
      };
      updatedAvailability = availabilityArray;
    } else {
      // Add new entry
      updatedAvailability = [...availabilityArray, availabilityEntry];
    }

    // Store in Redis
    await redis.set('availability', updatedAvailability);

    console.log('Successfully stored availability entry');
    return NextResponse.json(availabilityEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating availability entry:', error);
    return NextResponse.json(
      { error: 'Failed to create availability entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/availability - Delete availability entry
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Availability entry ID is required' },
        { status: 400 }
      );
    }

    // Get existing availability entries with error handling
    let existingAvailability;
    try {
      existingAvailability = await redis.get('availability');
    } catch (error) {
      console.log('Redis data type conflict in DELETE, clearing corrupted data...');
      await redis.del('availability');
      existingAvailability = null;
    }
    
    const availabilityArray = Array.isArray(existingAvailability) ? existingAvailability : [];
    const updatedAvailability = availabilityArray.filter(entry => entry.id !== id);

    if (updatedAvailability.length === availabilityArray.length) {
      return NextResponse.json(
        { error: 'Availability entry not found' },
        { status: 404 }
      );
    }

    // Store updated array in Redis
    await redis.set('availability', updatedAvailability);

    return NextResponse.json({ message: 'Availability entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting availability entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete availability entry' },
      { status: 500 }
    );
  }
} 