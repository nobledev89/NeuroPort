import { Hono } from 'hono';
import { chargeFor } from '../lib/pricing';
import { consumeCredits, logUsage } from '../lib/metering';
import { requireApiKey } from '../lib/auth';
import { stabilityMusic } from '../lib/providers/stability';

export const music = new Hono();

music.post('/v1/music', async (c) => {
  const apiKey = requireApiKey(c);
  const body = await c.req.json();
  const estUsd = 0.05 * (body?.clips || 1);
  const charge = chargeFor('music', estUsd, c.env);
  await consumeCredits(c.env as any, apiKey, charge);
  let res: Response;
  try {
    res = await stabilityMusic(c.env.STABILITY_API_KEY, body);
  } catch (err: any) {
    console.error('music route error', { err: String(err) });
    try { await consumeCredits(c.env as any, apiKey, -charge); } catch {}
    return c.json({ error: 'Upstream error', detail: String(err) }, 502);
  }
  await logUsage(c.env as any, apiKey, 'music', { provider: 'stability', clips: body?.clips || 1, charge });
  return res;
});
