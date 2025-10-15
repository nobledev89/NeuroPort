import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { chat } from './routes/chat';
import { image } from './routes/image';
import { balance } from './routes/balance';
import { tts } from './routes/tts';
import { music } from './routes/music';
import { webhooks } from './routes/webhooks';

const app = new Hono<{ Bindings: any }>();

// CORS for marketplaces/browsers
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-RapidAPI-Proxy-Secret'],
  exposeHeaders: ['Content-Type'],
  maxAge: 86400
}));

app.route('/', balance);
app.route('/', chat);
app.route('/', image);
app.route('/', tts);
app.route('/', music);
app.route('/', webhooks);

app.get('/', (c) => c.json({ ok: true, service: 'ai-api-broker' }));
// Minimal OpenAPI descriptor for marketplaces
app.get('/openapi.json', (c) => c.json({
  openapi: '3.0.0',
  info: { title: 'AI API Broker', version: '1.0.0' },
  servers: [{ url: 'https://' + c.req.url.split('/').slice(2,3)[0] }],
  paths: {
    '/v1/balance': {
      get: {
        summary: 'Get remaining credits',
        security: [{ ApiKeyAuth: [] }],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { credits: { type: 'integer' } } } } } } }
      }
    },
    '/v1/chat': {
      post: {
        summary: 'Chat completion (OpenAI/Anthropic/Gemini)',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { provider: { type: 'string', enum: ['openai','anthropic','gemini'] }, model: { type: 'string' }, messages: { type: 'array' }, contents: { type: 'array' } }, required: ['model'] } } }
        },
        responses: { '200': { description: 'Upstream response' } }
      }
    },
    '/v1/image': {
      post: {
        summary: 'Image generation (OpenAI)',
        security: [{ ApiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { model: { type: 'string' }, prompt: { type: 'string' }, n: { type: 'integer' } }, required: ['model','prompt'] } } } },
        responses: { '200': { description: 'Upstream response' } }
      }
    },
    '/v1/tts': {
      post: {
        summary: 'Text-to-speech (ElevenLabs)',
        security: [{ ApiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { text: { type: 'string' }, voiceId: { type: 'string' }, estimateSeconds: { type: 'number' } }, required: ['text'] } } } },
        responses: { '200': { description: 'Audio stream or JSON' } }
      }
    },
    '/v1/music': {
      post: {
        summary: 'Music generation (Stability)',
        security: [{ ApiKeyAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } },
        responses: { '200': { description: 'Audio or JSON' } }
      }
    }
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'Authorization', description: 'Bearer <user_api_key>' }
    }
  }
}));

export default app;
