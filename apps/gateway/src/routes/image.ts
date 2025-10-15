import { Hono } from 'hono';
import { chargeFor } from '../lib/pricing';
import { consumeCredits, logUsage } from '../lib/metering';
import { requireApiKey } from '../lib/auth';
import { openaiImage } from '../lib/providers/openai';
import { geminiImage } from '../lib/providers/gemini';

export const image = new Hono();

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function normalizeResponseFormat(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

image.post('/v1/image', async (c) => {
  const apiKey = requireApiKey(c);
  const body = await c.req.json();
  const providerRaw = typeof body.provider === 'string' ? body.provider : '';
  const provider = providerRaw.trim().toLowerCase();
  const modelFromBody = typeof body.model === 'string' ? body.model.trim() : '';
  const isGeminiModel = modelFromBody.toLowerCase().startsWith('gemini');
  const resolvedProvider = provider === 'gemini' || (!provider && isGeminiModel) ? 'gemini' : (provider || 'openai');
  const model = modelFromBody || (resolvedProvider === 'gemini' ? 'gemini-2.5-flash-image' : 'dall-e-3');
  const forwardBody = { ...body, model };
  delete (forwardBody as any).provider;
  const nInput = Number(body.n);
  const n = Number.isFinite(nInput) && nInput > 0 ? nInput : 1;
  const responseFormat = normalizeResponseFormat(body.response_format);
  // Rough estimate per image; adjust per provider/model as needed
  const estUsd = n * (resolvedProvider === 'gemini' ? 0.02 : 0.04);
  const charge = chargeFor('image', estUsd, c.env);
  await consumeCredits(c.env as any, apiKey, charge);

  try {
    let res: Response;
    if (resolvedProvider === 'gemini') {
      const key = (c.env as any).GOOGLE_API_KEY;
      if (!key) throw new Error('Missing GOOGLE_API_KEY');
      const { response_format: _omit, ...geminiBody } = forwardBody;
      const result = await geminiImage(key, model, geminiBody);
      const kv = (c.env as any).KV;
      const wantsUrl = responseFormat === 'url' || (!responseFormat && kv);
      const wantsBinary = responseFormat === 'binary';
      if (wantsUrl) {
        if (!kv) throw new Error('KV binding required for response_format=url');
        const origin = new URL(c.req.url).origin;
        const data = await Promise.all(result.images.map(async (img, idx) => {
          const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
          const keyName = `gemini:image:${id}`;
          await kv.put(keyName, img.b64_json, {
            expirationTtl: 3600,
            metadata: { mimeType: img.mimeType }
          });
          return {
            index: idx,
            url: `${origin}/v1/image/gemini/${id}`,
            mimeType: img.mimeType,
            finish_reason: img.finishReason || null
          };
        }));
        res = new Response(JSON.stringify({ created: result.created, data }), { headers: { 'Content-Type': 'application/json' } });
      } else if (wantsBinary) {
        const first = result.images[0];
        if (!first) throw new Error('Gemini response missing image data');
        const bytes = base64ToUint8Array(first.b64_json);
        res = new Response(bytes, { headers: { 'Content-Type': first.mimeType, 'Content-Disposition': 'inline' } });
      } else {
        const data = result.images.map((img, idx) => ({
          index: idx,
          b64_json: img.b64_json,
          mimeType: img.mimeType,
          finish_reason: img.finishReason || null
        }));
        res = new Response(JSON.stringify({ created: result.created, data }), { headers: { 'Content-Type': 'application/json' } });
      }
    } else {
      const key = (c.env as any).OPENAI_API_KEY;
      if (!key) throw new Error('Missing OPENAI_API_KEY');
      res = await openaiImage(key, forwardBody);
    }

    c.executionCtx?.waitUntil(logUsage(c.env as any, apiKey, 'image', { provider: resolvedProvider, model, n, charge }));
    return res;
  } catch (err: any) {
    console.error('image route error', { provider: resolvedProvider, model, err: String(err) });
    try { await consumeCredits(c.env as any, apiKey, -charge); } catch {}
    return c.json({ error: 'Upstream error', detail: String(err) }, 502);
  }
});

image.get('/v1/image/gemini/:id', async (c) => {
  const kv = (c.env as any).KV;
  if (!kv) return c.json({ error: 'KV not configured' }, 500);
  const id = c.req.param('id');
  if (!id) return c.notFound();
  const keyName = `gemini:image:${id}`;
  const stored = await kv.getWithMetadata<string, { mimeType?: string }>(keyName);
  if (!stored?.value) return c.notFound();
  const bytes = base64ToUint8Array(stored.value);
  const mimeType = stored.metadata?.mimeType || 'image/png';
  return new Response(bytes, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600',
      'Content-Disposition': 'inline'
    }
  });
});
