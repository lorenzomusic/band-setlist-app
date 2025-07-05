import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET() {
  try {
    const songs = await redis.get('songs') || [];
    // Add default language for existing songs
    const songsWithLanguage = songs.map(song => ({
      ...song,
      language: song.language || 'english',
      vocalist: song.vocalist || 'Rikke',
    }));
    return Response.json(songsWithLanguage);
  } catch (error) {
    console.error('Error fetching songs:', error);
    return Response.json({ error: 'Failed to fetch songs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Add language to the destructuring
    const songData = await request.json();
    const { title, artist, key, duration, bassGuitar, guitar, language, vocalist, youtubeLink, backingTrack, form, medley, medleyPosition, notes, tags } = songData;

    // Add language validation
    if (!language || !['danish', 'english'].includes(language.toLowerCase())) {
      return Response.json({ error: 'Language must be either "danish" or "english"' }, { status: 400 });
    }

    // Add vocalist validation
    if (!vocalist || !['Rikke', 'Lorentz', 'Both'].includes(vocalist)) {
      return Response.json({ error: 'Vocalist must be "Rikke", "Lorentz", or "Both"' }, { status: 400 });
    }

    // Add tags validation
    if (!Array.isArray(tags)) {
      songData.tags = [];
    }

    const songs = await redis.get('songs') || [];
    // Generate unique ID
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const songWithId = {
      id,
      title,
      artist,
      key,
      duration,
      bassGuitar,
      guitar,
      language: language.toLowerCase(),
      vocalist,
      youtubeLink,
      backingTrack,
      form,
      medley,
      medleyPosition: medleyPosition ? parseInt(medleyPosition) : null,
      notes,
      tags: songData.tags || [],
    };
    // Clean up the data
    if (!songWithId.medley) {
      songWithId.medley = null;
      songWithId.medleyPosition = null;
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
    
    // Add tags validation
    if (!Array.isArray(updatedSong.tags)) {
      updatedSong.tags = [];
    }
    
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