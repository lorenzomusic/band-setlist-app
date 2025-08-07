// Environment configuration utility
export const config = {
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isStaging: process.env.NODE_ENV === 'staging',

  // Database configuration with environment awareness
  redis: {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  },

  // App settings
  debug: process.env.DEBUG === 'true',
  
  // Database key prefixes to separate data by environment
  keyPrefix: process.env.NODE_ENV === 'production' 
    ? 'prod:' 
    : process.env.NODE_ENV === 'staging' 
      ? 'staging:' 
      : 'dev:',

  // Environment-specific settings
  maxSongsPerSet: process.env.NODE_ENV === 'development' ? 50 : 100,
  sessionTimeout: process.env.NODE_ENV === 'development' ? '1h' : '24h',
};

// Utility functions
export const getEnvInfo = () => ({
  environment: process.env.NODE_ENV || 'development',
  database: config.redis.url?.includes('upstash') ? 'Upstash Redis' : 'Local Redis',
  keyPrefix: config.keyPrefix,
  debug: config.debug,
});

// Database key helpers to avoid conflicts
export const createKey = (key) => `${config.keyPrefix}${key}`;

// Validation
export const validateConfig = () => {
  const errors = [];
  
  if (!config.redis.url) {
    errors.push('Redis URL not configured');
  }
  
  if (!config.redis.token) {
    errors.push('Redis token not configured');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }
  
  return true;
};