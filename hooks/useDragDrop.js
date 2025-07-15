"use client";

import { useState, useCallback, useRef } from 'react';

export const useDragDrop = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const dragRef = useRef(null);
  const dropRef = useRef(null);

  // Throttle function to limit event frequency
  const throttle = useCallback((func, delay) => {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }, []);

  const handleDragStart = useCallback((e, item) => {
    setIsDragging(true);
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/json', JSON.stringify(item));
    
    // Hide default drag image for better UX
    const emptyImg = new Image();
    emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(emptyImg, 0, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
  }, []);

  // Throttled drag over handler
  const handleDragOver = useCallback(throttle((e) => {
    e.preventDefault(); // CRITICAL: Allow drop
    e.dataTransfer.dropEffect = 'move';
  }, 16), []); // ~60fps

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e, onDrop) => {
    e.preventDefault();
    setIsDragging(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/json'));
      if (onDrop && data) {
        onDrop(data);
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
    
    setDraggedItem(null);
  }, []);

  return {
    isDragging,
    draggedItem,
    dragRef,
    dropRef,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  };
}; 