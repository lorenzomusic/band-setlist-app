"use client";

export default function InstrumentChangeIndicator({ previousSong, currentSong, compact = false }) {
  const changes = [];
  
  if (previousSong.bassGuitar !== currentSong.bassGuitar) {
    changes.push(`Bass: ${previousSong.bassGuitar} → ${currentSong.bassGuitar}`);
  }
  
  if (previousSong.guitar !== currentSong.guitar) {
    changes.push(`Guitar: ${previousSong.guitar} → ${currentSong.guitar}`);
  }

  if (changes.length === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-yellow-800 font-medium">
        <span className="text-yellow-600">🔄</span>
        <span>Instrument Change:</span>
        {changes.map((change, index) => (
          <span key={index} className="bg-yellow-200 px-2 py-1 rounded">
            {change}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
      <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
        <span className="text-yellow-600">🔄</span>
        <span>Instrument Change Required</span>
      </div>
      <div className="space-y-1">
        {changes.map((change, index) => (
          <div key={index} className="text-sm text-yellow-700 bg-yellow-100 px-3 py-2 rounded">
            {change}
          </div>
        ))}
      </div>
    </div>
  );
} 