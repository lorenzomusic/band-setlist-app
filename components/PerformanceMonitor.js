"use client";

import React, { useState, useEffect, useRef } from 'react';

const PerformanceMonitor = ({ enabled = false }) => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    maxRenderTime: 0,
    minRenderTime: Infinity
  });
  
  const renderTimes = useRef([]);
  const lastUpdate = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const now = performance.now();
    const timeSinceLastUpdate = now - lastUpdate.current;
    
    // Only update every 100ms to avoid excessive re-renders
    if (timeSinceLastUpdate < 100) return;
    
    renderTimes.current.push(timeSinceLastUpdate);
    
    // Keep only last 50 measurements
    if (renderTimes.current.length > 50) {
      renderTimes.current.shift();
    }
    
    const total = renderTimes.current.reduce((sum, time) => sum + time, 0);
    const average = total / renderTimes.current.length;
    const max = Math.max(...renderTimes.current);
    const min = Math.min(...renderTimes.current);
    
    setMetrics({
      renderCount: renderTimes.current.length,
      averageRenderTime: average,
      maxRenderTime: max,
      minRenderTime: min
    });
    
    lastUpdate.current = now;
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="mb-2 font-bold">Performance Monitor</div>
      <div>Renders: {metrics.renderCount}</div>
      <div>Avg: {metrics.averageRenderTime.toFixed(2)}ms</div>
      <div>Max: {metrics.maxRenderTime.toFixed(2)}ms</div>
      <div>Min: {metrics.minRenderTime.toFixed(2)}ms</div>
      <div className="mt-1 text-yellow-300">
        {metrics.averageRenderTime > 16 ? '⚠️ Slow' : '✅ Fast'}
      </div>
    </div>
  );
};

export default PerformanceMonitor; 