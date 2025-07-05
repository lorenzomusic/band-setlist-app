"use client";

export default function DraggableSong({ 
  song, 
  index, 
  previousSong,
  onRemove,
  dragHandlers,
  isDraggedOver,
  isDragging 
}) {
  const {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = dragHandlers;

  return (
    <div>
      {/* Instrument Change Warning - Separate from draggable */}
      {previousSong && (
        <div className="flex items-center gap-2 px-3 py-1 mb-2 bg-yellow-100 border-l-4 border-yellow-400 text-sm text-yellow-800 rounded-r">
          {previousSong.bassGuitar !== song.bassGuitar && (
            <span>🎸 Bass: {previousSong.bassGuitar} → {song.bassGuitar}</span>
          )}
          {previousSong.guitar !== song.guitar && (
            <span>🎸 Guitar: {previousSong.guitar} → {song.guitar}</span>
          )}
        </div>
      )}

      {/* Simple Draggable Song Card */}
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleDragEnter(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        className={`
          bg-white rounded-md p-4 mb-2 border cursor-move transition-all duration-200
          ${isDraggedOver ? 'border-blue-400 bg-blue-50 border-2' : 'border-gray-200'}
          ${isDragging ? 'opacity-50' : 'hover:shadow-md hover:border-gray-300'}
        `}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            {/* Simple Drag Handle */}
            <div className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-1">
              <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
                <circle cx="4" cy="3" r="1"/>
                <circle cx="8" cy="3" r="1"/>
                <circle cx="4" cy="7" r="1"/>
                <circle cx="8" cy="7" r="1"/>
                <circle cx="4" cy="11" r="1"/>
                <circle cx="8" cy="11" r="1"/>
                <circle cx="4" cy="15" r="1"/>
                <circle cx="8" cy="15" r="1"/>
              </svg>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900">
                  {index + 1}. {song.title}
                </h3>
                {song.language === 'danish' && <span>🇩🇰</span>}
                {song.language === 'english' && <span>🇬🇧</span>}
              </div>
              
              <p className="text-gray-600 mb-2">{song.artist}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {song.key && <span>Key: {song.key}</span>}
                {song.duration && <span>⏱️ {song.duration}</span>}
                <span>🎸 {song.bassGuitar}</span>
                <span>🎸 {song.guitar}</span>
                <span>🎤 {song.vocalist}</span>
                {song.backingTrack && <span>🎵 Track</span>}
              </div>
              
              {song.tags && song.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {song.tags.map((tag, tagIndex) => (
                    <span
                      key={`song-${index}-tag-${tagIndex}`}
                      className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right text-sm text-gray-600">
              <p className="font-medium">{song.key}</p>
              <p>{song.duration}</p>
            </div>
            <button
              onClick={() => onRemove(index)}
              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 