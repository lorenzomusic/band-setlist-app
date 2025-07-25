"use client";

import { useState, useEffect } from 'react';
import TagInput from './TagInput';

export default function EditSongForm({ song, onSongUpdated, onCancel, onSongDeleted }) {
  const [formData, setFormData] = useState({
    title: song.title || '',
    artist: song.artist || '',
    key: song.key || '',
    youtubeLink: song.youtubeLink || '',
    duration: song.duration || '',
    bassGuitar: song.bassGuitar || '4-string',
    guitar: song.guitar || 'Electric',
    language: song.language || 'english',
    vocalist: song.vocalist || 'Rikke',
    backingTrack: song.backingTrack || false,
    form: song.form || '',
    medley: song.medley || '',
    medleyPosition: song.medleyPosition || '',
    notes: song.notes || '',
    tags: song.tags || [],
  });
  const [saving, setSaving] = useState(false);

  // Update form data when song changes
  useEffect(() => {
    setFormData({
      title: song.title || '',
      artist: song.artist || '',
      key: song.key || '',
      youtubeLink: song.youtubeLink || '',
      duration: song.duration || '',
      bassGuitar: song.bassGuitar || '4-string',
      guitar: song.guitar || 'Electric',
      language: song.language || 'english',
      vocalist: song.vocalist || 'Rikke',
      backingTrack: song.backingTrack || false,
      form: song.form || '',
      medley: song.medley || '',
      medleyPosition: song.medleyPosition || '',
      notes: song.notes || '',
      tags: song.tags || [],
    });
  }, [song]);

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

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${song.title}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/songs?id=${song.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert(`"${song.title}" has been deleted successfully.`);
        // Call a callback to handle the deletion in the parent component
        onSongDeleted(song.id);
      } else {
        const error = await response.json();
        alert(`Failed to delete song: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Error deleting song. Please try again.');
    }
  };

  return (
    <div className="mb-8 bg-white rounded-apple shadow-apple p-6 border-l-4 border-blue">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-apple-title-2 text-primary">✏️ Edit Song: {song.title}</h2>
        <button
          onClick={onCancel}
          className="text-secondary hover:text-primary text-2xl transition-apple-fast"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="apple-label">
              Song Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="apple-input"
              placeholder="Enter song title"
            />
          </div>

          <div>
            <label className="apple-label">
              Artist
            </label>
            <input
              type="text"
              name="artist"
              value={formData.artist}
              onChange={handleChange}
              className="apple-input"
              placeholder="Enter artist name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="apple-label">
              Key *
            </label>
            <select
              name="key"
              value={formData.key}
              onChange={handleChange}
              required
              className="apple-input"
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
            <label className="apple-label">
              Duration (mm:ss)
            </label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="apple-input"
              placeholder="4:32"
            />
          </div>

          <div>
            <label className="apple-label">
              YouTube Link
            </label>
            <input
              type="url"
              name="youtubeLink"
              value={formData.youtubeLink}
              onChange={handleChange}
              className="apple-input"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="apple-label">
              Bass Guitar
            </label>
            <select
              name="bassGuitar"
              value={formData.bassGuitar}
              onChange={handleChange}
              className="apple-input"
            >
              <option value="4-string">4-string</option>
              <option value="5-string">5-string</option>
              <option value="synth bass">Synth bass</option>
            </select>
          </div>

          <div>
            <label className="apple-label">
              Guitar
            </label>
            <select
              name="guitar"
              value={formData.guitar}
              onChange={handleChange}
              className="apple-input"
            >
              <option value="Electric">Electric</option>
              <option value="Acoustic">Acoustic</option>
              <option value="12-string">12-string</option>
              <option value="Classical">Classical</option>
            </select>
          </div>

          <div>
            <label className="apple-label">
              Language
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="apple-input"
              required
            >
              <option value="english">🇬🇧 English</option>
              <option value="danish">🇩🇰 Danish</option>
            </select>
          </div>

          <div>
            <label className="apple-label">
              Main Vocalist
            </label>
            <select
              name="vocalist"
              value={formData.vocalist}
              onChange={handleChange}
              className="apple-input"
              required
            >
              <option value="Rikke">🎤 Rikke</option>
              <option value="Lorentz">🎤 Lorentz</option>
              <option value="Both">🎤🎤 Both</option>
            </select>
          </div>
        </div>

        <div>
          <label className="apple-label">
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
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue border-gray-300 rounded"
          />
          <label className="text-sm font-black text-gray-900">
            Has backing track
          </label>
        </div>

        <div>
          <label className="apple-label">
            Song Form
          </label>
          <input
            type="text"
            name="form"
            value={formData.form}
            onChange={handleChange}
            className="apple-input"
            placeholder="Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="apple-label">
              Medley Name (if part of medley)
            </label>
            <input
              type="text"
              name="medley"
              value={formData.medley}
              onChange={handleChange}
              className="apple-input"
              placeholder="80s Rock Medley"
            />
          </div>

          <div>
            <label className="apple-label">
              Position in Medley
            </label>
            <input
              type="number"
              name="medleyPosition"
              value={formData.medleyPosition}
              onChange={handleChange}
              className="apple-input"
              placeholder="1"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="apple-label">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="apple-input"
            placeholder="Any special notes about this song..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue text-white px-6 py-3 rounded-lg font-medium transition-colors"
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
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors ml-auto"
          >
            🗑️ Delete Song
          </button>
        </div>
      </form>
    </div>
  );
}