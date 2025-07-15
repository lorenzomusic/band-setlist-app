"use client";

import { useState } from 'react';

export default function PDFGenerator({ setlist, gigName = "Setlist" }) {
  const [generating, setGenerating] = useState(false);

  // Robust validation to prevent errors
  const validateSetlist = () => {
    if (!setlist) {
      console.warn('PDFGenerator: setlist is null or undefined');
      return false;
    }

    // Check if it's an array (individual set)
    if (Array.isArray(setlist)) {
      if (setlist.length === 0) {
        console.warn('PDFGenerator: setlist array is empty');
        return false;
      }
      return true;
    }

    // Check if it's a gig object with sets
    if (setlist.sets) {
      if (!Array.isArray(setlist.sets) || setlist.sets.length === 0) {
        console.warn('PDFGenerator: gig has no sets or empty sets array');
        return false;
      }
      return true;
    }

    // Check if it's a set object with songs
    if (setlist.songs) {
      if (!Array.isArray(setlist.songs) || setlist.songs.length === 0) {
        console.warn('PDFGenerator: set has no songs or empty songs array');
        return false;
      }
      return true;
    }

    console.warn('PDFGenerator: setlist format not recognized', setlist);
    return false;
  };

  const generatePDF = () => {
    if (!validateSetlist()) {
      alert('Cannot generate PDF: No valid setlist data available');
      return;
    }

    setGenerating(true);
    
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to generate PDF');
        setGenerating(false);
        return;
      }

      const printDocument = printWindow.document;

      // PDF content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${gigName} - Setlist</title>
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
              <h1>${gigName}</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
      `;

      let bodyContent = '';

      // Handle different setlist formats
      if (Array.isArray(setlist)) {
        // Single set (array of songs)
        bodyContent += `
          <div class="set">
            ${setlist.map((song, index) => `
              <div class="song">
                <div class="song-title">${index + 1}. ${song.title || 'Untitled'}</div>
                <div class="song-details">
                  ${song.artist || 'Unknown Artist'} 
                  ${song.key ? `• Key: ${song.key}` : ''}
                  ${song.duration ? `• ${song.duration}` : ''}
                  ${song.language ? `• ${song.language === 'danish' ? '🇩🇰 Danish' : '🇬🇧 English'}` : ''}
                  ${song.vocalist ? `• 🎤 ${song.vocalist}` : ''}
                  ${song.bassGuitar ? `• 🎸 ${song.bassGuitar}` : ''}
                  ${song.guitar ? `• 🎸 ${song.guitar}` : ''}
                  ${song.backingTrack ? `• 🎵 Backing Track` : ''}
                </div>
                ${song.notes ? `<div class="notes">Notes: ${song.notes}</div>` : ''}
                ${song.tags && song.tags.length > 0 ? `<div class="notes">Tags: ${song.tags.join(', ')}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      } else if (setlist.sets && Array.isArray(setlist.sets)) {
        // Multiple sets (gig)
        bodyContent += setlist.sets.map((set, setIndex) => `
          <div class="set">
            <div class="set-title">Set ${setIndex + 1}: ${set.name || 'Untitled Set'}</div>
            ${set.songs && Array.isArray(set.songs) ? set.songs.map((song, songIndex) => `
              <div class="song">
                <div class="song-title">${songIndex + 1}. ${song.title || 'Untitled'}</div>
                <div class="song-details">
                  ${song.artist || 'Unknown Artist'} 
                  ${song.key ? `• Key: ${song.key}` : ''}
                  ${song.duration ? `• ${song.duration}` : ''}
                  ${song.language ? `• ${song.language === 'danish' ? '🇩🇰 Danish' : '🇬🇧 English'}` : ''}
                  ${song.vocalist ? `• 🎤 ${song.vocalist}` : ''}
                  ${song.bassGuitar ? `• 🎸 ${song.bassGuitar}` : ''}
                  ${song.guitar ? `• 🎸 ${song.guitar}` : ''}
                  ${song.backingTrack ? `• 🎵 Backing Track` : ''}
                </div>
                ${song.notes ? `<div class="notes">Notes: ${song.notes}</div>` : ''}
                ${song.tags && song.tags.length > 0 ? `<div class="notes">Tags: ${song.tags.join(', ')}</div>` : ''}
              </div>
            `).join('') : '<p>No songs in this set</p>'}
            ${setIndex < setlist.sets.length - 1 ? '<div style="text-align: center; margin: 20px 0; font-style: italic; color: #666;">☕ Break (15-20 minutes)</div>' : ''}
          </div>
        `).join('');
      } else if (setlist.songs && Array.isArray(setlist.songs)) {
        // Single set object with songs
        bodyContent += `
          <div class="set">
            <div class="set-title">${setlist.name || 'Setlist'}</div>
            ${setlist.songs.map((song, index) => `
              <div class="song">
                <div class="song-title">${index + 1}. ${song.title || 'Untitled'}</div>
                <div class="song-details">
                  ${song.artist || 'Unknown Artist'} 
                  ${song.key ? `• Key: ${song.key}` : ''}
                  ${song.duration ? `• ${song.duration}` : ''}
                  ${song.language ? `• ${song.language === 'danish' ? '🇩🇰 Danish' : '🇬🇧 English'}` : ''}
                  ${song.vocalist ? `• 🎤 ${song.vocalist}` : ''}
                  ${song.bassGuitar ? `• 🎸 ${song.bassGuitar}` : ''}
                  ${song.guitar ? `• 🎸 ${song.guitar}` : ''}
                  ${song.backingTrack ? `• 🎵 Backing Track` : ''}
                </div>
                ${song.notes ? `<div class="notes">Notes: ${song.notes}</div>` : ''}
                ${song.tags && song.tags.length > 0 ? `<div class="notes">Tags: ${song.tags.join(', ')}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }

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
        setGenerating(false);
      }, 500);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
      setGenerating(false);
    }
  };

  // Don't render if no valid data
  if (!validateSetlist()) {
    return null;
  }

  return (
        <button
          onClick={generatePDF}
          disabled={generating}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
        >
          {generating ? (
        <>
          <span className="animate-spin">⏳</span>
          Generating...
        </>
          ) : (
        <>
          📄 Generate PDF
        </>
          )}
        </button>
  );
}