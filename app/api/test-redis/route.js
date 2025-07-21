import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET() {
  try {
    console.log('Testing Redis connection...');
    
    // Test basic connection
    await redis.ping();
    console.log('Redis connection successful');
    
    // Clear corrupted band_members data
    console.log('Clearing corrupted band_members data...');
    await redis.del('band_members');
    console.log('band_members key deleted');
    
    // Clear availability data too
    console.log('Clearing availability data...');
    await redis.del('availability');
    console.log('availability key deleted');
    
    // Test setting a simple value
    await redis.set('test_key', 'test_value');
    const testValue = await redis.get('test_key');
    console.log('Test value retrieved:', testValue);
    
    // Clean up test
    await redis.del('test_key');
    
    return NextResponse.json({ 
      message: 'Redis connection successful and corrupted data cleared',
      testValue: testValue
    });
  } catch (error) {
    console.error('Redis test failed:', error);
    return NextResponse.json(
      { error: 'Redis connection failed', details: error.message },
      { status: 500 }
    );
  }
} 