'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ApplePanel from './ui/ApplePanel';
import ApplePanelHeader from './ui/ApplePanelHeader';
import AppleButton from './ui/AppleButton';
import AppleSearchInput from './ui/AppleSearchInput';
import AppleMetadataBadge from './ui/AppleMetadataBadge';

export default function GigManager() {
  const router = useRouter();
  const [gigs, setGigs] = useState([]);
  const [sets, setSets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSetSelector, setShowSetSelector] = useState(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(null);
  const [expandedSets, setExpandedSets] = useState(new Set());
  const [expandedSongs, setExpandedSongs] = useState(new Set());

  useEffect(() => {
    loadGigs();
    loadSets();
  }, []);

  const loadGigs = async () => {
    try {
      const response = await fetch('/api/gigs');
      if (response.ok) {
        const data = await response.json();
        setGigs(data);
      }
    } catch (error) {
      console.error('Error loading gigs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSets = async () => {
    try {
      const response = await fetch('/api/sets');
      if (response.ok) {
        const data = await response.json();
        setSets(data);
      }
    } catch (error) {
      console.error('Error loading sets:', error);
    }
  };

  const addSetToGig = async (gigId, setId) => {
    const gig = gigs.find(g => g.id === gigId);
    const setToAdd = sets.find(s => s.id === setId);
    
    if (!gig || !setToAdd) return;

    const updatedGig = {
      ...gig,
      sets: [...(gig.sets || []), setToAdd]
    };

    try {
      const response = await fetch('/api/gigs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGig)
      });

      if (response.ok) {
        loadGigs();
        setShowSetSelector(null);
      }
    } catch (error) {
      console.error('Error adding set to gig:', error);
    }
  };

  const createSpotifyPlaylist = async (gig) => {
    setIsCreatingPlaylist(gig.id);
    
    try {
      // Get all songs from all sets in the gig
      const allSongs = [];
      gig.sets?.forEach(set => {
        set.songs?.forEach(song => {
          allSongs.push(song);
        });
      });

      if (allSongs.length === 0) {
        alert('This gig has no songs to create a playlist from');
        return;
      }

      const response = await fetch('/api/spotify/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${gig.name} - Setlist`,
          description: `Setlist for ${gig.name}${gig.venue ? ` at ${gig.venue}` : ''}${gig.date ? ` on ${new Date(gig.date).toLocaleDateString()}` : ''}. Created by Greatest Gig app.`,
          songs: allSongs,
          public: false // Default to private, user can change in Spotify
        })
      });

      if (response.ok) {
        const data = await response.json();
        const { playlistUrl, found, notFound, total } = data;
        
        const message = `Spotify playlist created! 🎵\n\n` +
          `• Found: ${found}/${total} songs\n` +
          `• Added to playlist: ${found} songs\n` +
          `${notFound > 0 ? `• Not found on Spotify: ${notFound} songs\n` : ''}` +
          `\nPlaylist: "${gig.name} - Setlist"\n` +
          `Click OK to open in Spotify`;

        if (confirm(message)) {
          window.open(playlistUrl, '_blank');
        }
      } else {
        const error = await response.json();
        alert(`Failed to create playlist: ${error.error || 'Unknown error'}\n\nMake sure you're connected to Spotify in the admin panel.`);
      }
    } catch (error) {
      console.error('Error creating Spotify playlist:', error);
      alert('Error creating Spotify playlist. Please try again.');
    } finally {
      setIsCreatingPlaylist(null);
    }
  };

  const removeSetFromGig = async (gigId, setIndex) => {
    const gig = gigs.find(g => g.id === gigId);
    if (!gig) return;

    const updatedSets = [...gig.sets];
    updatedSets.splice(setIndex, 1);

    const updatedGig = { ...gig, sets: updatedSets };

    try {
      const response = await fetch('/api/gigs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGig)
      });

      if (response.ok) {
        setGigs(prevGigs => 
          prevGigs.map(g => g.id === gigId ? updatedGig : g)
        );
      }
    } catch (error) {
      console.error('Error removing set:', error);
    }
  };

  const moveSetInGig = async (gigId, setIndex, direction) => {
    const gig = gigs.find(g => g.id === gigId);
    if (!gig || !gig.sets) return;

    const newSets = [...gig.sets];
    let newIndex;

    switch (direction) {
      case 'top':
        newIndex = 0;
        break;
      case 'up':
        newIndex = Math.max(0, setIndex - 1);
        break;
      case 'down':
        newIndex = Math.min(newSets.length - 1, setIndex + 1);
        break;
      case 'bottom':
        newIndex = newSets.length - 1;
        break;
      default:
        return;
    }

    if (newIndex === setIndex) return;

    const [movedSet] = newSets.splice(setIndex, 1);
    newSets.splice(newIndex, 0, movedSet);

    const updatedGig = { ...gig, sets: newSets };

    try {
      const response = await fetch('/api/gigs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGig)
      });

      if (response.ok) {
        // Update local state immediately for better UX
        setGigs(prevGigs => 
          prevGigs.map(g => g.id === gigId ? updatedGig : g)
        );
      }
    } catch (error) {
      console.error('Error reordering sets:', error);
    }
  };

  const deleteGig = async (gigId) => {
    if (!confirm('Are you sure you want to delete this gig?')) return;

    try {
      const response = await fetch(`/api/gigs?id=${gigId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadGigs();
      }
    } catch (error) {
      console.error('Error deleting gig:', error);
    }
  };

  const filteredGigs = gigs.filter(gig =>
    gig.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gig.venue?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateGigDuration = (sets) => {
    if (!sets || sets.length === 0) return '0:00';
    
    const totalMinutes = sets.reduce((total, set) => {
      const setMinutes = set.songs?.reduce((setTotal, song) => {
        if (song.duration) {
          const [minutes, seconds] = song.duration.split(':').map(Number);
          return setTotal + minutes + (seconds / 60);
        }
        return setTotal;
      }, 0) || 0;
      return total + setMinutes;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const generatePDF = (gig, layout) => {
    console.log('Generating PDF for:', gig.name, 'Layout:', layout);
    
    // Validate gig data
    if (!gig || !gig.sets || gig.sets.length === 0) {
      alert('Cannot generate PDF: This gig has no sets or songs');
      return;
    }

    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to generate PDF');
        return;
      }

      const printDocument = printWindow.document;

      // Simple layout-specific adjustments
      let titleSuffix = '';
      let showDetails = true;
      
      switch (layout) {
        case 'stage-simple':
          titleSuffix = ' - Stage (Simple)';
          showDetails = false; // Hide detailed info for simple stage view
          break;
        case 'stage-detailed':
          titleSuffix = ' - Stage (Detailed)';
          break;
        case 'sound-engineer':
          titleSuffix = ' - Sound Engineer';
          break;
      }

      // PDF content - back to original simple format
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${gig.name}${titleSuffix}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.4;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              .set {
                margin-bottom: 30px;
                page-break-inside: avoid;
              }
              .set-title {
                font-size: 18px;
                font-weight: bold;
                background-color: #f0f0f0;
                padding: 8px;
                margin-bottom: 10px;
              }
              .song {
                margin: 8px 0;
                padding: 5px;
                border-left: 3px solid #333;
                padding-left: 10px;
              }
              .song-title {
                font-weight: bold;
                font-size: 14px;
              }
              .song-details {
                font-size: 12px;
                color: #666;
                margin-top: 2px;
              }
              .notes {
                font-style: italic;
                color: #888;
                font-size: 11px;
                margin-top: 3px;
              }
              @media print {
                body { margin: 10px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${gig.name}${titleSuffix}</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
      `;

      let bodyContent = '';

      // Generate sets content - back to original format
      bodyContent += gig.sets.map((set, setIndex) => `
        <div class="set">
          <div class="set-title">Set ${setIndex + 1}: ${set.name || 'Untitled Set'}</div>
          ${set.songs && Array.isArray(set.songs) ? set.songs.map((song, songIndex) => `
            <div class="song">
              <div class="song-title">${songIndex + 1}. ${song.title || 'Untitled'}</div>
              ${showDetails ? `<div class="song-details">
                ${song.artist || 'Unknown Artist'} 
                ${song.key ? `• Key: ${song.key}` : ''}
                ${song.duration ? `• ${song.duration}` : ''}
                ${song.language ? `• ${song.language === 'danish' ? '🇩🇰 Danish' : '🇬🇧 English'}` : ''}
                ${song.vocalist ? `• 🎤 ${song.vocalist}` : ''}
                ${song.bassGuitar ? `• 🎸 ${song.bassGuitar}` : ''}
                ${song.guitar ? `• 🎸 ${song.guitar}` : ''}
                ${song.backingTrack ? `• 🎵 Backing Track` : ''}
              </div>` : ''}
              ${song.notes && showDetails ? `<div class="notes">Notes: ${song.notes}</div>` : ''}
              ${song.tags && song.tags.length > 0 && showDetails ? `<div class="notes">Tags: ${song.tags.join(', ')}</div>` : ''}
            </div>
          `).join('') : '<p>No songs in this set</p>'}
          ${setIndex < gig.sets.length - 1 ? '<div style="text-align: center; margin: 20px 0; font-style: italic; color: #666;">☕ Break (15-20 minutes)</div>' : ''}
        </div>
      `).join('');

      const footerContent = `
          </body>
        </html>
      `;

      // Write content and print
      printDocument.write(htmlContent + bodyContent + footerContent);
      printDocument.close();
      
      // Auto-print after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const getAvailableSets = (gigId) => {
    const gig = gigs.find(g => g.id === gigId);
    const usedSetIds = gig?.sets?.map(s => s.id) || [];
    return sets.filter(set => !usedSetIds.includes(set.id));
  };

  const toggleSetExpansion = (setId) => {
    setExpandedSets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(setId)) {
        newSet.delete(setId);
      } else {
        newSet.add(setId);
      }
      return newSet;
    });
  };

  const toggleSongExpansion = (songId) => {
    setExpandedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h1 className="text-apple-title-1 text-primary mb-2">🎤 Gig Manager</h1>
          <p className="text-apple-body text-secondary">View and manage your upcoming gigs</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="px-8 py-6">
          {/* Search and Actions */}
          <div className="flex justify-between items-center apple-section-spacing">
            <div className="w-64">
              <AppleSearchInput
                placeholder="Search gigs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <AppleButton onClick={() => router.push('/gig-builder')}>
              Create New Gig
            </AppleButton>
          </div>
          
          {/* Gigs List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="apple-loading">Loading gigs...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredGigs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No gigs found</p>
                </div>
              ) : (
                filteredGigs.map((gig) => (
                  <div key={gig.id} className="apple-card apple-card-spacing">
                    {/* Gig Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="apple-subheading">{gig.name}</h3>
                            <p className="apple-text">{gig.venue || 'No venue'}</p>
                            <p className="apple-text-sm text-gray-500">
                              {formatDate(gig.date)} {gig.time && `at ${gig.time}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <AppleMetadataBadge type="sets">
                              {gig.sets?.length || 0} sets
                            </AppleMetadataBadge>
                            <AppleMetadataBadge type="duration">
                              {calculateGigDuration(gig.sets)}
                            </AppleMetadataBadge>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <AppleButton 
                            variant="secondary" 
                            size="sm"
                            onClick={() => setShowSetSelector(showSetSelector === gig.id ? null : gig.id)}
                          >
                            Add Set
                          </AppleButton>
                          
                          {/* Spotify Playlist Button */}
                          <AppleButton 
                            variant="secondary" 
                            size="sm"
                            onClick={() => createSpotifyPlaylist(gig)}
                            disabled={isCreatingPlaylist === gig.id || !gig.sets?.length}
                          >
                            {isCreatingPlaylist === gig.id ? (
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                                Creating...
                              </div>
                            ) : (
                              '🎵 Spotify Playlist'
                            )}
                          </AppleButton>
                          
                          <div className="relative">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  generatePDF(gig, e.target.value);
                                  e.target.value = ''; // Reset dropdown
                                }
                              }}
                              className="appearance-none bg-panel border border-apple text-primary font-medium text-sm px-3 py-2 rounded-apple-button shadow-apple hover:shadow-apple-hover transition-apple cursor-pointer"
                              defaultValue=""
                            >
                              <option value="" disabled>📄 Print PDF</option>
                              <option value="stage-simple">🎤 Stage - Simple</option>
                              <option value="stage-detailed">🎤 Stage - Detailed</option>
                              <option value="sound-engineer">🔊 Sound Engineer</option>
                            </select>
                          </div>
                          <AppleButton 
                            variant="secondary" 
                            size="sm"
                            onClick={() => deleteGig(gig.id)}
                          >
                            Delete
                          </AppleButton>
                        </div>
                      </div>
                    </div>

                    {/* Set Selector */}
                    {showSetSelector === gig.id && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-3">Add Set to Gig</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {getAvailableSets(gig.id).length > 0 ? (
                            getAvailableSets(gig.id).map(set => (
                              <button
                                key={set.id}
                                onClick={() => addSetToGig(gig.id, set.id)}
                                className="text-left p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                              >
                                <div className="font-medium text-blue-800">{set.name}</div>
                                <div className="text-sm text-blue-600">
                                  {set.songs?.length || 0} songs
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="col-span-full text-blue-600 text-center py-4">
                              All available sets are already added to this gig
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {gig.sets && gig.sets.length > 0 && (
                      <div className="space-y-3">
                        {gig.sets.map((set, setIndex) => (
                          <div key={setIndex} className="group bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 apple-item-spacing">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                {/* Set number */}
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                                  {setIndex + 1}
                                </div>
                                
                                <div>
                                  <h5 className="font-medium">Set {setIndex + 1}: {set.name}</h5>
                                  <p className="text-gray-500 text-sm">
                                    {set.songs?.length || 0} songs
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {/* Expand/Collapse Button for Set */}
                                <button
                                  onClick={() => toggleSetExpansion(set.id)}
                                  className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                                  title={expandedSets.has(set.id) ? 'Collapse set' : 'Expand set'}
                                >
                                  {expandedSets.has(set.id) ? '▼' : '▶'}
                                </button>
                                
                                {/* Apple-style controls - same as SetBuilder */}
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => moveSetInGig(gig.id, setIndex, 'top')}
                                    disabled={setIndex === 0}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                                      setIndex === 0 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white text-gray-600 hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-sm'
                                    }`}
                                    title="Move to top"
                                  >
                                    ⤴
                                  </button>
                                  <button
                                    onClick={() => moveSetInGig(gig.id, setIndex, 'up')}
                                    disabled={setIndex === 0}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                                      setIndex === 0 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white text-gray-600 hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-sm'
                                    }`}
                                    title="Move up"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    onClick={() => moveSetInGig(gig.id, setIndex, 'down')}
                                    disabled={setIndex === gig.sets.length - 1}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                                      setIndex === gig.sets.length - 1 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white text-gray-600 hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-sm'
                                    }`}
                                    title="Move down"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    onClick={() => moveSetInGig(gig.id, setIndex, 'bottom')}
                                    disabled={setIndex === gig.sets.length - 1}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                                      setIndex === gig.sets.length - 1 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white text-gray-600 hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-sm'
                                    }`}
                                    title="Move to bottom"
                                  >
                                    ⤵
                                  </button>
                                  <button
                                    onClick={() => removeSetFromGig(gig.id, setIndex)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs bg-white text-red-600 hover:bg-red-100 hover:scale-105 active:scale-95 shadow-sm transition-all"
                                    title="Remove set from gig"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Expanded Set Details */}
                            {expandedSets.has(set.id) && (
                              <div className="mt-4 space-y-2">
                                {set.songs && set.songs.length > 0 ? (
                                  set.songs.map((song, songIndex) => (
                                    <div key={song.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                      <div className="flex items-center space-x-3">
                                        <span className="text-xs text-gray-600 w-6 text-center font-mono bg-gray-100 rounded px-1">#{songIndex + 1}</span>
                                        <div>
                                          <div className="text-sm font-medium">{song.title}</div>
                                          <div className="text-xs text-gray-500">by {song.artist}</div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => toggleSongExpansion(song.id)}
                                          className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                                          title={expandedSongs.has(song.id) ? 'Collapse details' : 'Expand details'}
                                        >
                                          {expandedSongs.has(song.id) ? '▼' : '▶'}
                                        </button>
                                      </div>
                                      
                                      {/* Expanded Song Details */}
                                      {expandedSongs.has(song.id) && (
                                        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 animate-fade-in">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                            <div>
                                              <div><span className="font-medium">Key:</span> {song.key || 'Not set'}</div>
                                              <div><span className="font-medium">Duration:</span> {song.duration || 'Not set'}</div>
                                            </div>
                                            <div>
                                              <div><span className="font-medium">Bass:</span> {song.bassGuitar || 'Not set'}</div>
                                              <div><span className="font-medium">Guitar:</span> {song.guitar || 'Not set'}</div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-4 text-gray-500 text-sm">
                                    No songs in this set
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 