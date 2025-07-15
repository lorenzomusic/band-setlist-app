"use client";

export default function SetupSummary({ songs }) {
  if (!songs || songs.length === 0) return null;

  // Get unique instruments needed
  const bassTypes = [...new Set(songs.map(song => song.bassGuitar).filter(Boolean))];
  const guitarTypes = [...new Set(songs.map(song => song.guitar).filter(Boolean))];
  
  // Count instrument changes
  let bassChanges = 0;
  let guitarChanges = 0;
  
  for (let i = 1; i < songs.length; i++) {
    if (songs[i].bassGuitar !== songs[i-1].bassGuitar) bassChanges++;
    if (songs[i].guitar !== songs[i-1].guitar) guitarChanges++;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-blue-900 mb-2">🎸 Setup Summary</h3>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium text-blue-800">Bass Required:</span>
          <div className="mt-1">
            {bassTypes.map((type, index) => (
              <span key={index} className="inline-block mr-2 px-2 py-1 bg-blue-100 rounded">
                {type}
              </span>
            ))}
          </div>
          <div className="text-blue-600 mt-1">
            Changes during set: {bassChanges}
          </div>
        </div>
        
        <div>
          <span className="font-medium text-blue-800">Guitar Required:</span>
          <div className="mt-1">
            {guitarTypes.map((type, index) => (
              <span key={index} className="inline-block mr-2 px-2 py-1 bg-blue-100 rounded">
                {type}
              </span>
            ))}
          </div>
          <div className="text-blue-600 mt-1">
            Changes during set: {guitarChanges}
          </div>
        </div>
      </div>
    </div>
  );
} 