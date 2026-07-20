require('dotenv').config();

const requiredEnvVars = [
  'OPENAI_API_KEY',
  'DATABASE_URL',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', '==================================================');
  console.error('\x1b[31m%s\x1b[0m', 'CRITICAL STARTUP ERROR: Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error('\x1b[31m%s\x1b[0m', ` - ${envVar}`);
  });
  console.error('\x1b[31m%s\x1b[0m', 'Please verify your .env configuration. Stopping server.');
  console.error('\x1b[31m%s\x1b[0m', '==================================================');
  process.exit(1);
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_API_BASE: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'openrouter',
};
