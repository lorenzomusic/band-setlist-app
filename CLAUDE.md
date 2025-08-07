# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start the Next.js development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run import-songs` - Import songs from CSV file (scripts/import-songs.js)
- `npm run cleanup-vocalist` - Run vocalist data cleanup script

## Architecture Overview

This is a Next.js 15 application using React 19 for a band management system called "Greatest Gig" for the band "Greatest Hit". The application manages setlists, gigs, songs, and band member availability.

### Data Storage
- **Database**: Uses Upstash Redis as the primary data store
- **Connection**: Redis client configured via environment variables (KV_REST_API_URL, KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
- **Data Types**: Songs, gigs, sets, setlists, user sessions, availability requests, and band member data

### Authentication System
- **Session-based**: Uses Redis for session storage with expiration
- **Protected Routes**: Most functionality requires authentication except login/register
- **Auth Context**: React context provider (`AuthProvider`) manages authentication state
- **Verification**: `lib/auth.js` provides `verifySession()` and `requireAuth()` utilities

### API Architecture
- **REST endpoints**: All located in `app/api/` following Next.js App Router conventions
- **Main entities**:
  - `/api/songs` - Song management (CRUD operations)
  - `/api/gigs` - Gig management with status tracking and comments
  - `/api/sets` - Set management for organizing songs
  - `/api/availability` - Band member availability tracking
  - `/api/auth/*` - Authentication endpoints (login, register, profile)
  - `/api/admin/*` - Administrative functions (user management, invitations)
  - `/api/spotify/*` - Spotify integration features

### Frontend Structure
- **Layout**: Uses `AppleLayout` component providing navigation and auth-aware UI
- **Components**: Located in `/components/` directory
- **Key Components**:
  - `SetListBuilder` - Drag-and-drop setlist creation
  - `GigManager` - Comprehensive gig management with status tracking
  - `SpotifyIntegration` - Spotify API integration for playlists
  - `AISetlistBuilder` - AI-powered setlist generation
  - `PerformanceView` - Live performance tracking

### Song Data Model
Songs include: title, artist, key, duration, bassGuitar, guitar, language (danish/english), vocalist (Rikke/Lorentz/Both), youtubeLink, spotifyUrl, backingTrack, form, medley info, notes, and tags.

### Gig Management
Gigs support status tracking (pending, confirmed, canceled), comments system, lineup management, and calendar feed generation (ICS format).

### Spotify Integration
Full OAuth integration with playlist creation, song search, and account disconnection features.

### Scripts Directory
- `import-songs.js` - CSV import functionality for bulk song data
- `cleanup-vocalist.js` - Data cleanup utilities

### Development Notes
- Uses Tailwind CSS for styling with Apple-inspired design system
- ESLint configured with Next.js core web vitals
- Type checking available through Next.js built-in TypeScript support
- Environment variables required for Redis and Spotify integration