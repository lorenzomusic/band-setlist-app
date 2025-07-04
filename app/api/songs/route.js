import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'songs.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const songs = JSON.parse(fileContents);
    
    return Response.json(songs);
  } catch (error) {
    console.error('Error reading songs file:', error);
    return Response.json({ error: 'Failed to load songs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newSong = await request.json();
    
    // Read existing songs
    const filePath = path.join(process.cwd(), 'data', 'songs.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const songs = JSON.parse(fileContents);
    
    // Generate new ID
    const maxId = songs.length > 0 ? Math.max(...songs.map(song => song.id)) : 0;
    newSong.id = maxId + 1;
    
    // Clean up the data
    if (!newSong.medley) {
      newSong.medley = null;
      newSong.medleyPosition = null;
    } else if (newSong.medleyPosition) {
      newSong.medleyPosition = parseInt(newSong.medleyPosition);
    }
    
    // Add to songs array
    songs.push(newSong);
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(songs, null, 2));
    
    return Response.json(newSong, { status: 201 });
  } catch (error) {
    console.error('Error saving song:', error);
    return Response.json({ error: 'Failed to save song' }, { status: 500 });
  }
}