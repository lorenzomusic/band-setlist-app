import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';
import Papa from 'papaparse';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function importSongs() {
  try {
    console.log('🎵 Starting song import...');
    
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'songs_import.csv');
    const csvData = fs.readFileSync(csvPath, 'utf8');
    
    console.log('📁 CSV file loaded');
    
    // Parse CSV
    const results = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });
    
    console.log(`📊 Found ${results.data.length} songs in CSV`);
    
    // Convert to app format
    const songs = results.data
      .filter(row => row.title && row.artist) // Skip empty rows
      .map((row, index) => {
        const id = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9) + '_' + index;
        
        return {
          id,
          title: row.title?.trim() || '',
          artist: row.artist?.trim() || '',
          key: row.key?.trim() || '',
          duration: row.duration?.trim() || '',
          language: (row.language?.toLowerCase().trim() === 'danish') ? 'danish' : 'english',
          vocalist: ['Rikke', 'Lorentz', 'Both'].includes(row.vocalist?.trim()) ? row.vocalist.trim() : 'Both',
          energy: ['Low', 'Medium', 'High'].includes(row.energy?.trim()) ? row.energy.trim() : 'Medium',
          leadSinger: ['Rikke', 'Lorentz', 'Both'].includes(row.leadSinger?.trim()) ? row.leadSinger.trim() : (row.vocalist?.trim() || 'Both'),
          bassGuitar: row.bassGuitar?.trim() || '4-string Electric',
          guitar: row.guitar?.trim() || 'Electric',
          backingTrack: row.backingTrack?.toLowerCase().trim() === 'true',
          form: row.form?.trim() || '',
          medley: row.medley?.trim() || null,
          medleyPosition: row.medleyPosition ? parseInt(row.medleyPosition) : null,
          youtubeLink: row.youtubeLink?.trim() || '',
          notes: row.notes?.trim() || '',
          tags: row.tags ? row.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag) : []
        };
      });
    
    console.log(`✅ Processed ${songs.length} valid songs`);
    
    // Clear existing songs and import new ones
    console.log('🗑️ Clearing existing songs...');
    await redis.set('songs', []);
    
    console.log('💾 Importing new songs...');
    await redis.set('songs', songs);
    
    console.log('🎉 Import completed successfully!');
    console.log(`📈 Total songs in database: ${songs.length}`);
    
    // Show summary stats
    const stats = {
      total: songs.length,
      english: songs.filter(s => s.language === 'english').length,
      danish: songs.filter(s => s.language === 'danish').length,
      withBackingTracks: songs.filter(s => s.backingTrack).length,
      inMedleys: songs.filter(s => s.medley).length
    };
    
    console.log('\n📊 Import Summary:');
    console.log(`- Total songs: ${stats.total}`);
    console.log(`- English: ${stats.english}`);
    console.log(`- Danish: ${stats.danish}`);
    console.log(`- With backing tracks: ${stats.withBackingTracks}`);
    console.log(`- In medleys: ${stats.inMedleys}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importSongs().then(() => {
  console.log('✨ All done!');
  process.exit(0);
}); 