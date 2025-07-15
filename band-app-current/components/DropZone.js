"use client";

import React, { memo, useState } from 'react';

const DropZone = memo(({ 
  children, 
  onDrop, 
  className = '',
  activeClassName = 'border-blue-400 bg-blue-50',
  placeholder = 'Drop songs here...'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragOver = (e) => {
    if (!e || typeof e.preventDefault !== 'function') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    if (!e || typeof e.preventDefault !== 'function') return;
    e.preventDefault();
    setIsHovered(true);
  };

  const handleDragLeave = (e) => {
    if (!e || typeof e.preventDefault !== 'function') return;
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsHovered(false);
    }
  };

  const handleDrop = (e) => {
    if (!e || typeof e.preventDefault !== 'function') {
      console.error('Invalid drop event:', e);
      return;
    }
    e.preventDefault();
    setIsHovered(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/json'));
      if (onDrop && data) {
        onDrop(data);
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  const showDropIndicator = isHovered;

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        min-h-[100px] p-4 border-2 border-dashed rounded-lg transition-all duration-200
        ${showDropIndicator ? activeClassName : 'border-gray-300'}
        ${className}
      `}
    >
      {children && children.length > 0 ? (
        <div className="space-y-2">
          {children}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          {showDropIndicator ? (
            <div className="text-blue-600 font-medium">
              Release to add song
            </div>
          ) : (
            placeholder
          )}
        </div>
      )}
    </div>
  );
});

DropZone.displayName = 'DropZone';

export default DropZone; 