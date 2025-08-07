# Multi-Environment Setup Guide

This guide helps you set up separate databases for development, staging, and production environments.

## Current Problem
- Single Redis database used for both development and production
- Local changes affect live users 
- No safe testing environment

## Solution Overview

### Environment Structure
- **Development** (`dev:`): Local development with isolated data
- **Staging** (`staging:`): Testing environment before production
- **Production** (`prod:`): Live user data (your current setup)

### Database Strategy
Each environment uses key prefixes to separate data:
- Development: `dev:songs`, `dev:gigs`, `dev:session:xxx`
- Staging: `staging:songs`, `staging:gigs`, `staging:session:xxx` 
- Production: `prod:songs`, `prod:gigs`, `prod:session:xxx`

## Quick Setup (Recommended)

### 1. Run Development Setup
```bash
npm run setup-dev
```
This creates isolated development data using key prefixes.

### 2. Start Development Server
```bash
npm run dev
```
Now your local development uses `dev:` prefixed keys, keeping production data safe.

## Advanced Setup (Separate Databases)

For complete isolation, create separate Upstash databases:

### 1. Create Development Database
1. Go to https://console.upstash.com/redis
2. Create new database: "greatest-gig-dev"
3. Copy URL and token to `.env.development`:
```env
UPSTASH_REDIS_REST_URL="https://your-dev-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_dev_token"
```

### 2. Create Staging Database  
1. Create another database: "greatest-gig-staging"
2. Copy URL and token to `.env.staging`:
```env
UPSTASH_REDIS_REST_URL="https://your-staging-database.upstash.io" 
UPSTASH_REDIS_REST_TOKEN="your_staging_token"
```

### 3. Production Database
Your current database remains in `.env.production` (for Vercel deployment).

## Environment Files

### `.env.development` (Local Development)
```env
NODE_ENV=development
# Your dev database credentials
KV_REST_API_URL="https://your-dev-db.upstash.io"
KV_REST_API_TOKEN="your_dev_token"
DEBUG=true
```

### `.env.production` (Vercel Production)
```env
NODE_ENV=production
# Your production database (current one)
UPSTASH_REDIS_REST_URL="https://sacred-collie-46585.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AbX5AAIjc..."
DEBUG=false
```

## Vercel Environment Variables

In your Vercel dashboard, set these environment variables:

### Production
- `NODE_ENV` = `production`
- `UPSTASH_REDIS_REST_URL` = `https://sacred-collie-46585.upstash.io`
- `UPSTASH_REDIS_REST_TOKEN` = `your_current_production_token`

### Preview (Staging)
- `NODE_ENV` = `staging`  
- `UPSTASH_REDIS_REST_URL` = `https://your-staging-db.upstash.io`
- `UPSTASH_REDIS_REST_TOKEN` = `your_staging_token`

## Data Migration

### Copy Production Data to Development
```bash
# TODO: Create migration script if needed
npm run migrate-prod-to-dev
```

## Commands

- `npm run dev` - Start development server (uses dev database)
- `npm run setup-dev` - Initialize development database
- `npm run build` - Build for production
- `npm run start` - Start production server

## Benefits

✅ **Safe Development**: Local changes won't affect live users  
✅ **Isolated Testing**: Test new features without risk  
✅ **Data Integrity**: Production data stays clean  
✅ **Easy Deployment**: Environment-specific configs  
✅ **Rollback Safety**: Can revert without data loss  

## Troubleshooting

### "Redis connection failed"
Check your environment file has correct database credentials.

### "Data not showing up"
Verify you're connected to the right environment and database.

### "Key prefix issues"  
Check `lib/config.js` for correct key prefix logic.

## Security Notes

- Never commit `.env.local` to git
- Use separate API keys for each environment
- Regularly rotate database tokens
- Monitor database access logs