"use client";

import { useState } from 'react';
import TagInput from './TagInput';

export default function AddSongForm({ onSongAdded }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    key: '',
    youtubeLink: '',
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
        setIsOpen(false);
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

  if (!isOpen) {
    return (
      <div className="mb-8 text-center">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium text-lg transition-colors"
        >
          ➕ Add New Song
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Add New Song</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 text-2xl"
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
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="4:32"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              YouTube Link
            </label>
            <input
              type="url"
              name="youtubeLink"
              value={formData.youtubeLink}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bass Guitar
            </label>
            <select
              name="bassGuitar"
              value={formData.bassGuitar}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="text-sm font-medium text-gray-700">
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
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any special notes about this song..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Add Song'}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}