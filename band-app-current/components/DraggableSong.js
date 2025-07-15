"use client";

import React, { memo, useState } from 'react';

const DraggableSong = memo(({ song, onRemove, isDragDisabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/json', JSON.stringify(song));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) onRemove(song.id);
  };

  return (
    <div
      draggable={!isDragDisabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        song-item p-3 mb-2 rounded-lg border transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        ${!isDragDisabled && !isDragging ? 'hover:bg-gray-50 hover:border-blue-300 hover:shadow-md' : ''}
        ${isDragDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-move'}
        bg-white border-gray-200
      `}
      style={{
        transform: isDragging ? 'translateZ(0)' : 'none',
        willChange: 'transform, opacity'
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {song.title}
          </h4>
          <p className="text-sm text-gray-600 truncate">
            {song.artist}
          </p>
          <div className="flex gap-2 mt-1 text-xs text-gray-500">
            <span>Key: {song.key}</span>
            <span>Duration: {song.duration}</span>
            {song.language && <span>Lang: {song.language}</span>}
          </div>
        </div>
        {onRemove && (
          <button
            onClick={handleRemove}
            className={`
              ml-2 p-1 rounded-full transition-colors
              ${!isDragDisabled ? 'hover:bg-red-100 text-red-600' : 'text-gray-400'}
            `}
            disabled={isDragDisabled}
            title="Remove song"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
});

DraggableSong.displayName = 'DraggableSong';

export default DraggableSong; 