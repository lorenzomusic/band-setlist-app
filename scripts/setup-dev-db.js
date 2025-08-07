#!/usr/bin/env node
/**
 * Development Database Setup Script
 * 
 * This script helps you set up a separate development database
 * to avoid conflicts with your production data.
 */

import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const KEY_PREFIX = 'dev:';

async function setupDevDatabase() {
  console.log('🚀 Setting up development database...\n');
  
  try {
    // Validate configuration
    if (!REDIS_URL || !REDIS_TOKEN) {
      throw new Error('Redis credentials not found. Check .env.local file.');
    }
    
    console.log('Environment Info:');
    console.log(`  Environment: development`);
    console.log(`  Database: ${REDIS_URL.includes('upstash') ? 'Upstash Redis' : 'Redis'}`);
    console.log(`  Key Prefix: ${KEY_PREFIX}`);
    console.log(`  Redis URL: ${REDIS_URL.substring(0, 30)}...`);
    console.log();
    
    const redis = new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    });
    
    // Test connection
    console.log('🔗 Testing database connection...');
    await redis.set(KEY_PREFIX + 'test', 'Hello from dev!');
    const testValue = await redis.get(KEY_PREFIX + 'test');
    
    if (testValue === 'Hello from dev!') {
      console.log('✅ Database connection successful!');
      await redis.del(KEY_PREFIX + 'test');
    } else {
      throw new Error('Database test failed');
    }
    
    // Create initial dev data if needed
    console.log('\n📝 Setting up initial development data...');
    
    const existingSongs = await redis.get(KEY_PREFIX + 'songs');
    if (!existingSongs) {
      const initialSongs = [
        {
          id: 'dev_song_1',
          title: 'Dev Test Song 1',
          artist: 'Test Artist',
          language: 'english',
          vocalist: 'Rikke',
          duration: '3:45',
          key: 'C',
        },
        {
          id: 'dev_song_2',
          title: 'Dev Test Song 2', 
          artist: 'Test Artist',
          language: 'danish',
          vocalist: 'Lorentz',
          duration: '4:20',
          key: 'G',
        },
      ];
      
      await redis.set(KEY_PREFIX + 'songs', initialSongs);
      console.log('✅ Created initial test songs');
    } else {
      console.log('ℹ️  Development songs already exist');
    }
    
    console.log('\n🎉 Development database setup complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Your development environment is now isolated from production');
    console.log('2. Start your dev server: npm run dev');
    console.log('3. All changes will use the dev database with prefix:', KEY_PREFIX);
    console.log('\n⚠️  To use a completely separate database:');
    console.log('1. Create a new database at https://console.upstash.com/redis');
    console.log('2. Update UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.development');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDevDatabase();