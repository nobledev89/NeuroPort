import { Hono } from 'hono';
import { getCredits } from '../lib/metering';
import { requireApiKey } from '../lib/auth';

export const balance = new Hono();

balance.get('/v1/balance', async (c) => {
  const apiKey = requireApiKey(c);
  const credits = await getCredits(c.env as any, apiKey);
  return c.json({ credits });
});
