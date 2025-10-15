import { Hono } from 'hono';
import { chargeFor } from '../lib/pricing';
import { consumeCredits, logUsage } from '../lib/metering';
import { requireApiKey } from '../lib/auth';
import { openaiImage } from '../lib/providers/openai';
import { geminiImage } from '../lib/providers/gemini';

export const image = new Hono();

image.post('/v1/image', async (c) => {
  const apiKey = requireApiKey(c);
  const body = await c.req.json();
  const provider = (body.provider || 'openai').toLowerCase();
  const model = body.model || (provider === 'gemini' ? 'gemini-2.5-flash-image' : 'dall-e-3');
  const forwardBody = { ...body };
  delete (forwardBody as any).provider;
  const n = body.n || 1;
  // Rough estimate per image; adjust per provider/model as needed
  const estUsd = n * (provider === 'gemini' ? 0.02 : 0.04);
  const charge = chargeFor('image', estUsd, c.env);
  await consumeCredits(c.env as any, apiKey, charge);

  try {
    let res: Response;
    if (provider === 'gemini') {
      const key = (c.env as any).GOOGLE_API_KEY;
      if (!key) throw new Error('Missing GOOGLE_API_KEY');
      res = await geminiImage(key, model, forwardBody);
    } else {
      const key = (c.env as any).OPENAI_API_KEY;
      if (!key) throw new Error('Missing OPENAI_API_KEY');
      res = await openaiImage(key, forwardBody);
    }

    c.executionCtx?.waitUntil(logUsage(c.env as any, apiKey, 'image', { provider, model, n, charge }));
    return res;
  } catch (err: any) {
    console.error('image route error', { provider, model, err: String(err) });
    try { await consumeCredits(c.env as any, apiKey, -charge); } catch {}
    return c.json({ error: 'Upstream error', detail: String(err) }, 502);
  }
});
