import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function POST(request) {
  try {
    const { 
      duration, 
      englishPercentage, 
      energyMix, 
      singerBalance, 
      vibe,
      excludeSongs = [],
      includeSongs = [],
      customInstructions = ''
    } = await request.json();

    // Get all songs from database
    const songs = await redis.get('songs') || [];
    
    if (songs.length === 0) {
      return NextResponse.json({ error: 'No songs found in database' }, { status: 400 });
    }

    // Prepare the prompt for OpenAI
    const prompt = createSetlistPrompt(
      songs, 
      duration, 
      englishPercentage, 
      energyMix, 
      singerBalance, 
      vibe,
      excludeSongs,
      includeSongs,
      customInstructions
    );

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert music curator and setlist builder for live bands. You understand song flow, energy management, and audience engagement. Always return valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;

    // Parse the AI response
    let setlistData;
    try {
      setlistData = JSON.parse(aiResponse);
    } catch (e) {
      // Fallback: try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setlistData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    // Validate and enhance the setlist
    const validatedSetlist = validateAndEnhanceSetlist(setlistData, songs);

    return NextResponse.json({
      success: true,
      setlist: validatedSetlist,
      metadata: {
        totalDuration: calculateTotalDuration(validatedSetlist.songs),
        songCount: validatedSetlist.songs.length,
        englishPercentage: calculateEnglishPercentage(validatedSetlist.songs),
        energyDistribution: calculateEnergyDistribution(validatedSetlist.songs),
        singerBalance: calculateSingerBalance(validatedSetlist.songs)
      }
    });

  } catch (error) {
    console.error('AI Setlist Builder Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate setlist',
      details: error.message 
    }, { status: 500 });
  }
}

function createSetlistPrompt(songs, duration, englishPercentage, energyMix, singerBalance, vibe, excludeSongs, includeSongs, customInstructions) {
  const songList = songs.map(song => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    duration: song.duration,
    key: song.key,
    language: song.language || 'English',
    energy: song.energy || 'Medium',
    leadSinger: song.leadSinger || 'Both',
    tags: song.tags || [],
    notes: song.notes || ''
  }));

  return `
You are building a setlist for a live band performance. Here are the available songs:

${JSON.stringify(songList, null, 2)}

REQUIREMENTS:
- Target Duration: ${duration} minutes
- English Songs: ${englishPercentage}% of the setlist
- Energy Mix: ${energyMix} (e.g., "Balanced", "High Energy", "Mellow", "Building")
- Singer Balance: ${singerBalance} (e.g., "Equal", "Favor Singer A", "Favor Singer B")
- Vibe: ${vibe || 'Crowd-pleasing'}
${excludeSongs.length > 0 ? `- EXCLUDE these songs: ${excludeSongs.join(', ')}` : ''}
${includeSongs.length > 0 ? `- MUST INCLUDE these songs: ${includeSongs.join(', ')}` : ''}
${customInstructions ? `- Additional Instructions: ${customInstructions}` : ''}

SETLIST BUILDING PRINCIPLES:
1. Start with a strong opener to grab attention
2. Build energy gradually in the first third
3. Peak energy in the middle section
4. Strategic slower songs for audience connection
5. Strong closer that leaves them wanting more
6. Consider key changes and transitions between songs
7. Balance different artists/genres throughout
8. Account for performer stamina and vocal rest
9. NEVER repeat the same song - each song should appear only once in the setlist

Return your response as valid JSON in this exact format:
{
  "name": "Generated Setlist Name",
  "songs": [
    {
      "id": "song_id_from_database",
      "position": 1,
      "reasoning": "Why this song is in this position"
    }
  ],
  "totalDuration": estimated_duration_in_minutes,
  "reasoning": "Overall explanation of the setlist flow and strategy",
  "alternativeSongs": [
    {
      "id": "backup_song_id",
      "reasoning": "When/why to use this alternative"
    }
  ]
}

Focus on creating a cohesive musical journey that matches the requested criteria while maintaining good energy flow and audience engagement.
`;
}

function validateAndEnhanceSetlist(setlistData, allSongs) {
  const songMap = new Map(allSongs.map(song => [song.id, song]));
  
  // Validate that all songs exist and remove duplicates
  const seenSongIds = new Set();
  const validatedSongs = setlistData.songs
    .filter(item => {
      // Check if song exists and hasn't been seen before
      if (!songMap.has(item.id) || seenSongIds.has(item.id)) {
        return false;
      }
      seenSongIds.add(item.id);
      return true;
    })
    .map((item, index) => {
      // Get full song data from database
      const fullSongData = songMap.get(item.id);
      
      return {
        // AI-specific fields
        position: index + 1,
        reasoning: item.reasoning,
        
        // Complete song data from database
        id: fullSongData.id,
        title: fullSongData.title,
        artist: fullSongData.artist,
        duration: fullSongData.duration,
        key: fullSongData.key,
        language: fullSongData.language,
        energy: fullSongData.energy,
        leadSinger: fullSongData.leadSinger,
        vocalist: fullSongData.vocalist || fullSongData.leadSinger, // Add this for compatibility
        tags: fullSongData.tags || [],
        notes: fullSongData.notes || '',
        bassGuitar: fullSongData.bassGuitar,
        guitar: fullSongData.guitar,
        backingTrack: fullSongData.backingTrack,
        
        // Any other fields that might exist
        ...fullSongData
      };
    });

  return {
    ...setlistData,
    songs: validatedSongs,
    createdAt: new Date().toISOString(),
    createdBy: 'AI Assistant'
  };
}

function calculateTotalDuration(songs) {
  return songs.reduce((total, song) => {
    const duration = parseFloat(song.duration) || 0;
    return total + duration;
  }, 0);
}

function calculateEnglishPercentage(songs) {
  const englishSongs = songs.filter(song => 
    (song.language || 'English').toLowerCase() === 'english'
  );
  return songs.length > 0 ? Math.round((englishSongs.length / songs.length) * 100) : 0;
}

function calculateEnergyDistribution(songs) {
  const energyCount = {};
  songs.forEach(song => {
    const energy = song.energy || 'Medium';
    energyCount[energy] = (energyCount[energy] || 0) + 1;
  });
  return energyCount;
}

function calculateSingerBalance(songs) {
  const singerCount = {};
  songs.forEach(song => {
    const singer = song.leadSinger || 'Both';
    singerCount[singer] = (singerCount[singer] || 0) + 1;
  });
  return singerCount;
} 