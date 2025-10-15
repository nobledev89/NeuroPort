import { Context } from 'hono';

export function getApiKey(c: Context) {
  // Priority: RapidAPI -> Authorization -> X-API-Key
  const rapidSecret = c.req.header('X-RapidAPI-Proxy-Secret');
  if (rapidSecret && rapidSecret !== c.env.RAPIDAPI_SECRET) {
    return null; // invalid RapidAPI proxy secret
  }
  const key = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '')
    || c.req.header('X-RapidAPI-Key')
    || c.req.header('X-API-Key')
    || c.req.query('api_key');
  return key || null;
}

export function requireApiKey(c: Context) {
  const k = getApiKey(c);
  if (!k) c.throw(401, 'Missing API key');
  return k!;
}
