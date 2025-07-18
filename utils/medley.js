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