// utils/medley.js
export const getMedleysFromSongs = (songs) => {
  const medleys = {};
  
  songs.forEach(song => {
    if (song.medley && song.medley.trim()) {
      const medleyName = song.medley.trim();
      if (!medleys[medleyName]) {
        medleys[medleyName] = [];
      }
      medleys[medleyName].push(song);
    }
  });
  
  // Sort songs within each medley by medleyPosition
  Object.keys(medleys).forEach(medleyName => {
    medleys[medleyName].sort((a, b) => {
      const posA = parseInt(a.medleyPosition) || 0;
      const posB = parseInt(b.medleyPosition) || 0;
      return posA - posB;
    });
  });
  
  return medleys;
};

export const getMedleyStats = (medley) => {
  const totalDuration = medley.reduce((sum, song) => {
    if (song.duration) {
      // Handle both "MM:SS" and numeric formats
      const duration = typeof song.duration === 'string' ? 
        song.duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0) / 60 :
        song.duration || 0;
      return sum + duration;
    }
    return sum;
  }, 0);
  
  const languages = [...new Set(medley.map(song => song.language).filter(Boolean))];
  const vocalists = [...new Set(medley.map(song => song.vocalist).filter(Boolean))];
  
  return {
    songCount: medley.length,
    totalDuration: Math.round(totalDuration),
    languages,
    vocalists
  };
};

// Add this to your existing utils/medley.js file
export const organizeSetByMedleys = (songs) => {
  const organized = [];
  const processedSongIds = new Set();
  
  // First pass: identify all medleys and their songs
  const medleyGroups = {};
  songs.forEach(song => {
    if (song.medley && song.medley.trim()) {
      const medleyName = song.medley.trim();
      if (!medleyGroups[medleyName]) {
        medleyGroups[medleyName] = [];
      }
      medleyGroups[medleyName].push(song);
    }
  });
  
  // Sort songs within each medley by position
  Object.keys(medleyGroups).forEach(medleyName => {
    medleyGroups[medleyName].sort((a, b) => {
      const posA = parseInt(a.medleyPosition) || 0;
      const posB = parseInt(b.medleyPosition) || 0;
      return posA - posB;
    });
  });
  
  // Second pass: go through songs in original order and create organized structure
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    
    if (processedSongIds.has(song.id)) {
      continue; // Skip if already processed as part of a medley
    }
    
    if (song.medley && song.medley.trim()) {
      const medleyName = song.medley.trim();
      
      // Check if this is the first song of this medley we've encountered
      const medleySongs = medleyGroups[medleyName];
      const isFirstSongOfMedley = medleySongs && medleySongs[0].id === song.id;
      
      if (isFirstSongOfMedley) {
        // Add the entire medley as a group
        organized.push({
          type: 'medley',
          name: medleyName,
          songs: medleySongs,
          id: `medley-${medleyName.toLowerCase().replace(/\s+/g, '-')}`
        });
        
        // Mark all songs in this medley as processed
        medleySongs.forEach(medleySong => processedSongIds.add(medleySong.id));
      }
      // If it's not the first song of the medley, skip it (it will be included when we hit the first song)
    } else {
      // Individual song
      organized.push({
        type: 'song',
        song: song,
        id: song.id
      });
      processedSongIds.add(song.id);
    }
  }
  
  return organized;
};

export const flattenOrganizedSet = (organizedItems) => {
  const flattened = [];
  organizedItems.forEach(item => {
    if (item.type === 'medley') {
      flattened.push(...item.songs);
    } else {
      flattened.push(item.song);
    }
  });
  return flattened;
}; 