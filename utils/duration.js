export const formatDuration = (duration) => {
  // Handle both number (4.1) and string ("4:06") formats
  let totalMinutes;
  
  if (typeof duration === 'string' && duration.includes(':')) {
    // String format like "4:06"
    const [mins, secs] = duration.split(':').map(Number);
    totalMinutes = mins + (secs / 60);
  } else if (typeof duration === 'number') {
    // Number format like 4.1
    totalMinutes = duration;
  } else {
    // Fallback - try to parse as number
    totalMinutes = parseFloat(duration) || 0;
  }
  
  const mins = Math.floor(totalMinutes);
  const secs = Math.round((totalMinutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const parseDuration = (duration) => {
  // Convert any duration format to decimal minutes
  if (typeof duration === 'number') {
    return duration;
  }
  
  if (typeof duration === 'string' && duration.includes(':')) {
    const [mins, secs] = duration.split(':').map(Number);
    return mins + (secs / 60);
  }
  
  return parseFloat(duration) || 0;
};

export const calculateTotalDuration = (songs) => {
  return songs.reduce((total, song) => {
    return total + parseDuration(song.duration);
  }, 0);
};

export const safeDuration = (duration) => {
  if (typeof duration === 'number') return duration;
  if (typeof duration === 'string' && duration.includes(':')) {
    const [mins, secs] = duration.split(':').map(Number);
    return mins + (secs / 60);
  }
  return parseFloat(duration) || 0;
}; 