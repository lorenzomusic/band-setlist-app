import fs from 'fs';
import path from 'path';

// Helper function to get sets file path
const getSetsPath = () => path.join(process.cwd(), 'data', 'sets.json');

// Helper function to ensure sets file exists
const ensureSetsFile = () => {
  const filePath = getSetsPath();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
};

export async function GET() {
  try {
    ensureSetsFile();
    const filePath = getSetsPath();
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const sets = JSON.parse(fileContents);
    
    return Response.json(sets);
  } catch (error) {
    console.error('Error reading sets file:', error);
    return Response.json({ error: 'Failed to load sets' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    ensureSetsFile();
    const newSet = await request.json();
    
    // Read existing sets
    const filePath = getSetsPath();
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const sets = JSON.parse(fileContents);
    
    // Generate new ID
    const maxId = sets.length > 0 ? Math.max(...sets.map(set => set.id || 0)) : 0;
    newSet.id = maxId + 1;
    
    // Add to sets array
    sets.push(newSet);
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(sets, null, 2));
    
    return Response.json(newSet, { status: 201 });
  } catch (error) {
    console.error('Error saving set:', error);
    return Response.json({ error: 'Failed to save set' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    ensureSetsFile();
    const updatedSet = await request.json();
    
    // Read existing sets
    const filePath = getSetsPath();
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const sets = JSON.parse(fileContents);
    
    // Find and update the set
    const setIndex = sets.findIndex(set => set.id === updatedSet.id);
    if (setIndex === -1) {
      return Response.json({ error: 'Set not found' }, { status: 404 });
    }
    
    sets[setIndex] = updatedSet;
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(sets, null, 2));
    
    return Response.json(updatedSet);
  } catch (error) {
    console.error('Error updating set:', error);
    return Response.json({ error: 'Failed to update set' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    ensureSetsFile();
    const { searchParams } = new URL(request.url);
    const setId = parseInt(searchParams.get('id'));
    
    if (!setId) {
      return Response.json({ error: 'Set ID required' }, { status: 400 });
    }
    
    // Read existing sets
    const filePath = getSetsPath();
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const sets = JSON.parse(fileContents);
    
    // Filter out the set to delete
    const filteredSets = sets.filter(set => set.id !== setId);
    
    if (filteredSets.length === sets.length) {
      return Response.json({ error: 'Set not found' }, { status: 404 });
    }
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(filteredSets, null, 2));
    
    return Response.json({ message: 'Set deleted successfully' });
  } catch (error) {
    console.error('Error deleting set:', error);
    return Response.json({ error: 'Failed to delete set' }, { status: 500 });
  }
}