"use client";

import { useState } from 'react';

export default function EditSongForm({ song, onSongUpdated, onCancel }) {
  const [formData, setFormData] = useState({
    title: song.title || '',
    artist: song.artist || '',
    key: song.key || '',
    youtubeLink: song.youtubeLink || '',
    duration: song.duration || '',
    bassGuitar: song.bassGuitar || '4-string',
    guitar: song.guitar || 'Electric',
    backingTrack: song.backingTrack || false,
    form: song.form || '',
    medley: song.medley || '',
    medleyPosition: song.medleyPosition || '',
    notes: song.notes || ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/songs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: song.id
        }),
      });

      if (response.ok) {
        const updatedSong = await response.json();
        onSongUpdated(updatedSong);
      } else {
        alert('Failed to update song');
      }
    } catch (error) {
      console.error('Error updating song:', error);
      alert('Error updating song');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-900">✏️ Edit Song: {song.title}</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-black text-gray-900 mb-1">
              Song Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
              placeholder="Enter song title"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-900 mb-1">
              Artist
            </label>
            <input
              type="text"
              name="artist"
              value={formData.artist}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
              placeholder="Enter artist name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-black text-gray-900 mb-1">
              Key *
            </label>
            <select
              name="key"
              value={formData.key}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
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
            <label className="block text-sm font-black text-gray-900 mb-1">
              Duration (mm:ss)
            </label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
              placeholder="4:32"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-900 mb-1">
              YouTube Link
            </label>
            <input
              type="url"
              name="youtubeLink"
              value={formData.youtubeLink}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-900 mb-1">
              Bass Guitar
            </label>
            <select
              name="bassGuitar"
              value={formData.bassGuitar}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
            >
              <option value="4-string">4-string</option>
              <option value="5-string">5-string</option>
              <option value="synth bass">Synth bass</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-gray-900 mb-1">
              Guitar
            </label>
            <select
              name="guitar"
              value={formData.guitar}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
            >
              <option value="Electric">Electric</option>
              <option value="Acoustic">Acoustic</option>
              <option value="12-string">12-string</option>
              <option value="Classical">Classical</option>
            </select>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="backingTrack"
            checked={formData.backingTrack}
            onChange={handleChange}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-sm font-black text-gray-900">
            Has backing track
          </label>
        </div>

        <div>
          <label className="block text-sm font-black text-gray-900 mb-1">
            Song Form
          </label>
          <input
            type="text"
            name="form"
            value={formData.form}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
            placeholder="Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-black text-gray-900 mb-1">
              Medley Name (if part of medley)
            </label>
            <input
              type="text"
              name="medley"
              value={formData.medley}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
              placeholder="80s Rock Medley"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-900 mb-1">
              Position in Medley
            </label>
            <input
              type="number"
              name="medleyPosition"
              value={formData.medleyPosition}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
              placeholder="1"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-black text-gray-900 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900"
            placeholder="Any special notes about this song..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {saving ? 'Saving...' : '💾 Save Changes'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}