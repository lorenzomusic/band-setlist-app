import fs from 'fs';
import path from 'path';

// Helper function to get setlists file path
const getSetlistsPath = () => path.join(process.cwd(), 'data', 'setlists.json');

// Helper function to ensure setlists file exists
const ensureSetlistsFile = () => {
  const filePath = getSetlistsPath();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
};

export async function GET() {
  try {
    ensureSetlistsFile();
    const filePath = getSetlistsPath();
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const setlists = JSON.parse(fileContents);
    
    return Response.json(setlists);
  } catch (error) {
    console.error('Error reading setlists file:', error);
    return Response.json({ error: 'Failed to load setlists' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    ensureSetlistsFile();
    const newSetlist = await request.json();
    
    // Read existing setlists
    const filePath = getSetlistsPath();
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const setlists = JSON.parse(fileContents);
    
    // Generate new ID
    const maxId = setlists.length > 0 ? Math.max(...setlists.map(setlist => setlist.id || 0)) : 0;
    newSetlist.id = maxId + 1;
    
    // Add to setlists array
    setlists.push(newSetlist);
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(setlists, null, 2));
    
    return Response.json(newSetlist, { status: 201 });
  } catch (error) {
    console.error('Error saving setlist:', error);
    return Response.json({ error: 'Failed to save setlist' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    ensureSetlistsFile();
    const updatedSetlist = await request.json();
    
    // Read existing setlists
    const filePath = getSetlistsPath();
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const setlists = JSON.parse(fileContents);
    
    // Find and update the setlist
    const setlistIndex = setlists.findIndex(setlist => setlist.id === updatedSetlist.id);
    if (setlistIndex === -1) {
      return Response.json({ error: 'Setlist not found' }, { status: 404 });
    }
    
    setlists[setlistIndex] = updatedSetlist;
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(setlists, null, 2));
    
    return Response.json(updatedSetlist);
  } catch (error) {
    console.error('Error updating setlist:', error);
    return Response.json({ error: 'Failed to update setlist' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    ensureSetlistsFile();
    const { searchParams } = new URL(request.url);
    const setlistId = parseInt(searchParams.get('id'));
    
    if (!setlistId) {
      return Response.json({ error: 'Setlist ID required' }, { status: 400 });
    }
    
    // Read existing setlists
    const filePath = getSetlistsPath();
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const setlists = JSON.parse(fileContents);
    
    // Filter out the setlist to delete
    const filteredSetlists = setlists.filter(setlist => setlist.id !== setlistId);
    
    if (filteredSetlists.length === setlists.length) {
      return Response.json({ error: 'Setlist not found' }, { status: 404 });
    }
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(filteredSetlists, null, 2));
    
    return Response.json({ message: 'Setlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting setlist:', error);
    return Response.json({ error: 'Failed to delete setlist' }, { status: 500 });
  }
}