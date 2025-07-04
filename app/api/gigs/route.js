import fs from 'fs';
import path from 'path';

// Helper function to get gigs file path
const getGigsPath = () => path.join(process.cwd(), 'data', 'gigs.json');

// Helper function to ensure gigs file exists
const ensureGigsFile = () => {
  const filePath = getGigsPath();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
};

export async function GET() {
  try {
    ensureGigsFile();
    const filePath = getGigsPath();
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const gigs = JSON.parse(fileContents);
    
    return Response.json(gigs);
  } catch (error) {
    console.error('Error reading gigs file:', error);
    return Response.json({ error: 'Failed to load gigs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    ensureGigsFile();
    const newGig = await request.json();
    
    // Read existing gigs
    const filePath = getGigsPath();
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const gigs = JSON.parse(fileContents);
    
    // Generate new ID
    const maxId = gigs.length > 0 ? Math.max(...gigs.map(gig => gig.id || 0)) : 0;
    newGig.id = maxId + 1;
    
    // Add to gigs array
    gigs.push(newGig);
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(gigs, null, 2));
    
    return Response.json(newGig, { status: 201 });
  } catch (error) {
    console.error('Error saving gig:', error);
    return Response.json({ error: 'Failed to save gig' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    ensureGigsFile();
    const updatedGig = await request.json();
    
    // Read existing gigs
    const filePath = getGigsPath();
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const gigs = JSON.parse(fileContents);
    
    // Find and update the gig
    const gigIndex = gigs.findIndex(gig => gig.id === updatedGig.id);
    if (gigIndex === -1) {
      return Response.json({ error: 'Gig not found' }, { status: 404 });
    }
    
    gigs[gigIndex] = updatedGig;
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(gigs, null, 2));
    
    return Response.json(updatedGig);
  } catch (error) {
    console.error('Error updating gig:', error);
    return Response.json({ error: 'Failed to update gig' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    ensureGigsFile();
    const { searchParams } = new URL(request.url);
    const gigId = parseInt(searchParams.get('id'));
    
    if (!gigId) {
      return Response.json({ error: 'Gig ID required' }, { status: 400 });
    }
    
    // Read existing gigs
    const filePath = getGigsPath();
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const gigs = JSON.parse(fileContents);
    
    // Filter out the gig to delete
    const filteredGigs = gigs.filter(gig => gig.id !== gigId);
    
    if (filteredGigs.length === gigs.length) {
      return Response.json({ error: 'Gig not found' }, { status: 404 });
    }
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(filteredGigs, null, 2));
    
    return Response.json({ message: 'Gig deleted successfully' });
  } catch (error) {
    console.error('Error deleting gig:', error);
    return Response.json({ error: 'Failed to delete gig' }, { status: 500 });
  }
}