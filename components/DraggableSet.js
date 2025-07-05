"use client";

export default function DraggableSet({ 
  set, 
  index, 
  onRemove,
  dragHandlers,
  isDraggedOver,
  isDragging,
  children,
  totalSets 
}) {
  const {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = dragHandlers;

  const calculateSetDuration = (songs) => {
    if (!songs || songs.length === 0) return '0:00';
    
    const totalSeconds = songs.reduce((total, song) => {
      const [minutes, seconds] = (song.duration || '0:00').split(':').map(Number);
      return total + (minutes * 60) + (seconds || 0);
    }, 0);
    
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleDragEnter(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        className={`
          bg-white rounded-md p-4 mb-3 border cursor-move transition-all duration-200
          ${isDraggedOver ? 'border-blue-400 bg-blue-50 border-2' : 'border-gray-200'}
          ${isDragging ? 'opacity-50' : 'hover:shadow-md hover:border-gray-300'}
        `}
      >
        <div className="flex justify-between items-start mb-3">
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
            
            <div>
              <h4 className="font-bold text-lg text-gray-800">
                Set {index + 1}: {set.name}
              </h4>
              <p className="text-sm text-gray-600">
                {set.songs?.length || 0} songs • {calculateSetDuration(set.songs)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-purple-600 font-semibold">
                {calculateSetDuration(set.songs)}
              </p>
            </div>
            <button
              onClick={() => onRemove(index)}
              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        {children}
        
        {/* Break indicator */}
        {totalSets && index < (totalSets - 1) && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500 italic">
              ☕ Break (15-20 minutes)
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 