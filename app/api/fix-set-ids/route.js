import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function POST() {
  try {
    const sets = await redis.get('sets') || [];
    
    console.log('Before fix:', sets.map(s => ({ id: s.id, type: typeof s.id, name: s.name })));
    
    // Fix all set IDs to be consistent strings
    const fixedSets = sets.map(set => ({
      ...set,
      id: String(set.id || Date.now() + Math.random().toString(36).substr(2, 9))
    }));
    
    await redis.set('sets', fixedSets);
    
    console.log('After fix:', fixedSets.map(s => ({ id: s.id, type: typeof s.id, name: s.name })));
    
    return Response.json({ 
      message: 'Set IDs fixed', 
      before: sets.length, 
      after: fixedSets.length,
      beforeTypes: sets.map(s => typeof s.id),
      afterTypes: fixedSets.map(s => typeof s.id)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sets = await redis.get('sets') || [];
    
    return Response.json({
      message: 'Current set ID status',
      sets: sets.map(s => ({ id: s.id, type: typeof s.id, name: s.name })),
      totalSets: sets.length,
      idTypes: sets.map(s => typeof s.id),
      uniqueTypes: [...new Set(sets.map(s => typeof s.id))]
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 