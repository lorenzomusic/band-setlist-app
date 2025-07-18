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

  const removeSetFromGig = async (gigId, setIndex) => {
    const gig = gigs.find(g => g.id === gigId);
    if (!gig) return;

    const updatedGig = {
      ...gig,
      sets: gig.sets.filter((_, index) => index !== setIndex)
    };

    try {
      const response = await fetch('/api/gigs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGig)
      });

      if (response.ok) {
        loadGigs();
      }
    } catch (error) {
      console.error('Error removing set from gig:', error);
    }
  };

  // NEW: Set reordering functions
  const moveSetInGig = async (gigId, setIndex, direction) => {
    const gig = gigs.find(g => g.id === gigId);
    if (!gig || !gig.sets) return;

    const newSets = [...gig.sets];
    let newIndex;

    switch (direction) {
      case 'top':
        if (setIndex === 0) return;
        const [movedToTop] = newSets.splice(setIndex, 1);
        newSets.unshift(movedToTop);
        break;
      case 'up':
        if (setIndex === 0) return;
        [newSets[setIndex - 1], newSets[setIndex]] = [newSets[setIndex], newSets[setIndex - 1]];
        break;
      case 'down':
        if (setIndex === newSets.length - 1) return;
        [newSets[setIndex], newSets[setIndex + 1]] = [newSets[setIndex + 1], newSets[setIndex]];
        break;
      case 'bottom':
        if (setIndex === newSets.length - 1) return;
        const [movedToBottom] = newSets.splice(setIndex, 1);
        newSets.push(movedToBottom);
        break;
      default:
        return;
    }

    const updatedGig = {
      ...gig,
      sets: newSets
    };

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

  const generatePDF = (gig, format = 'stage-simple') => {
    // Fix date formatting
    const gigDate = gig.date ? new Date(gig.date).toLocaleDateString('da-DK') : 'Ingen dato';
    
    let htmlContent = '';
    
    if (format === 'stage-simple') {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #000;">
            <div style="font-size: 16px; font-weight: bold;">
              ${gig.name}${gig.venue ? ` | ${gig.venue}` : ''}${gigDate !== 'Ingen dato' ? ` | ${gigDate}` : ''}
            </div>
          </div>
          
          ${gig.sets ? gig.sets.map((set, setIndex) => `
            <div style="font-size: 20px; font-weight: bold; margin: 25px 0 15px 0; text-align: center; background: #f0f0f0; padding: 10px; border-radius: 8px; page-break-before: ${setIndex > 0 ? 'always' : 'auto'};">
              SET ${setIndex + 1}
            </div>
            ${set.songs ? set.songs.map((song, songIndex) => {
              if (song.medley && song.medleyPosition > 1) {
                return `
                  <div style="font-size: 24px; margin: 15px 0 15px 40px; color: #555; font-style: italic; display: flex; justify-content: space-between; align-items: center;">
                    <span>${song.title}</span>
                    ${song.bassGuitar === '5-string' ? '<span style="font-size: 20px; color: #007aff;">🎸</span>' : ''}
                  </div>
                `;
              } else if (song.medley && song.medleyPosition === 1) {
                return `
                  <div style="font-size: 28px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; padding: 15px 0;">
                    <span>${song.medley}</span>
                  </div>
                  <div style="font-size: 24px; margin: 15px 0 15px 40px; color: #555; font-style: italic; display: flex; justify-content: space-between; align-items: center;">
                    <span>${song.title}</span>
                    ${song.bassGuitar === '5-string' ? '<span style="font-size: 20px; color: #007aff;">🎸</span>' : ''}
                  </div>
                `;
              } else {
                return `
                  <div style="font-size: 28px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; padding: 15px 0;">
                    <span>${song.title}</span>
                    ${song.bassGuitar === '5-string' ? '<span style="font-size: 20px; color: #007aff;">🎸</span>' : ''}
                  </div>
                `;
              }
            }).join('') : '<p>Ingen sange i dette set</p>'}
          `).join('') : '<p>Ingen sets tilføjet til denne gig</p>'}
        </div>
      `;
    } else if (format === 'stage-detailed') {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #000;">
            <div style="font-size: 16px; font-weight: bold;">
              ${gig.name}${gig.venue ? ` | ${gig.venue}` : ''}${gigDate !== 'Ingen dato' ? ` | ${gigDate}` : ''}
            </div>
          </div>
          
          ${gig.sets ? gig.sets.map((set, setIndex) => `
            <div style="font-size: 20px; font-weight: bold; margin: 25px 0 15px 0; text-align: center; background: #f0f0f0; padding: 10px; border-radius: 8px; page-break-before: ${setIndex > 0 ? 'always' : 'auto'};">
              SET ${setIndex + 1}
            </div>
            ${set.songs ? set.songs.map((song, songIndex) => {
              const keyInfo = song.key ? `Key: ${song.key}` : '';
              const vocalistInfo = song.vocalist ? song.vocalist : '';
              const details = keyInfo && vocalistInfo ? `(${keyInfo}, ${vocalistInfo})` : 
                             keyInfo ? `(${keyInfo})` : 
                             vocalistInfo ? `(${vocalistInfo})` : '';
              
              if (song.medley && song.medleyPosition > 1) {
                return `
                  <div style="font-size: 20px; margin: 12px 0 12px 40px; color: #555; font-style: italic; display: flex; justify-content: space-between; align-items: center;">
                    <span>${song.title} <span style="font-size: 16px; color: #666; font-weight: normal;">${details}</span></span>
                    ${song.bassGuitar === '5-string' ? '<span style="font-size: 18px; color: #007aff;">🎸</span>' : ''}
                  </div>
                `;
              } else if (song.medley && song.medleyPosition === 1) {
                return `
                  <div style="font-size: 24px; margin: 18px 0; display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                    <span>${song.medley}</span>
                  </div>
                  <div style="font-size: 20px; margin: 12px 0 12px 40px; color: #555; font-style: italic; display: flex; justify-content: space-between; align-items: center;">
                    <span>${song.title} <span style="font-size: 16px; color: #666; font-weight: normal;">${details}</span></span>
                    ${song.bassGuitar === '5-string' ? '<span style="font-size: 18px; color: #007aff;">🎸</span>' : ''}
                  </div>
                `;
              } else {
                return `
                  <div style="font-size: 24px; margin: 18px 0; display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                    <span>${song.title} <span style="font-size: 16px; color: #666; font-weight: normal;">${details}</span></span>
                    ${song.bassGuitar === '5-string' ? '<span style="font-size: 18px; color: #007aff;">🎸</span>' : ''}
                  </div>
                `;
              }
            }).join('') : '<p>Ingen sange i dette set</p>'}
          `).join('') : '<p>Ingen sets tilføjet til denne gig</p>'}
        </div>
      `;
    } else if (format === 'sound-engineer') {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; font-size: 12px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${gig.name} - Technical Setlist</div>
            <div style="font-size: 14px; color: #666;">${gig.venue || 'Ingen venue'}${gigDate !== 'Ingen dato' ? ` | ${gigDate}` : ''}${gig.time ? ` | ${gig.time}` : ''}</div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 20px;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; background: #f0f0f0; font-weight: bold; font-size: 10px; width: 8%;">Set</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; background: #f0f0f0; font-weight: bold; font-size: 10px; width: 25%;">Sang</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; background: #f0f0f0; font-weight: bold; font-size: 10px; width: 8%;">Toneart</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; background: #f0f0f0; font-weight: bold; font-size: 10px; width: 12%;">Vokalist</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; background: #f0f0f0; font-weight: bold; font-size: 10px; width: 10%;">Bas</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; background: #f0f0f0; font-weight: bold; font-size: 10px; width: 10%;">Guitar</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; background: #f0f0f0; font-weight: bold; font-size: 10px; width: 12%;">Backing Track</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; background: #f0f0f0; font-weight: bold; font-size: 10px; width: 15%;">Noter</th>
              </tr>
            </thead>
            <tbody>
              ${gig.sets ? gig.sets.map((set, setIndex) => 
                set.songs ? set.songs.map((song, songIndex) => {
                  if (song.medley && song.medleyPosition > 1) {
                    return `
                      <tr>
                        <td style="border: 1px solid #ddd; padding: 6px;"></td>
                        <td style="border: 1px solid #ddd; padding: 6px; padding-left: 20px; font-style: italic; color: #666;">${song.title}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.key || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.vocalist || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.bassGuitar || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.guitar || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.backingTrack ? '<span style="background: #ffe6e6; color: #d63384; padding: 2px 4px; border-radius: 3px; font-size: 9px; font-weight: bold;">YES</span>' : 'Nej'}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.notes || ''}</td>
                      </tr>
                    `;
                  } else if (song.medley && song.medleyPosition === 1) {
                    return `
                      <tr>
                        <td style="border: 1px solid #ddd; padding: 6px;">${songIndex === 0 ? `SET ${setIndex + 1}` : ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.medley}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">Forskellige</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">Forskellige</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.bassGuitar || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.guitar || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.backingTrack ? '<span style="background: #ffe6e6; color: #d63384; padding: 2px 4px; border-radius: 3px; font-size: 9px; font-weight: bold;">YES</span>' : 'Nej'}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">Medley - se individuelle sange nedenfor</td>
                      </tr>
                      <tr>
                        <td style="border: 1px solid #ddd; padding: 6px;"></td>
                        <td style="border: 1px solid #ddd; padding: 6px; padding-left: 20px; font-style: italic; color: #666;">${song.title}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.key || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.vocalist || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.bassGuitar || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.guitar || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.backingTrack ? '<span style="background: #ffe6e6; color: #d63384; padding: 2px 4px; border-radius: 3px; font-size: 9px; font-weight: bold;">YES</span>' : 'Nej'}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.notes || ''}</td>
                      </tr>
                    `;
                  } else {
                    return `
                      <tr>
                        <td style="border: 1px solid #ddd; padding: 6px;">${songIndex === 0 ? `SET ${setIndex + 1}` : ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.title}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.key || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.vocalist || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.bassGuitar || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.guitar || ''}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.backingTrack ? '<span style="background: #ffe6e6; color: #d63384; padding: 2px 4px; border-radius: 3px; font-size: 9px; font-weight: bold;">YES</span>' : 'Nej'}</td>
                        <td style="border: 1px solid #ddd; padding: 6px;">${song.notes || ''}</td>
                      </tr>
                    `;
                  }
                }).join('') : '<tr><td colspan="8" style="border: 1px solid #ddd; padding: 6px;">Ingen sange i dette set</td></tr>'
              ).join('') : '<tr><td colspan="8" style="border: 1px solid #ddd; padding: 6px;">Ingen sets tilføjet til denne gig</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    }
    
    // Create a new window and write content directly
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${gig.name} - Setlist</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              @media print {
                body { margin: 0; padding: 0; }
              }
              body { margin: 0; padding: 0; }
            </style>
          </head>
          <body>
            ${htmlContent}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              }
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } else {
      alert('Popup blev blokeret. Tillad popups for at printe PDF.');
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

  return (
    <div className="apple-container">
      <ApplePanel>
        <ApplePanelHeader
          title="Gig Manager"
          subtitle="View and manage your upcoming gigs"
        />
        
        <div className="space-y-6 px-8 pb-8">
          {/* Search and Actions */}
          <div className="flex justify-between items-center">
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
                  <div key={gig.id} className="apple-card">
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
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="apple-headline mb-3">Add a Set:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {sets.map((set) => (
                            <button
                              key={set.id}
                              onClick={() => addSetToGig(gig.id, set.id)}
                              className="text-left p-3 border rounded-lg hover:bg-white transition-colors"
                            >
                              <div className="font-medium">{set.name}</div>
                              <div className="text-gray-500 text-sm">
                                {set.songs?.length || 0} songs
                              </div>
                            </button>
                          ))}
                        </div>
                        {sets.length === 0 && (
                          <p className="text-gray-500 text-center py-4">
                            No sets available. Create a set first.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Gig Sets with Reordering Controls */}
                    {gig.sets && gig.sets.length > 0 && (
                      <div className="space-y-3">
                        {gig.sets.map((set, setIndex) => (
                          <div key={setIndex} className="group bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
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
                              
                              {/* Apple-style controls - same as SetBuilder */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {/* Move to top */}
                                <button
                                  onClick={() => moveSetInGig(gig.id, setIndex, 'top')}
                                  disabled={setIndex === 0}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-200 ${
                                    setIndex === 0 
                                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:scale-105 active:scale-95'
                                  }`}
                                  title="Move to top"
                                >
                                  ⤴
                                </button>
                                
                                {/* Move up */}
                                <button
                                  onClick={() => moveSetInGig(gig.id, setIndex, 'up')}
                                  disabled={setIndex === 0}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-200 ${
                                    setIndex === 0 
                                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:scale-105 active:scale-95'
                                  }`}
                                  title="Move up"
                                >
                                  ↑
                                </button>
                                
                                {/* Move down */}
                                <button
                                  onClick={() => moveSetInGig(gig.id, setIndex, 'down')}
                                  disabled={setIndex === gig.sets.length - 1}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-200 ${
                                    setIndex === gig.sets.length - 1 
                                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:scale-105 active:scale-95'
                                  }`}
                                  title="Move down"
                                >
                                  ↓
                                </button>
                                
                                {/* Move to bottom */}
                                <button
                                  onClick={() => moveSetInGig(gig.id, setIndex, 'bottom')}
                                  disabled={setIndex === gig.sets.length - 1}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-200 ${
                                    setIndex === gig.sets.length - 1 
                                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:scale-105 active:scale-95'
                                  }`}
                                  title="Move to bottom"
                                >
                                  ⤵
                                </button>
                                
                                {/* Remove set */}
                                <button
                                  onClick={() => removeSetFromGig(gig.id, setIndex)}
                                  className="w-7 h-7 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 hover:scale-105 active:scale-95 flex items-center justify-center text-xs transition-all duration-200"
                                  title="Remove set"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
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
      </ApplePanel>
    </div>
  );
} 