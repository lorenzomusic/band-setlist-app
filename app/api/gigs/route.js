import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET() {
  try {
    const gigs = await redis.get('gigs') || [];
    return Response.json(gigs);
  } catch (error) {
    console.error('Error fetching gigs:', error);
    return Response.json({ error: 'Failed to fetch gigs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const newGig = await request.json();
    const gigs = await redis.get('gigs') || [];
    
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const gigWithId = {
      ...newGig,
      id
    };
    
    gigs.push(gigWithId);
    await redis.set('gigs', gigs);
    
    return Response.json(gigWithId, { status: 201 });
  } catch (error) {
    console.error('Error creating gig:', error);
    return Response.json({ error: 'Failed to create gig' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const updatedGig = await request.json();
    const gigs = await redis.get('gigs') || [];
    
    const index = gigs.findIndex(gig => String(gig.id) === String(updatedGig.id));
    if (index !== -1) {
      gigs[index] = updatedGig;
      await redis.set('gigs', gigs);
      return Response.json(updatedGig);
    } else {
      return Response.json({ error: 'Gig not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error updating gig:', error);
    return Response.json({ error: 'Failed to update gig' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json({ error: 'Gig ID is required' }, { status: 400 });
    }
    
    const gigs = await redis.get('gigs') || [];
    const filteredGigs = gigs.filter(gig => String(gig.id) !== String(id));
    
    if (filteredGigs.length === gigs.length) {
      return Response.json({ error: 'Gig not found' }, { status: 404 });
    }
    
    await redis.set('gigs', filteredGigs);
    return Response.json({ message: 'Gig deleted successfully' });
  } catch (error) {
    console.error('Error deleting gig:', error);
    return Response.json({ error: 'Failed to delete gig' }, { status: 500 });
  }
}