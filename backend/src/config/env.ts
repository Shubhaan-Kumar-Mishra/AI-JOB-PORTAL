/**
 * Environment variable bindings for Cloudflare Workers and Hono context.
 */
export interface Bindings {
  MONGODB_URI?: string;
  JWT_SECRET?: string;
  ADZUNA_APP_ID?: string;
  ADZUNA_APP_KEY?: string;
  GEMINI_API_KEY?: string;
  RESEND_API_KEY?: string;
}

/**
 * Helper to safely extract an environment variable from Hono bindings or process.env fallback.
 */
export function getEnvVar(cEnv: Bindings, key: keyof Bindings): string {
  const val = cEnv[key] || (typeof process !== 'undefined' ? process.env[key] : undefined);
  if (!val) {
    return '';
  }
  return val;
}
