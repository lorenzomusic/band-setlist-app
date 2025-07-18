# 🎵 Spotify Integration Setup Guide

This guide will help you set up Spotify integration for your Greatest Gig band management app, enabling automatic song linking and playlist creation from your setlists.

## 🚀 **What You'll Get**

- **🔗 Automatic Song Linking** - Find Spotify URLs for all your songs
- **🎧 Playlist Creation** - Turn any gig setlist into a Spotify playlist instantly
- **⏱️ Better Duration Data** - More accurate song lengths from Spotify's database
- **🎵 Preview Tracks** - Quick audio previews of songs (30-second clips)
- **📱 Share Setlists** - Send Spotify playlists to venues, band members, or fans

## 📋 **Step-by-Step Setup**

### **Step 1: Create a Spotify Developer Account**

1. **Visit Spotify Developer Dashboard**
   - Go to [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
   - Click **"Log in"** (use your regular Spotify account)
   - If you don't have a Spotify account, create one (it's free!)

2. **Accept Developer Terms**
   - You may need to accept Spotify's developer terms of service
   - This is a one-time process

### **Step 2: Create Your App**

1. **Click "Create App"**
   
2. **Fill in App Details:**
   ```
   App Name: Greatest Gig - Band Setlist Manager
   App Description: Professional band management app for creating setlists and managing performances
   Website: https://band-setlist-app.vercel.app
   Redirect URI: https://band-setlist-app.vercel.app/api/auth/spotify/callback
   ```

3. **Select API/SDKs:**
   - ✅ **Web API** (this is the main one we need)
   - ✅ **Web Playback SDK** (for future audio features)

4. **Agree to Terms and Create**

### **Step 3: Get Your Credentials**

After creating the app, you'll see your dashboard:

1. **Copy Your Client ID**
   - This is publicly visible (safe to use in frontend)
   - It looks like: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`

2. **Get Your Client Secret**
   - Click **"View client secret"**
   - ⚠️ **IMPORTANT:** Keep this secret! Never share it publicly
   - It looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

### **Step 4: Configure Your Environment Variables**

**For Vercel (Production):**

1. **Go to your Vercel project dashboard**
2. **Click on "Settings" → "Environment Variables"**
3. **Add these variables:**

```bash
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=https://band-setlist-app.vercel.app/api/auth/spotify/callback
```

**For Local Development (Optional):**

Add to your `.env.local` file:

```bash
# Spotify API Credentials (Local Development)
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3001/api/auth/spotify/callback
```

### **Step 5: Configure Redirect URIs in Spotify**

1. **Go back to your Spotify app dashboard**
2. **Click "Settings"**
3. **Under "Redirect URIs", add:**
   - **Production:** `https://band-setlist-app.vercel.app/api/auth/spotify/callback`
   - **Local (optional):** `http://localhost:3001/api/auth/spotify/callback`

4. **Save Changes**

### **Step 6: Deploy and Test**

1. **Deploy to Vercel**
   ```bash
   # If you haven't already
   npm run build
   # Or push to your GitHub repo connected to Vercel
   ```

2. **Test the Integration**
   - Go to `https://band-setlist-app.vercel.app/admin`
   - Click on **"🎵 Spotify Integration"** tab
   - Click **"🎵 Connect Spotify"**
   - You should be redirected to Spotify for authorization
   - After granting permissions, you'll be redirected back to your app

3. **Success!**
   - You should see a green "Connected to Spotify" status
   - The system can now find Spotify URLs and create playlists

## 🎯 **How to Use After Setup**

### **Finding Spotify URLs for Songs**

1. **Automatic Bulk Linking**
   - Go to **Admin Panel** → **Spotify Integration**
   - Click **"🔍 Find Spotify URLs for X songs"**
   - Watch the progress bar as it finds links automatically

2. **Manual Song Editing**
   - Go to **Songs** section
   - Edit any song and the Spotify URL field will be available
   - The system can auto-populate this when you save

### **Creating Spotify Playlists from Gigs**

1. **From Gig Management**
   - Go to your **Gigs** section
   - For any gig, look for **"📱 Create Spotify Playlist"** button
   - Choose public or private playlist
   - The system will:
     - Search for each song on Spotify
     - Create a playlist named "{Gig Name} - Setlist"
     - Add found songs in the correct order
     - Give you a link to the playlist

2. **Playlist Features**
   - **Automatic naming**: "Summer Festival 2024 - Setlist"
   - **Custom descriptions**: "Setlist for {gig name} gig. Created by Greatest Gig app."
   - **Match reporting**: Shows which songs were found/not found
   - **Direct Spotify links**: Open playlists immediately

## 🔧 **Production vs Development Setup**

### **Production (Vercel)**
```bash
# Environment Variables in Vercel Dashboard
SPOTIFY_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
SPOTIFY_CLIENT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
SPOTIFY_REDIRECT_URI=https://band-setlist-app.vercel.app/api/auth/spotify/callback
```

**Redirect URI in Spotify App:**
- `https://band-setlist-app.vercel.app/api/auth/spotify/callback`

### **Local Development (Optional)**
```bash
# .env.local file
SPOTIFY_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
SPOTIFY_CLIENT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
SPOTIFY_REDIRECT_URI=http://localhost:3001/api/auth/spotify/callback
```

**Additional Redirect URI in Spotify App:**
- `http://localhost:3001/api/auth/spotify/callback` (if you want to test locally)

## 📊 **Features Overview**

### **Song Management Enhancements**

- **Automatic Duration Updates**: More accurate than iTunes/MusicBrainz
- **Spotify URLs**: Direct links to songs on Spotify
- **Preview Audio**: 30-second previews (future feature)
- **Album Artwork**: High-quality images from Spotify

### **Playlist Creation**

- **From Any Setlist**: Convert gigs to Spotify playlists
- **Smart Matching**: High-confidence song matching with fallbacks
- **Batch Processing**: Handle large setlists efficiently
- **Public/Private Options**: Control playlist visibility

### **Analytics & Reporting**

- **Match Success Rates**: See how many songs were found
- **Missing Songs Report**: Identify songs not on Spotify
- **Playlist Statistics**: Track created playlists and engagement

## 🛠️ **Troubleshooting**

### **Common Issues**

**"Failed to connect to Spotify"**
- Check your Client ID and Client Secret are correct in Vercel environment variables
- Ensure redirect URI matches exactly: `https://band-setlist-app.vercel.app/api/auth/spotify/callback`
- Verify environment variables are saved and deployment is complete

**"Redirect URI mismatch"**
- Make sure the redirect URI in Spotify app settings exactly matches your Vercel URL
- Check for typos: it should be `https://band-setlist-app.vercel.app/api/auth/spotify/callback`
- Ensure you're using HTTPS (not HTTP) for production

**"Environment variables not found"**
- Go to Vercel dashboard → Your Project → Settings → Environment Variables
- Make sure all three Spotify variables are set
- Redeploy your app after adding environment variables

**"No duration found" vs "Found duration"**
- Spotify has the best duration data, so enable it first
- Fallback order: Spotify → iTunes → MusicBrainz
- Some very new or obscure songs might not be on Spotify

**"Failed to create playlist"**
- Check you're connected to Spotify (green status)
- Verify your account has playlist creation permissions
- Some corporate accounts may have restrictions

**"Song not found on Spotify"**
- Not all songs are available on Spotify (licensing)
- Try editing the song title/artist for better matching
- Consider alternate versions or covers

### **Rate Limits**

- **Spotify API**: 100 requests per minute (handled automatically)
- **Duration updates**: ~4 songs per second (respectful rate limiting)
- **Playlist creation**: Up to 100 songs per request

### **Permissions Required**

The app requests these Spotify permissions:
- **playlist-modify-public**: Create public playlists
- **playlist-modify-private**: Create private playlists  
- **user-read-private**: Get your user profile
- **user-read-email**: Get your email (for account identification)

## 🎵 **Advanced Tips**

### **Optimizing Song Matching**

1. **Clean Song Data**
   - Use exact song titles as they appear on Spotify
   - Include featured artists: "Song ft. Artist" or "Song (feat. Artist)"
   - Avoid extra text: "Song - Live Version" → "Song"

2. **Artist Names**
   - Use primary artist name as it appears on Spotify
   - For collaborations, use the main artist
   - Avoid band name variations: "The Beatles" not "Beatles"

3. **Confidence Scoring**
   - 90-100%: Excellent match (automatically selected)
   - 70-89%: Good match (review recommended)
   - Below 70%: Poor match (manual review needed)

### **Playlist Organization**

- **Naming Convention**: "{Event} - {Date}" or "{Venue} Setlist"
- **Descriptions**: Include event details, venue, date
- **Collaborative Playlists**: Share with band members for input
- **Backup Playlists**: Keep copies of important setlists

## 🚀 **Next Steps**

After setting up Spotify integration:

1. **Deploy your app to Vercel** with environment variables
2. **Test the connection** on your live site
3. **Link Spotify URLs** to your existing songs
4. **Create a test playlist** from a small gig
5. **Explore admin analytics** to see completion rates
6. **Set up regular data updates** to keep everything current

The Spotify integration dramatically enhances your band management workflow by connecting your internal organization with the world's largest music platform! 🎸🎤 