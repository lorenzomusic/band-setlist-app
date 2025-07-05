"use client";

import { useState, useRef, useEffect } from 'react';

const SUGGESTED_TAGS = [
  // Energy
  "High Energy", "Low Energy", "Ballad", "Upbeat", "Slow", "Fast",
  // Genre
  "Rock", "Pop", "80s", "90s", "Classic", "Modern", "Country", "Jazz", "Blues",
  // Mood
  "Happy", "Romantic", "Party", "Sad", "Energetic", "Chill", "Dance",
  // Special
  "Crowd Favorite", "Wedding", "Encore", "Opener", "Closer", "Request",
  // Vocal
  "Harmony", "Solo", "Duet", "Backup Vocals",
  // Instrument
  "Guitar Solo", "Bass Solo", "Acoustic", "Electric"
];

export default function TagInput({ tags = [], onChange, placeholder = "Add tags..." }) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = SUGGESTED_TAGS.filter(tag => 
        tag.toLowerCase().includes(inputValue.toLowerCase()) &&
        !tags.includes(tag)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [inputValue, tags]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      onChange(newTags);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    onChange(newTags);
  };

  const handleSuggestionClick = (suggestion) => {
    addTag(suggestion);
  };

  const handleInputFocus = () => {
    if (inputValue.trim() && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-white min-h-[42px]">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-purple-600 hover:text-purple-800 font-bold text-xs"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] outline-none text-sm"
        />
      </div>
      
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 