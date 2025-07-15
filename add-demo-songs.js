// add-demo-songs.js
// Run this script to add demo songs to your database
// Usage: node add-demo-songs.js

import { Redis } from '@upstash/redis';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const demoSongs = [
  // English Rock/Pop
  {
    id: "song_001",
    title: "Don't Stop Believin'",
    artist: "Journey",
    duration: 4.1,
    key: "E",
    language: "English",
    energy: "High",
    leadSinger: "Lorentz",
    tags: ["rock", "classic", "crowd-pleaser"],
    notes: "Great opener or closer"
  },
  {
    id: "song_002", 
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    duration: 5.0,
    key: "D",
    language: "English", 
    energy: "High",
    leadSinger: "Lorentz",
    tags: ["rock", "guitar-heavy"],
    notes: "Guitar showcase"
  },
  {
    id: "song_003",
    title: "Livin' on a Prayer",
    artist: "Bon Jovi", 
    duration: 4.1,
    key: "Em",
    language: "English",
    energy: "High",
    leadSinger: "Both",
    tags: ["rock", "anthemic", "crowd-pleaser"],
    notes: "Audience participation"
  },
  {
    id: "song_004",
    title: "Hotel California",
    artist: "Eagles",
    duration: 6.3,
    key: "Bm",
    language: "English",
    energy: "Medium",
    leadSinger: "Lorentz",
    tags: ["classic-rock", "guitar-solo"],
    notes: "Extended guitar solo"
  },
  {
    id: "song_005",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    duration: 5.9,
    key: "Bb",
    language: "English",
    energy: "Dynamic",
    leadSinger: "Both",
    tags: ["epic", "theatrical", "complex"],
    notes: "Show-stopper, requires practice"
  },
  {
    id: "song_006",
    title: "Mr. Brightside",
    artist: "The Killers",
    duration: 3.8,
    key: "D",
    language: "English",
    energy: "High",
    leadSinger: "Lorentz",
    tags: ["indie-rock", "modern", "energetic"],
    notes: "Modern crowd favorite"
  },
  {
    id: "song_007",
    title: "Wonderwall",
    artist: "Oasis",
    duration: 4.3,
    key: "Em",
    language: "English",
    energy: "Medium",
    leadSinger: "Lorentz",
    tags: ["britpop", "sing-along"],
    notes: "Massive sing-along potential"
  },
  {
    id: "song_008",
    title: "Shape of You",
    artist: "Ed Sheeran",
    duration: 3.9,
    key: "C#m",
    language: "English",
    energy: "Medium",
    leadSinger: "Rikke",
    tags: ["pop", "modern", "danceable"],
    notes: "Modern pop hit"
  },
  {
    id: "song_009",
    title: "Rolling in the Deep",
    artist: "Adele",
    duration: 3.8,
    key: "Cm",
    language: "English",
    energy: "Medium",
    leadSinger: "Rikke",
    tags: ["soul", "powerful", "emotional"],
    notes: "Vocal showcase for Rikke"
  },
  {
    id: "song_010",
    title: "Someone Like You",
    artist: "Adele",
    duration: 4.7,
    key: "A",
    language: "English",
    energy: "Low",
    leadSinger: "Rikke",
    tags: ["ballad", "emotional", "piano"],
    notes: "Intimate moment, piano-based"
  },

  // Danish Songs
  {
    id: "song_011",
    title: "Hvor Små Vi Er",
    artist: "Flemming Østermann",
    duration: 4.2,
    key: "G",
    language: "Danish",
    energy: "Medium",
    leadSinger: "Lorentz",
    tags: ["danish", "folk", "nostalgic"],
    notes: "Danish classic"
  },
  {
    id: "song_012",
    title: "Sommer og Solskin",
    artist: "Lars Løkke Band",
    duration: 3.5,
    key: "D",
    language: "Danish",
    energy: "High",
    leadSinger: "Rikke",
    tags: ["danish", "summer", "upbeat"],
    notes: "Perfect for outdoor gigs"
  },
  {
    id: "song_013",
    title: "Karma",
    artist: "Björk",
    duration: 4.1,
    key: "Em",
    language: "Danish",
    energy: "Medium",
    leadSinger: "Rikke",
    tags: ["danish", "alternative", "modern"],
    notes: "Modern Danish hit"
  },
  {
    id: "song_014",
    title: "Langt Væk",
    artist: "Mads Langer",
    duration: 3.9,
    key: "Am",
    language: "Danish",
    energy: "Low",
    leadSinger: "Both",
    tags: ["danish", "emotional", "duet"],
    notes: "Beautiful duet opportunity"
  },
  {
    id: "song_015",
    title: "Øl på Øl",
    artist: "TV-2",
    duration: 3.2,
    key: "C",
    language: "Danish",
    energy: "High",
    leadSinger: "Lorentz",
    tags: ["danish", "party", "rock"],
    notes: "Party anthem"
  },

  // More English Variety
  {
    id: "song_016",
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    duration: 4.3,
    key: "Dm",
    language: "English",
    energy: "High",
    leadSinger: "Both",
    tags: ["funk", "danceable", "modern"],
    notes: "Dance floor filler"
  },
  {
    id: "song_017",
    title: "Can't Stop the Feeling",
    artist: "Justin Timberlake",
    duration: 3.9,
    key: "C",
    language: "English",
    energy: "High",
    leadSinger: "Rikke",
    tags: ["pop", "feel-good", "danceable"],
    notes: "Feel-good anthem"
  },
  {
    id: "song_018",
    title: "Havana",
    artist: "Camila Cabello",
    duration: 3.7,
    key: "Gm",
    language: "English",
    energy: "Medium",
    leadSinger: "Rikke",
    tags: ["latin", "modern", "sultry"],
    notes: "Latin rhythm"
  },
  {
    id: "song_019",
    title: "Shallow",
    artist: "Lady Gaga & Bradley Cooper",
    duration: 3.6,
    key: "G",
    language: "English",
    energy: "Medium",
    leadSinger: "Both",
    tags: ["duet", "emotional", "contemporary"],
    notes: "Perfect duet, very popular"
  },
  {
    id: "song_020",
    title: "Perfect",
    artist: "Ed Sheeran",
    duration: 4.4,
    key: "Ab",
    language: "English",
    energy: "Low",
    leadSinger: "Lorentz",
    tags: ["romantic", "acoustic", "wedding"],
    notes: "Wedding favorite"
  },
  {
    id: "song_021",
    title: "Thinking Out Loud",
    artist: "Ed Sheeran",
    duration: 4.7,
    key: "D",
    language: "English",
    energy: "Low",
    leadSinger: "Lorentz",
    tags: ["romantic", "acoustic", "intimate"],
    notes: "Intimate acoustic moment"
  },
  {
    id: "song_022",
    title: "Blinding Lights",
    artist: "The Weeknd",
    duration: 3.3,
    key: "Fm",
    language: "English",
    energy: "High",
    leadSinger: "Lorentz",
    tags: ["synthwave", "modern", "energetic"],
    notes: "Modern hit with retro feel"
  },
  {
    id: "song_023",
    title: "Levitating",
    artist: "Dua Lipa",
    duration: 3.2,
    key: "Bm",
    language: "English",
    energy: "High",
    leadSinger: "Rikke",
    tags: ["disco", "modern", "danceable"],
    notes: "Modern disco vibes"
  },
  {
    id: "song_024",
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    duration: 2.9,
    key: "A",
    language: "English",
    energy: "High",
    leadSinger: "Rikke",
    tags: ["pop-punk", "modern", "youthful"],
    notes: "Appeals to younger crowd"
  },
  {
    id: "song_025",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    duration: 2.9,
    key: "C",
    language: "English",
    energy: "Medium",
    leadSinger: "Lorentz",
    tags: ["pop", "summer", "groovy"],
    notes: "Summer vibes"
  }
];

async function addDemoSongs() {
  try {
    console.log('🎵 Adding demo songs to database...');
    
    // Get existing songs
    const existingSongs = await redis.get('songs') || [];
    console.log(`📊 Found ${existingSongs.length} existing songs`);
    
    // Combine with demo songs (avoiding duplicates by ID)
    const existingIds = new Set(existingSongs.map(song => song.id));
    const newSongs = demoSongs.filter(song => !existingIds.has(song.id));
    
    const allSongs = [...existingSongs, ...newSongs];
    
    // Save to database
    await redis.set('songs', allSongs);
    
    console.log(`✅ Successfully added ${newSongs.length} new demo songs`);
    console.log(`📈 Total songs in database: ${allSongs.length}`);
    console.log('\n🎯 Song breakdown:');
    
    // Show statistics
    const englishSongs = allSongs.filter(s => s.language === 'English').length;
    const danishSongs = allSongs.filter(s => s.language === 'Danish').length;
    const highEnergy = allSongs.filter(s => s.energy === 'High').length;
    const mediumEnergy = allSongs.filter(s => s.energy === 'Medium').length;
    const lowEnergy = allSongs.filter(s => s.energy === 'Low').length;
    
    console.log(`🇺🇸 English songs: ${englishSongs} (${Math.round(englishSongs/allSongs.length*100)}%)`);
    console.log(`🇩🇰 Danish songs: ${danishSongs} (${Math.round(danishSongs/allSongs.length*100)}%)`);
    console.log(`⚡ High energy: ${highEnergy}`);
    console.log(`🎵 Medium energy: ${mediumEnergy}`);
    console.log(`🎭 Low energy: ${lowEnergy}`);
    
  } catch (error) {
    console.error('❌ Error adding demo songs:', error);
  }
}

addDemoSongs(); 