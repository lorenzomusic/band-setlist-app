import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET() {
  try {
    const sets = await redis.get('sets') || [];
    return Response.json(sets);
  } catch (error) {
    console.error('Error fetching sets:', error);
    return Response.json({ error: 'Failed to fetch sets' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newSet = await request.json();
    const sets = await redis.get('sets') || [];
    
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const setWithId = {
      ...newSet,
      id
    };
    
    sets.push(setWithId);
    await redis.set('sets', sets);
    
    return Response.json(setWithId, { status: 201 });
  } catch (error) {
    console.error('Error creating set:', error);
    return Response.json({ error: 'Failed to create set' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const updatedSet = await request.json();
    const sets = await redis.get('sets') || [];
    
    const index = sets.findIndex(set => String(set.id) === String(updatedSet.id));
    if (index !== -1) {
      sets[index] = updatedSet;
      await redis.set('sets', sets);
      return Response.json(updatedSet);
    } else {
      return Response.json({ error: 'Set not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating set:', error);
    return Response.json({ error: 'Failed to update set' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json({ error: 'Set ID is required' }, { status: 400 });
    }
    
    const sets = await redis.get('sets') || [];
    
    const filteredSets = sets.filter(set => String(set.id) !== String(id));
    
    if (filteredSets.length === sets.length) {
      return Response.json({ error: 'Set not found' }, { status: 404 });
    }
    
    await redis.set('sets', filteredSets);
    return Response.json({ message: 'Set deleted successfully' });
  } catch (error) {
    console.error('Error deleting set:', error);
    return Response.json({ error: 'Failed to delete set' }, { status: 500 });
  }
}