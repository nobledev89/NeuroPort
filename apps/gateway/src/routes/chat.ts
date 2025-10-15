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

  function normalizeGeminiModel(name: string) {
    if (!name) return 'gemini-1.5-flash-latest';
    // Map OpenAI-style defaults to a safe Gemini default
    if (name.startsWith('gpt-')) return 'gemini-1.5-flash-latest';
    // Ensure -latest suffix if not versioned (e.g., 001) or -latest
    const hasVersion = /-(\d+)$/.test(name) || /-latest$/.test(name);
    if (!hasVersion && name.startsWith('gemini-')) return `${name}-latest`;
    return name;
  }

  // Estimate rough cost → credits to charge (you can refine per token count)
  const estUsd = 0.002; // safe minimum charge per request
  const charge = chargeFor('chat', estUsd, c.env);
  await consumeCredits(c.env as any, apiKey, charge);

  // Demo fallback if provider keys are missing or DEMO_MODE is set
  const demoMode = String((c.env as any).DEMO_MODE || '').toLowerCase() === 'true';

  function demoResponse(text: string) {
    return new Response(JSON.stringify({
      id: 'demo',
      object: 'chat.completion',
      choices: [{ index: 0, message: { role: 'assistant', content: text } }]
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  let res: Response;
  try {
    switch (provider) {
      case 'openai': {
        const key = (c.env as any).OPENAI_API_KEY;
        if (!key || demoMode) {
          res = demoResponse('hi');
        } else {
          res = await openaiChat(key, forwardBody);
        }
        break;
      }
      case 'anthropic': {
        // Anthropic requires max_tokens
        const anthropicBody = {
          ...forwardBody,
          max_tokens: forwardBody.max_tokens || 1024
        };
        const key = (c.env as any).ANTHROPIC_API_KEY;
        if (!key || demoMode) {
          res = demoResponse('hello');
        } else {
          res = await anthropicChat(key, anthropicBody);
        }
        break;
      }
      case 'gemini': {
        const gemBody = toGeminiBody(forwardBody);
        // Default to a valid Gemini model name if caller sent an OpenAI default
        const gemModel = normalizeGeminiModel(model);
        const key = (c.env as any).GOOGLE_API_KEY;
        if (!key || demoMode) {
          res = demoResponse('greetings');
        } else {
          res = await geminiChat(key, gemModel, gemBody);
        }
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

  c.executionCtx?.waitUntil(logUsage(c.env as any, apiKey, 'chat', { provider, model, charge }));
  return res;
});
