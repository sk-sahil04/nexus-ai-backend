export const RATE_LIMIT = {
  WINDOW_MS: 60000,
  MAX_REQUESTS: 100,
  AUTH_MAX: 10,
  CHAT_MAX: 30,
}

export function getJWTConfig() {
  return {
    SECRET: process.env.JWT_SECRET || 'nexus-ai-fallback-secret-key-2024',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  }
}

export function getAIConfig() {
  return {
    PROVIDER: process.env.AI_PROVIDER || 'groq',
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    DEMO_MODE: process.env.DEMO_MODE === 'true',
  }
}

export function getServerConfig() {
  return {
    PORT: parseInt(process.env.PORT || '5001'),
    NODE_ENV: process.env.NODE_ENV || 'development',
  }
}
