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
    const { name, songs, createdBy, metadata } = await request.json();

    // Get existing sets
    const existingSets = await redis.get('sets') || [];
    
    // Generate unique ID
    const id = 'set_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Get all songs from database to resolve IDs if needed
    const allSongs = await redis.get('songs') || [];
    const songMap = new Map(allSongs.map(song => [song.id, song]));
    
    // Handle both song ID arrays and full song objects
    let processedSongs;
    if (songs.length > 0 && typeof songs[0] === 'string') {
      // Old format: array of song IDs
      processedSongs = songs
        .map(songId => songMap.get(songId))
        .filter(song => song !== undefined);
    } else {
      // New format: array of full song objects (from AI)
      processedSongs = songs.map(song => ({
        ...song,
        // Ensure we have the latest song data from database
        ...(songMap.get(song.id) || {})
      }));
    }

    const newSet = {
      id,
      name,
      songs: processedSongs, // Always store full song objects
      createdAt: new Date().toISOString(),
      createdBy: createdBy || 'User',
      metadata: metadata || {}
    };

    const updatedSets = [...existingSets, newSet];
    await redis.set('sets', updatedSets);

    return Response.json({ 
      success: true, 
      set: newSet,
      message: 'Set created successfully' 
    });
  } catch (error) {
    console.error('Error creating set:', error);
    return Response.json({ 
      error: 'Failed to create set',
      details: error.message 
    }, { status: 500 });
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