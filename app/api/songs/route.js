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

export async function PUT(request) {
  try {
    const updatedSong = await request.json();
    
    // Read existing songs
    const filePath = path.join(process.cwd(), 'data', 'songs.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const songs = JSON.parse(fileContents);
    
    // Find and update the song
    const songIndex = songs.findIndex(song => song.id === updatedSong.id);
    if (songIndex === -1) {
      return Response.json({ error: 'Song not found' }, { status: 404 });
    }
    
    // Clean up the data
    if (!updatedSong.medley) {
      updatedSong.medley = null;
      updatedSong.medleyPosition = null;
    } else if (updatedSong.medleyPosition) {
      updatedSong.medleyPosition = parseInt(updatedSong.medleyPosition);
    }
    
    // Update the song
    songs[songIndex] = updatedSong;
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(songs, null, 2));
    
    return Response.json(updatedSong);
  } catch (error) {
    console.error('Error updating song:', error);
    return Response.json({ error: 'Failed to update song' }, { status: 500 });
  }
}