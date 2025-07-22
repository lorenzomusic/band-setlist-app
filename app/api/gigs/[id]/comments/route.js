import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET(request, { params }) {
  try {
    const gigId = params.id;
    const gigs = await redis.get('gigs') || [];
    const gig = gigs.find(g => g.id === gigId);
    
    if (!gig) {
      return Response.json({ error: 'Gig not found' }, { status: 404 });
    }
    
    return Response.json(gig.comments || []);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return Response.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const gigId = params.id;
    const { author, message } = await request.json();
    
    if (!author || !message) {
      return Response.json({ error: 'Author and message are required' }, { status: 400 });
    }
    
    const gigs = await redis.get('gigs') || [];
    const gigIndex = gigs.findIndex(g => g.id === gigId);
    
    if (gigIndex === -1) {
      return Response.json({ error: 'Gig not found' }, { status: 404 });
    }
    
    const comment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      author,
      message,
      timestamp: new Date().toISOString()
    };
    
    // Add comment to gig
    gigs[gigIndex].comments = [...(gigs[gigIndex].comments || []), comment];
    await redis.set('gigs', gigs);
    
    return Response.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return Response.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const gigId = params.id;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    
    if (!commentId) {
      return Response.json({ error: 'Comment ID is required' }, { status: 400 });
    }
    
    const gigs = await redis.get('gigs') || [];
    const gigIndex = gigs.findIndex(g => g.id === gigId);
    
    if (gigIndex === -1) {
      return Response.json({ error: 'Gig not found' }, { status: 404 });
    }
    
    // Remove comment from gig
    gigs[gigIndex].comments = (gigs[gigIndex].comments || []).filter(c => c.id !== commentId);
    await redis.set('gigs', gigs);
    
    return Response.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return Response.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
} 