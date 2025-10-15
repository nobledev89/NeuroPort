import { Hono } from 'hono';
import { chargeFor } from '../lib/pricing';
import { consumeCredits, logUsage } from '../lib/metering';
import { requireApiKey } from '../lib/auth';
import { openaiImage } from '../lib/providers/openai';

export const image = new Hono();

image.post('/v1/image', async (c) => {
  const apiKey = requireApiKey(c);
  const body = await c.req.json();
  const forwardBody = { ...body };
  delete (forwardBody as any).provider;
  const n = body.n || 1;
  const estUsd = n * 0.04;
  const charge = chargeFor('image', estUsd, c.env);
  await consumeCredits(c.env as any, apiKey, charge);
  let res: Response;
  try {
    res = await openaiImage(c.env.OPENAI_API_KEY, forwardBody);
  } catch (err: any) {
    console.error('image route error', { err: String(err) });
    try { await consumeCredits(c.env as any, apiKey, -charge); } catch {}
    return c.json({ error: 'Upstream error', detail: String(err) }, 502);
  }
  await logUsage(c.env as any, apiKey, 'image', { n, charge });
  return res;
});
