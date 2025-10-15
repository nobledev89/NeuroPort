# RapidAPI Deployment Guide

Publish your Cloudflare Worker–hosted AI API Broker on RapidAPI in minutes.

## Prerequisites
- Deployed Worker URL: `https://ai-api-broker-gateway.<subdomain>.workers.dev`
- Worker secrets set: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` (and optional Upstash credentials)
- RapidAPI Provider account: https://provider.rapidapi.com/

## 1) Prepare the Worker for RapidAPI
Auth already supports RapidAPI:
- Validates `X-RapidAPI-Proxy-Secret` when present
- Accepts user keys via `X-RapidAPI-Key`, `Authorization: Bearer <key>`, `X-API-Key`, or `?api_key=`

Set the proxy secret on the Worker so only RapidAPI can include it:
```
cd apps/gateway
npx wrangler secret put RAPIDAPI_SECRET
# paste the secret from RapidAPI (Settings → Security → Proxy Secret)
```

## 2) Create the API on RapidAPI
1. Provider dashboard → Add New API
2. Basics:
   - Name: AI API Broker (or your brand)
   - Category: AI/Machine Learning
   - Base URL: your Worker URL

## 3) Configure Authentication
Settings → Security
- Type: API Key (Header)
- Header Name: `X-RapidAPI-Key`
Our gateway uses this header directly as the per‑user API key.

## 4) Define Endpoints
Use your Worker Base URL. Add these endpoints with the shapes below.

Balance
- Method: GET
- Path: `/v1/balance`
- Auth: required
- Sample response: `{ "credits": 10000 }`

Chat
- Method: POST
- Path: `/v1/chat`
- Auth: required
- Body (JSON):
  - `provider` (string, enum: `openai|anthropic|gemini`, default `openai`)
  - `model` (string, required)
  - `messages` (array of { role, content }) or `contents` (Gemini shape)
- Sample:
```
{ "provider":"openai", "model":"gpt-4o-mini", "messages":[{"role":"user","content":"Hello"}] }
```

Image
- Method: POST
- Path: `/v1/image`
- Auth: required
- Body (JSON):
  - `provider` (string, optional: `openai` default, or `gemini`)
  - `model` (string): `dall-e-3` (OpenAI) or `gemini-2.5-flash-image` (Gemini)
  - `prompt` (string, required)
  - `n` (integer, OpenAI only)
  - `response_format` (OpenAI only: `url` or `b64_json`)
- Samples:
```
{ "model":"dall-e-3", "prompt":"a tiny red square on white", "n":1, "response_format":"url" }
{ "provider":"gemini", "model":"gemini-2.5-flash-image", "prompt":"a tiny red square on white" }
```

TTS
- Method: POST
- Path: `/v1/tts`
- Body: `{ "text":"Hello world", "voiceId":"<optional>", "estimateSeconds":10 }`

Music
- Method: POST
- Path: `/v1/music`
- Body: `{ "prompt":"Upbeat EDM", "duration":30 }`

Notes
- OpenAI images return URLs when `response_format:"url"`.
- Gemini images return inline base64 image data (PNG) in `candidates[].content.parts[].inlineData`.

## 5) Pricing and Plans
Example tiers:
- Basic: Free, 100 credits/month
- Pro: $10/month, 10,000 credits
- Ultra: $40/month, 50,000 credits
- Mega: $150/month, 200,000 credits

Credits are metered by your Worker (see `pricing.ts` and `metering.ts`). Use `X-RapidAPI-Key` as the user’s key to credit/debit.

## 6) Test from RapidAPI Console
1. Set your test key value (console field)
2. Call `/v1/balance` → should return credits for that key
3. Call `/v1/chat` → should return a completion
4. Call `/v1/image` → OpenAI returns a URL; Gemini returns inline image data

If you enabled `RAPIDAPI_SECRET`, RapidAPI will include `X-RapidAPI-Proxy-Secret`; direct calls won’t.

## 7) Optional: Webhooks for Provisioning
Add a webhook handler to credit users on subscription events. Validate with `RAPIDAPI_WEBHOOK_SECRET`, then call `addCredits(...)` for the user ID.

## 8) Publish
Add clear descriptions and code samples, set pricing, and submit for review. After approval, your API goes live on RapidAPI.

## Troubleshooting
- 401 Unauthorized: Include `X-RapidAPI-Key` or `Authorization: Bearer ...`
- 403 via proxy: Check `RAPIDAPI_SECRET` on the Worker and in RapidAPI settings
- Gemini 404: Use `gemini-2.5-flash` (chat) or `gemini-2.5-flash-image` (image); availability depends on your key’s model catalog
- OpenAI image “invalid model”: Ensure you set `provider:"gemini"` when using Gemini models

