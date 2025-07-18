"use client";

import { useState, useEffect } from 'react';

export default function PerformanceView() {
  const [gigs, setGigs] = useState([]);
  const [selectedGig, setSelectedGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('Starting...');

  useEffect(() => {
    loadGigs();
  }, []);

  const loadGigs = async () => {
    try {
      setDebugInfo('Loading gigs...');
      const response = await fetch('/api/gigs');
      const gigsData = await response.json();
      
      const validGigs = (gigsData || []).filter(gig => 
        gig.sets && gig.sets.length > 0
      );
      
      setGigs(validGigs);
      setSelectedGig(null);
      setDebugInfo(`Loaded ${validGigs.length} gigs`);
      setLoading(false);
    } catch (error) {
      setDebugInfo(`Error: ${error.message}`);
      setLoading(false);
    }
  };

  const selectGig = (gig) => {
    setDebugInfo(`Selecting: ${gig.name}`);
    setSelectedGig(gig);
  };

  const backToSelection = () => {
    setSelectedGig(null);
    setDebugInfo('Back to selection');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-100 border border-yellow-400 rounded p-4 mb-6">
          <h3 className="font-bold">🔍 Debug Info:</h3>
          <p>Status: Loading...</p>
          <p>Debug: {debugInfo}</p>
        </div>
        <p>Loading performance data...</p>
      </div>
    );
  }

  if (!selectedGig) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* DEBUG BOX - This should be visible */}
        <div className="bg-yellow-100 border border-yellow-400 rounded p-4 mb-6">
          <h3 className="font-bold text-yellow-800">🔍 SIMPLE DEBUG INFO:</h3>
          <p><strong>Selected Gig:</strong> {selectedGig ? selectedGig.name : 'NULL'}</p>
          <p><strong>Available Gigs:</strong> {gigs.length}</p>
          <p><strong>Debug Status:</strong> {debugInfo}</p>
          <p><strong>Component State:</strong> Selection Screen</p>
        </div>

        <h1 className="text-3xl font-bold mb-6">🎭 Performance Mode (Simple Debug)</h1>
        
        <p className="text-gray-600 mb-6">Select a gig to perform:</p>
        
        {gigs.length === 0 ? (
          <div className="bg-red-100 border border-red-400 rounded p-4">
            <h3 className="font-bold text-red-800">No Gigs Found</h3>
            <p>Create some gigs with sets first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {gigs.map((gig, index) => (
              <div key={gig.id || index} className="border border-gray-300 rounded p-4 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">{gig.name}</h3>
                    <p className="text-gray-600 text-sm">
                      {gig.sets?.length || 0} sets
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      alert(`Button clicked for: ${gig.name}`);
                      selectGig(gig);
                    }}
                    className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    🎭 Perform This Gig
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Debug Controls:</h3>
          <button
            onClick={() => {
              alert('Reload button clicked');
              loadGigs();
            }}
            className="px-4 py-2 bg-blue text-white rounded hover:bg-blue"
          >
            Reload Gigs
          </button>
        </div>
      </div>
    );
  }

  // Performance Mode
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* DEBUG BOX - Performance Mode */}
      <div className="bg-green-100 border border-green-400 rounded p-4 mb-6">
        <h3 className="font-bold text-green-800">🔍 PERFORMANCE MODE DEBUG:</h3>
        <p><strong>Selected Gig:</strong> {selectedGig.name}</p>
        <p><strong>Gig ID:</strong> {selectedGig.id}</p>
        <p><strong>Sets Count:</strong> {selectedGig.sets?.length || 0}</p>
        <p><strong>Component State:</strong> Performance Mode</p>
      </div>

      <div className="bg-gray-900 text-white p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">{selectedGig.name}</h1>
            <p>Performance Mode - {selectedGig.sets?.length || 0} sets</p>
          </div>
          <button
            onClick={backToSelection}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            ← Back to Selection
          </button>
        </div>

        <div className="space-y-4">
          {selectedGig.sets?.map((set, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded">
              <h3 className="text-lg font-bold">Set {index + 1}: {set.name}</h3>
              <p>{set.songs?.length || 0} songs</p>
            </div>
          )) || <p>No sets in this gig</p>}
        </div>
      </div>
    </div>
  );
}