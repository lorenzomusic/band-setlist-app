import { Redis } from '@upstash/redis'
import { config, createKey } from '../../../lib/config';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

// Verify session and get user info
async function verifySession(request) {
  try {
    const sessionToken = request.cookies.get('session')?.value;
    
    if (!sessionToken) {
      return { authenticated: false, session: null };
    }
    
    const sessionData = await redis.get(createKey(`session:${sessionToken}`));
    
    if (!sessionData) {
      return { authenticated: false, session: null };
    }
    
    // Check if session has expired
    if (new Date() > new Date(sessionData.expiresAt)) {
      await redis.del(createKey(`session:${sessionToken}`));
      return { authenticated: false, session: null };
    }
    
    return { authenticated: true, session: sessionData };
    
  } catch (error) {
    console.error('Session verification error:', error);
    return { authenticated: false, session: null };
  }
}

export async function GET(request) {
  try {
    const { authenticated, session } = await verifySession(request);
    
    if (!authenticated) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const gigs = await redis.get(createKey('gigs')) || [];
    
    // Check if user is a band member and filter gigs accordingly
    const bandMembers = await redis.get(createKey('band-members')) || [];
    const bandMember = bandMembers.find(member => member.userId === session.userId);
    
    // If user is a replacement member (non-core), only show gigs where they're in the lineup
    if (bandMember && !bandMember.isCore) {
      const filteredGigs = gigs.filter(gig => {
        if (!gig.lineup || gig.lineup.length === 0) return false;
        return gig.lineup.some(lineupItem => lineupItem.memberId === bandMember.id);
      });
      return Response.json(filteredGigs);
    }
    
    // For core members, admins, and non-band members, show all gigs
    return Response.json(gigs);
  } catch (error) {
    console.error('Error fetching gigs:', error);
    return Response.json({ error: 'Failed to fetch gigs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { authenticated, session } = await verifySession(request);
    
    if (!authenticated) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Check if user is a replacement member - they cannot create gigs
    const bandMembers = await redis.get(createKey('band-members')) || [];
    const bandMember = bandMembers.find(member => member.userId === session.userId);
    
    if (bandMember && !bandMember.isCore) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const newGig = await request.json();
    const gigs = await redis.get(createKey('gigs')) || [];
    
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Set default values for new fields if not provided
    const gigWithId = {
      ...newGig,
      id,
      status: newGig.status || 'pending',
      comments: newGig.comments || [],
      lineup: newGig.lineup || [],
      contractUploaded: newGig.contractUploaded || false,
      createdAt: new Date().toISOString()
    };
    
    gigs.push(gigWithId);
    await redis.set(createKey('gigs'), gigs);
    
    return Response.json(gigWithId, { status: 201 });
  } catch (error) {
    console.error('Error creating gig:', error);
    return Response.json({ error: 'Failed to create gig' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { authenticated, session } = await verifySession(request);
    
    if (!authenticated) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Check if user is a replacement member - they cannot update gigs
    const bandMembers = await redis.get(createKey('band-members')) || [];
    const bandMember = bandMembers.find(member => member.userId === session.userId);
    
    if (bandMember && !bandMember.isCore) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const updatedGig = await request.json();
    const gigs = await redis.get(createKey('gigs')) || [];
    
    const index = gigs.findIndex(gig => String(gig.id) === String(updatedGig.id));
    if (index !== -1) {
      // Preserve existing fields and update with new data
      const existingGig = gigs[index];
      const mergedGig = {
        ...existingGig,
        ...updatedGig,
        updatedAt: new Date().toISOString()
      };
      
      gigs[index] = mergedGig;
      await redis.set(createKey('gigs'), gigs);
      return Response.json(mergedGig);
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
    const { authenticated, session } = await verifySession(request);
    
    if (!authenticated) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Check if user is a replacement member - they cannot delete gigs
    const bandMembers = await redis.get(createKey('band-members')) || [];
    const bandMember = bandMembers.find(member => member.userId === session.userId);
    
    if (bandMember && !bandMember.isCore) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return Response.json({ error: 'Gig ID is required' }, { status: 400 });
    }
    
    const gigs = await redis.get(createKey('gigs')) || [];
    const filteredGigs = gigs.filter(gig => String(gig.id) !== String(id));
    
    if (filteredGigs.length === gigs.length) {
      return Response.json({ error: 'Gig not found' }, { status: 404 });
    }
    
    await redis.set(createKey('gigs'), filteredGigs);
    return Response.json({ message: 'Gig deleted successfully' });
  } catch (error) {
    console.error('Error deleting gig:', error);
    return Response.json({ error: 'Failed to delete gig' }, { status: 500 });
  }
}