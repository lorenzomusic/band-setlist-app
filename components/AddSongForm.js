"use client";

import { useState } from 'react';
import TagInput from './TagInput';
import AutoDurationInput from './ui/AutoDurationInput';

export default function AddSongForm({ onSongAdded, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    key: '',
    youtubeLink: '',
    spotifyUrl: '',
    duration: '',
    bassGuitar: '4-string',
    guitar: 'Electric',
    backingTrack: false,
    form: '',
    medley: '',
    medleyPosition: '',
    notes: '',
    language: 'english',
    vocalist: 'Rikke',
    tags: [],
  });
  const [saving, setSaving] = useState(false);
  const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagChange = (newTags) => {
    setFormData(prev => ({
      ...prev,
      tags: newTags
    }));
  };

  const searchSpotify = async () => {
    if (!formData.title || !formData.artist) {
      alert('Please enter both title and artist before searching Spotify');
      return;
    }

    setIsSearchingSpotify(true);
    try {
      const response = await fetch('/api/spotify/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          artist: formData.artist
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          setFormData(prev => ({
            ...prev,
            spotifyUrl: data.url
          }));
          alert(`Found Spotify track! Confidence: ${data.confidence}%`);
        } else {
          alert('No Spotify track found for this song');
        }
      } else {
        alert('Failed to search Spotify. Make sure you\'re connected in the admin panel.');
      }
    } catch (error) {
      console.error('Spotify search error:', error);
      alert('Error searching Spotify');
    } finally {
      setIsSearchingSpotify(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newSong = await response.json();
        onSongAdded(newSong);
        setFormData({
          title: '',
          artist: '',
          key: '',
          youtubeLink: '',
          spotifyUrl: '',
          duration: '',
          bassGuitar: '4-string',
          guitar: 'Electric',
          backingTrack: false,
          form: '',
          medley: '',
          medleyPosition: '',
          notes: '',
          language: 'english',
          vocalist: 'Rikke',
          tags: [],
        });
        // setIsOpen(false); // This line is removed as per the edit hint
      } else {
        alert('Failed to add song');
      }
    } catch (error) {
      console.error('Error adding song:', error);
      alert('Error adding song');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">➕ Add New Song</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Song Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="Enter song title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Artist
            </label>
            <input
              type="text"
              name="artist"
              value={formData.artist}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="Enter artist name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key *
            </label>
            <select
              name="key"
              value={formData.key}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue focus:border-transparent"
            >
              <option value="">Select key</option>
              <option value="C">C</option>
              <option value="C#">C#</option>
              <option value="D">D</option>
              <option value="D#">D#</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="F#">F#</option>
              <option value="G">G</option>
              <option value="G#">G#</option>
              <option value="A">A</option>
              <option value="A#">A#</option>
              <option value="B">B</option>
              <option value="Am">Am</option>
              <option value="Bm">Bm</option>
              <option value="Cm">Cm</option>
              <option value="Dm">Dm</option>
              <option value="Em">Em</option>
              <option value="Fm">Fm</option>
              <option value="Gm">Gm</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (mm:ss)
            </label>
            <div className="w-full p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue focus-within:border-transparent">
              <AutoDurationInput
                value={formData.duration}
                onChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                className="w-full"
                placeholder="MM:SS"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recording
            </label>
            <input
              type="url"
              name="youtubeLink"
              value={formData.youtubeLink}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🎵 Spotify URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                name="spotifyUrl"
                value={formData.spotifyUrl}
                onChange={handleChange}
                className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue focus:border-transparent"
                placeholder="https://open.spotify.com/track/..."
              />
              <button
                type="button"
                onClick={searchSpotify}
                disabled={isSearchingSpotify}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Search for this song on Spotify"
              >
                {isSearchingSpotify ? '🔍' : '🎵'}
              </button>
            </div>
            {formData.spotifyUrl && (
              <a
                href={formData.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 text-sm mt-1 inline-block"
              >
                🎵 Open in Spotify
              </a>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bass Guitar
            </label>
            <select
              name="bassGuitar"
              value={formData.bassGuitar}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue focus:border-transparent"
            >
              <option value="4-string">4-string</option>
              <option value="5-string">5-string</option>
              <option value="synth bass">Synth bass</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guitar
            </label>
            <select
              name="guitar"
              value={formData.guitar}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue focus:border-transparent"
            >
              <option value="Electric">Electric</option>
              <option value="Acoustic">Acoustic</option>
              <option value="12-string">12-string</option>
              <option value="Classical">Classical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue focus:border-transparent"
              required
            >
              <option value="english">🇬🇧 English</option>
              <option value="danish">🇩🇰 Danish</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Main Vocalist
            </label>
            <select
              name="vocalist"
              value={formData.vocalist}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue focus:border-transparent"
              required
            >
              <option value="Rikke">🎤 Rikke</option>
              <option value="Lorentz">🎤 Lorentz</option>
              <option value="Both">🎤🎤 Both</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <TagInput
            tags={formData.tags}
            onChange={handleTagChange}
            placeholder="Add tags like 'High Energy', 'Wedding', 'Rock'..."
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="backingTrack"
            checked={formData.backingTrack}
            onChange={handleChange}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-sm font-medium text-gray-900">
            Has backing track
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Song Form
          </label>
          <input
            type="text"
            name="form"
            value={formData.form}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue focus:border-transparent"
            placeholder="Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medley Name (if part of medley)
            </label>
            <input
              type="text"
              name="medley"
              value={formData.medley}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="80s Rock Medley"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position in Medley
            </label>
            <input
              type="number"
              name="medleyPosition"
              value={formData.medleyPosition}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue focus:border-transparent"
              placeholder="1"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue focus:border-transparent"
            placeholder="Any special notes about this song..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            style={{ backgroundColor: '#007aff' }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              'Add Song'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}