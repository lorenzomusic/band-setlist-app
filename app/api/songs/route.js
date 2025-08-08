import { Redis } from '@upstash/redis';
import { config, createKey } from '../../../lib/config';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

export async function GET() {
  try {
    let songs;
    try {
      songs = await redis.get(createKey('songs'));
    } catch (error) {
      console.log('Redis data type conflict in GET, clearing corrupted data...');
      await redis.del(createKey('songs'));
      songs = null;
    }
    
    const songsArray = Array.isArray(songs) ? songs : [];
    
    // Add default language for existing songs
    const songsWithLanguage = songsArray.map(song => ({
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
    const { title, artist, key, duration, bassGuitar, guitar, language, vocalist, youtubeLink, spotifyUrl, backingTrack, form, medley, medleyPosition, notes, tags } = songData;

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

    // Get existing songs with error handling
    let songs;
    try {
      songs = await redis.get(createKey('songs'));
    } catch (error) {
      console.log('Redis data type conflict in POST, clearing corrupted data...');
      await redis.del(createKey('songs'));
      songs = null;
    }
    
    const songsArray = Array.isArray(songs) ? songs : [];
    
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
      spotifyUrl,
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
    songsArray.push(songWithId);
    await redis.set(createKey('songs'), songsArray);
    return Response.json(songWithId, { status: 201 });
  } catch (error) {
    console.error('Error creating song:', error);
    return Response.json({ error: 'Failed to create song' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const songData = await request.json();
    const { id, title, artist, key, duration, bassGuitar, guitar, language, vocalist, youtubeLink, spotifyUrl, backingTrack, form, medley, medleyPosition, notes, tags } = songData;

    if (!id) {
      return Response.json({ error: 'Song ID is required' }, { status: 400 });
    }

    // Add language validation
    if (!language || !['danish', 'english'].includes(language.toLowerCase())) {
      return Response.json({ error: 'Language must be either "danish" or "english"' }, { status: 400 });
    }

    // Add vocalist validation
    if (!vocalist || !['Rikke', 'Lorentz', 'Both'].includes(vocalist)) {
      return Response.json({ error: 'Vocalist must be "Rikke", "Lorentz", or "Both"' }, { status: 400 });
    }

    // Get existing songs with error handling
    let songs;
    try {
      songs = await redis.get(createKey('songs'));
    } catch (error) {
      console.log('Redis data type conflict in PUT, clearing corrupted data...');
      await redis.del(createKey('songs'));
      songs = null;
    }
    
    const songsArray = Array.isArray(songs) ? songs : [];
    const songIndex = songsArray.findIndex(song => song.id === id);

    if (songIndex === -1) {
      return Response.json({ error: 'Song not found' }, { status: 404 });
    }

    // Update the song
    const updatedSong = {
      ...songsArray[songIndex],
      title,
      artist,
      key,
      duration,
      bassGuitar,
      guitar,
      language: language.toLowerCase(),
      vocalist,
      youtubeLink,
      spotifyUrl,
      backingTrack,
      form,
      medley,
      medleyPosition: medleyPosition ? parseInt(medleyPosition) : null,
      notes,
      tags: Array.isArray(tags) ? tags : [],
    };

    // Clean up the data
    if (!updatedSong.medley) {
      updatedSong.medley = null;
      updatedSong.medleyPosition = null;
    }

    songsArray[songIndex] = updatedSong;
    await redis.set(createKey('songs'), songsArray);
    return Response.json(updatedSong);
  } catch (error) {
    console.error('Error updating song:', error);
    return Response.json({ error: 'Failed to update song' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Song ID is required' }, { status: 400 });
    }

    // Get existing songs with error handling
    let songs;
    try {
      songs = await redis.get(createKey('songs'));
    } catch (error) {
      console.log('Redis data type conflict in DELETE, clearing corrupted data...');
      await redis.del(createKey('songs'));
      songs = null;
    }
    
    const songsArray = Array.isArray(songs) ? songs : [];
    const songIndex = songsArray.findIndex(song => song.id === id);

    if (songIndex === -1) {
      return Response.json({ error: 'Song not found' }, { status: 404 });
    }

    // Remove the song
    songsArray.splice(songIndex, 1);
    await redis.set(createKey('songs'), songsArray);
    
    return Response.json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Error deleting song:', error);
    return Response.json({ error: 'Failed to delete song' }, { status: 500 });
  }
}