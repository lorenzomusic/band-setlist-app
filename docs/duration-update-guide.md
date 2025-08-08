# Song Duration Update Guide

This guide explains how to automatically fetch and update song durations for your band setlist app.

## Overview

The song duration update system provides two ways to automatically fetch accurate song durations from online music databases:

1. **Web Interface** - Use the admin panel for a user-friendly experience
2. **Command Line Script** - Use for batch processing or automation

## Method 1: Web Interface (Recommended)

### Access the Admin Panel

1. Navigate to `/admin` in your app
2. Click on the "🎵 Duration Updates" tab
3. Use the Duration Update Tool

### Features

- **Visual progress tracking** - See real-time updates as songs are processed
- **Confidence scoring** - Shows how well the found song matches your data
- **Error handling** - Clear feedback for songs that couldn't be found
- **Rate limiting** - Automatically respects API limits
- **Database integration** - Updates are saved automatically

### How to Use

1. Choose update mode:
   - **"Only songs missing durations"** - Updates only songs without valid durations
   - **"All songs"** - Updates all songs (overwrites existing durations)

2. Click "🚀 Start Duration Update"

3. Monitor progress and review results

4. Songs are automatically updated in your database

## Method 2: Command Line Script

### Installation

The required dependencies should already be installed. If not:

```bash
npm install node-fetch dotenv
```

### Basic Usage

```bash
# Dry run (see what would be updated without making changes)
node scripts/update-song-durations.js

# Actually update songs missing durations
node scripts/update-song-durations.js --update

# Update ALL songs (including those with existing durations)
node scripts/update-song-durations.js --update --force

# Show help
node scripts/update-song-durations.js --help
```

### Using npm scripts

```bash
# Run the duration update script
npm run update-durations

# With parameters (add -- before options)
npm run update-durations -- --update
npm run update-durations -- --update --force
```

## Data Sources

The system uses multiple music databases to ensure accurate results:

### 1. iTunes API (Primary)
- **Free** - No API key required
- **Reliable** - High-quality, official data
- **Coverage** - Excellent for popular songs

### 2. Spotify API (Optional)
- **Best Quality** - Most accurate duration data
- **Requires Setup** - Need Spotify API credentials
- **Preferred Source** - Used first when available

### 3. MusicBrainz (Backup)
- **Free** - Open source music database
- **Comprehensive** - Good for less common songs
- **Rate Limited** - Slower processing

## Setting Up Spotify API (Optional)

For the highest quality results, you can set up Spotify API access:

### 1. Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in app details (name: "Band Setlist Duration Updater")
5. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add to your `.env.local` file:

```bash
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

### 3. Benefits

- Higher accuracy matching
- More reliable duration data
- Preferred over other sources when available

## How It Works

### 1. Song Matching Process

The system searches for songs using this process:

1. **Query Construction** - Combines song title and artist
2. **API Search** - Searches music databases
3. **Confidence Scoring** - Calculates match quality based on:
   - Title similarity (fuzzy matching)
   - Artist similarity
   - String distance algorithms

### 2. Result Selection

- **Multiple Sources** - Searches all available APIs
- **Best Match** - Selects highest confidence result
- **Source Preference** - Spotify > iTunes > MusicBrainz
- **Fallback Chain** - If one source fails, tries others

### 3. Duration Format

All durations are standardized to `MM:SS` format:
- Examples: `3:45`, `4:12`, `2:30`
- Automatically rounds to nearest second
- Consistent across all music sources

## Troubleshooting

### Common Issues

**"No duration found"**
- Song title/artist might not match database
- Try editing song info for better matching
- Some very new or obscure songs might not be in databases

**"API request failed"**
- Check internet connection
- APIs might be temporarily down
- Rate limiting (wait and try again)

**"Failed to update song"**
- Database connection issue
- Song might have been deleted
- Check application logs

### Best Practices

1. **Clean Song Data** - Ensure accurate titles and artists
2. **Batch Processing** - Update songs in smaller groups if you have many
3. **Regular Updates** - Run periodically for new songs
4. **Backup First** - Always backup your database before bulk updates
5. **Verify Results** - Spot-check updated durations for accuracy

### Rate Limits

- **iTunes**: ~1 request per second (built-in delays)
- **Spotify**: ~100 requests per minute (handled automatically)
- **MusicBrainz**: ~1 request per 2 seconds (very conservative)

## Data Quality

### What Gets Updated

- Songs with missing durations (empty or invalid format)
- Songs with existing durations (when using `--force` mode)
- Duration field only (other song data unchanged)

### Validation

- Checks for valid `MM:SS` format before updating
- Skips songs missing title or artist
- Provides confidence scores for manual review
- Shows matched song details for verification

## Integration

### Database Updates

- Updates songs table directly
- Preserves all other song metadata
- Immediate reflection in all app features:
  - Set Builder duration calculations
  - Gig planning time estimates
  - Performance view timing

### Caching

- No caching implemented (always fresh data)
- Each run searches APIs again
- Ensures most current information

## Advanced Usage

### Environment Variables

```bash
# Required for database access
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_redis_token

# Optional for Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### Custom Processing

The script can be imported and used programmatically:

```javascript
import { updateSongDurations } from './scripts/update-song-durations.js';

// Custom options
await updateSongDurations({
  forceUpdate: true,
  dryRun: false
});
```

### Monitoring

- Progress indicators show current song being processed
- Detailed logging for debugging
- Final report with success/failure counts
- Individual song results with confidence scores

## Support

If you encounter issues:

1. Check the troubleshooting section
2. Verify environment variables are set correctly
3. Ensure database connection is working
4. Check application logs for detailed error messages
5. Try with a smaller subset of songs first

The duration update system is designed to be robust and handle various edge cases, but if you encounter persistent issues, feel free to reach out for support. 