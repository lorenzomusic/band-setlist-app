import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { config, createKey } from '../../../lib/config';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Get specific rehearsal
      const rehearsal = await redis.hgetall(createKey(`rehearsal:${id}`));
      if (!rehearsal || Object.keys(rehearsal).length === 0) {
        return NextResponse.json({ error: 'Rehearsal not found' }, { status: 404 });
      }
      return NextResponse.json(rehearsal);
    } else {
      // Get all rehearsals
      const keys = await redis.keys(createKey('rehearsal:*'));
      const rehearsals = [];
      
      for (const key of keys) {
        const rehearsal = await redis.hgetall(key);
        if (rehearsal && Object.keys(rehearsal).length > 0) {
          rehearsals.push(rehearsal);
        }
      }
      
      // Sort by date and start time
      rehearsals.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare === 0) {
          return a.startTime.localeCompare(b.startTime);
        }
        return dateCompare;
      });
      
      return NextResponse.json(rehearsals);
    }
  } catch (error) {
    console.error('Error fetching rehearsals:', error);
    return NextResponse.json({ error: 'Failed to fetch rehearsals' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, date, startTime, endTime, notes } = body;

    if (!name || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Name, date, start time, and end time are required' },
        { status: 400 }
      );
    }

    const id = `rehearsal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const rehearsal = {
      id,
      name,
      date,
      startTime,
      endTime,
      notes: notes || '',
      status: 'planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await redis.hset(createKey(`rehearsal:${id}`), rehearsal);
    return NextResponse.json(rehearsal, { status: 201 });
  } catch (error) {
    console.error('Error creating rehearsal:', error);
    return NextResponse.json({ error: 'Failed to create rehearsal' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rehearsal ID is required' }, { status: 400 });
    }

    const existingRehearsal = await redis.hgetall(createKey(`rehearsal:${id}`));
    if (!existingRehearsal || Object.keys(existingRehearsal).length === 0) {
      return NextResponse.json({ error: 'Rehearsal not found' }, { status: 404 });
    }

    const updatedRehearsal = {
      ...existingRehearsal,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await redis.hset(createKey(`rehearsal:${id}`), updatedRehearsal);
    return NextResponse.json(updatedRehearsal);
  } catch (error) {
    console.error('Error updating rehearsal:', error);
    return NextResponse.json({ error: 'Failed to update rehearsal' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rehearsal ID is required' }, { status: 400 });
    }

    const rehearsal = await redis.hgetall(createKey(`rehearsal:${id}`));
    if (!rehearsal || Object.keys(rehearsal).length === 0) {
      return NextResponse.json({ error: 'Rehearsal not found' }, { status: 404 });
    }

    await redis.del(createKey(`rehearsal:${id}`));
    return NextResponse.json({ message: 'Rehearsal deleted successfully' });
  } catch (error) {
    console.error('Error deleting rehearsal:', error);
    return NextResponse.json({ error: 'Failed to delete rehearsal' }, { status: 500 });
  }
}