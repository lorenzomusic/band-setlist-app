import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET() {
  try {
    const songs = await redis.get('songs') || [];
    return Response.json(songs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    return Response.json({ error: 'Failed to fetch songs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newSong = await request.json();
    const songs = await redis.get('songs') || [];
    
    // Generate unique ID
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const songWithId = {
      ...newSong,
      id
    };
    
    // Clean up the data
    if (!songWithId.medley) {
      songWithId.medley = null;
      songWithId.medleyPosition = null;
    } else if (songWithId.medleyPosition) {
      songWithId.medleyPosition = parseInt(songWithId.medleyPosition);
    }
    
    songs.push(songWithId);
    await redis.set('songs', songs);
    
    return Response.json(songWithId, { status: 201 });
  } catch (error) {
    console.error('Error creating song:', error);
    return Response.json({ error: 'Failed to create song' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const updatedSong = await request.json();
    const songs = await redis.get('songs') || [];
    
    const index = songs.findIndex(song => song.id === updatedSong.id);
    if (index !== -1) {
      // Clean up the data
      if (!updatedSong.medley) {
        updatedSong.medley = null;
        updatedSong.medleyPosition = null;
      } else if (updatedSong.medleyPosition) {
        updatedSong.medleyPosition = parseInt(updatedSong.medleyPosition);
      }
      
      songs[index] = updatedSong;
      await redis.set('songs', songs);
      return Response.json(updatedSong);
    } else {
      return Response.json({ error: 'Song not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating song:', error);
    return Response.json({ error: 'Failed to update song' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json({ error: 'Song ID is required' }, { status: 400 });
    }
    
    const songs = await redis.get('songs') || [];
    const filteredSongs = songs.filter(song => song.id !== id);
    
    if (filteredSongs.length === songs.length) {
      return Response.json({ error: 'Song not found' }, { status: 404 });
    }
    
    await redis.set('songs', filteredSongs);
    return Response.json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Error deleting song:', error);
    return Response.json({ error: 'Failed to delete song' }, { status: 500 });
  }
}