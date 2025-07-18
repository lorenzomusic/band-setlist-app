# Redundant Code Analysis

This document highlights areas of redundant code found in the codebase that could be optimized for better maintainability and reduced duplication.

## 🚨 Major Redundancies

### 1. **Duplicate Application Directory**
**Location**: `band-app-current/` vs root directory  
**Impact**: High - Entire application is duplicated  
**Files affected**: Nearly all application files

The `band-app-current/` directory appears to be a complete duplicate of the main application structure, including:
- Same package.json (with minor version differences)
- Identical component structure
- Duplicate API routes
- Same configuration files

**Recommendation**: Remove the `band-app-current/` directory if it's no longer needed, or clarify its purpose if it serves as a backup/staging environment.

### 2. **Duplicate PostCSS Configuration**
**Files**: 
- `postcss.config.js` (CommonJS format)
- `postcss.config.mjs` (ES Module format)

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

// postcss.config.mjs  
const config = {
  plugins: ["@tailwindcss/postcss"],
};
```
**Recommendation**: Keep only one configuration file that matches your project's module system.

### 3. **Backup Performance View**
**Files**:
- `components/PerformanceView.backup.js` (158 lines)
- `components/PerformanceView.js` (409 lines)

The backup file appears to be an older version of the PerformanceView component.  
**Recommendation**: Remove the backup file if the main component is stable and working correctly.

## 🔄 Pattern Redundancies

### 4. **Repeated Form Field Definitions**
**Components**: `AddSongForm.js` and `EditSongForm.js`

Both forms define identical default values and field structures:

```javascript
// Repeated in both forms:
bassGuitar: '4-string'
guitar: 'Electric'
language: 'english'
vocalist: 'Rikke'
backingTrack: false
```

**Lines affected**:
```12:12:components/AddSongForm.js
bassGuitar: '4-string',
```
```62:62:components/AddSongForm.js
bassGuitar: '4-string',
```
```12:12:components/EditSongForm.js
bassGuitar: song.bassGuitar || '4-string',
```
```33:33:components/EditSongForm.js
bassGuitar: song.bassGuitar || '4-string',
```

**Recommendation**: Extract form field definitions into a shared constants file or create a shared form hook.

### 5. **Repeated Loading State Patterns**
**Pattern**: `const [loading, setLoading] = useState(true)`

Found in 8 different components:
- `components/PerformanceTracker.js`
- `components/PerformanceView.js` 
- `components/SongList.js`
- `components/PerformanceView.backup.js`
- And their duplicates in `band-app-current/`

**Recommendation**: Create a custom hook for loading states or use a state management solution.

### 6. **Repeated API Calls to /api/songs**
**Pattern**: `fetch('/api/songs')`

Found in 16 different locations across components:
- `AISetlistBuilder.js`
- `SetBuilder.js`
- `SongManager.js`
- `AddSongForm.js`
- `EditSongForm.js`
- And their duplicates

**Recommendation**: Create a shared API service or custom hook for song operations.

### 7. **Repeated Form Validation Logic**
**Pattern**: Vocalist validation `['Rikke', 'Lorentz', 'Both']`

Found in multiple locations:
```35:35:app/api/songs/route.js
if (!vocalist || !['Rikke', 'Lorentz', 'Both'].includes(vocalist)) {
```

**Recommendation**: Extract validation rules into shared constants.

### 8. **Repeated Default Value Assignments**
**Pattern**: Default value assignments scattered throughout forms

Examples:
- `vocalist: 'Rikke'` - appears 6+ times
- `language: 'english'` - appears 10+ times  
- `guitar: 'Electric'` - appears 6+ times

**Recommendation**: Create a shared configuration object for default form values.

## 🛠️ Recommended Solutions

### 1. **Create Shared Constants File**
```javascript
// constants/formDefaults.js
export const SONG_DEFAULTS = {
  bassGuitar: '4-string',
  guitar: 'Electric',
  language: 'english',
  vocalist: 'Rikke',
  backingTrack: false
};

export const VALIDATION_RULES = {
  vocalists: ['Rikke', 'Lorentz', 'Both'],
  languages: ['danish', 'english']
};
```

### 2. **Create Custom Hooks**
```javascript
// hooks/useSongs.js
export function useSongs() {
  // Shared song loading and management logic
}

// hooks/useLoadingState.js  
export function useLoadingState(initialState = true) {
  // Shared loading state management
}
```

### 3. **Create API Service Layer**
```javascript
// services/songService.js
export const songService = {
  getAll: () => fetch('/api/songs').then(res => res.json()),
  create: (song) => fetch('/api/songs', { method: 'POST', ... }),
  update: (song) => fetch('/api/songs', { method: 'PUT', ... }),
  delete: (id) => fetch(`/api/songs?id=${id}`, { method: 'DELETE' })
};
```

### 4. **Shared Form Component**
Create a base `SongForm` component that both `AddSongForm` and `EditSongForm` can extend.

## 📊 Summary

- **High Priority**: Remove duplicate `band-app-current/` directory
- **Medium Priority**: Consolidate form logic and API calls  
- **Low Priority**: Clean up backup files and duplicate configs

**Estimated effort reduction**: ~30-40% fewer lines of code after refactoring
**Maintenance improvement**: Centralized updates for form fields, API calls, and validation rules