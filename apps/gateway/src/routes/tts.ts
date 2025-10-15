import { Hono } from 'hono';
import { chargeFor } from '../lib/pricing';
import { consumeCredits, logUsage } from '../lib/metering';
import { requireApiKey } from '../lib/auth';
import { elevenlabsTTS } from '../lib/providers/elevenlabs';

export const tts = new Hono();

tts.post('/v1/tts', async (c) => {
  const apiKey = requireApiKey(c);
  const body = await c.req.json();
  const voiceId = body.voiceId || '21m00Tcm4TlvDq8ikWAM';
  const estUsd = (body?.estimateSeconds || 10) * 0.0003; // 10s default
  const charge = chargeFor('tts', estUsd, c.env);
  await consumeCredits(c.env as any, apiKey, charge);
  let res: Response;
  try {
    res = await elevenlabsTTS(c.env.ELEVENLABS_API_KEY, voiceId, body);
  } catch (err: any) {
    console.error('tts route error', { voiceId, err: String(err) });
    try { await consumeCredits(c.env as any, apiKey, -charge); } catch {}
    return c.json({ error: 'Upstream error', detail: String(err) }, 502);
  }
  await logUsage(c.env as any, apiKey, 'tts', { voiceId, charge });
  return res;
});
