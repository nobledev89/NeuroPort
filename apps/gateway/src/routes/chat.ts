import { Hono } from 'hono';
import { chargeFor } from '../lib/pricing';
import { consumeCredits, logUsage } from '../lib/metering';
import { requireApiKey } from '../lib/auth';
import { openaiChat } from '../lib/providers/openai';
import { anthropicChat } from '../lib/providers/anthropic';
import { geminiChat } from '../lib/providers/gemini';

export const chat = new Hono();

chat.post('/v1/chat', async (c) => {
  const apiKey = requireApiKey(c);
  const body = await c.req.json();
  const provider = (body.provider || 'openai').toLowerCase();
  const model = body.model || 'gpt-4o-mini';
  const forwardBody = { ...body };
  delete (forwardBody as any).provider;

  // Build a Gemini-compatible body if needed
  function toGeminiBody(src: any) {
    if (src?.contents) return src; // already Gemini shape
    const messages = src?.messages as Array<{ role: string; content: any }> | undefined;
    if (!messages || !Array.isArray(messages)) return src;
    const contents = messages.map((m) => {
      const role = m.role === 'assistant' ? 'model' : (m.role || 'user');
      const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return { role, parts: [{ text }] };
    });
    const { messages: _omit, provider: _p, model: _m, ...rest } = src;
    return { ...rest, contents };
  }

  // Estimate rough cost → credits to charge (you can refine per token count)
  const estUsd = 0.002; // safe minimum charge per request
  const charge = chargeFor('chat', estUsd, c.env);
  await consumeCredits(c.env as any, apiKey, charge);

  let res: Response;
  try {
    switch (provider) {
      case 'openai':
        res = await openaiChat(c.env.OPENAI_API_KEY, forwardBody);
        break;
      case 'anthropic':
        res = await anthropicChat(c.env.ANTHROPIC_API_KEY, forwardBody);
        break;
      case 'gemini': {
        const gemBody = toGeminiBody(forwardBody);
        // Default to a valid Gemini model name if caller sent an OpenAI default
        const gemModel = model && model.startsWith('gpt-') ? 'gemini-1.5-flash' : model;
        res = await geminiChat(c.env.GOOGLE_API_KEY, gemModel, gemBody);
        break;
      }
      default: return c.json({ error: 'Unsupported provider' }, 400);
    }
  } catch (err: any) {
    console.error('chat route error', { provider, model, err: String(err) });
    // refund on failure
    try { await consumeCredits(c.env as any, apiKey, -charge); } catch {}
    return c.json({ error: 'Upstream error', detail: String(err) }, 502);
  }

  await logUsage(c.env as any, apiKey, 'chat', { provider, model, charge });
  return res;
});
