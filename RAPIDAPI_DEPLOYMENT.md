# 🚀 RapidAPI Deployment Guide

Your AI API Broker is already RapidAPI-ready! The authentication layer includes RapidAPI proxy secret verification.

## Prerequisites

Before listing on RapidAPI, you must:
1. ✅ Deploy to Cloudflare Workers (see QUICKSTART.md)
2. ✅ Test your endpoints work correctly
3. ✅ Have a RapidAPI Provider account

## Part 1: Deploy to Cloudflare Workers First

Follow the QUICKSTART.md guide to deploy your worker. You'll get a URL like:
```
https://ai-api-broker-gateway.YOUR_SUBDOMAIN.workers.dev
```

**Important:** RapidAPI will proxy requests to this URL, so it must be live and working first.

## Part 2: Create RapidAPI Provider Account

1. Go to https://rapidapi.com/
2. Click "Sign Up" → Choose "Provider" account
3. Complete provider registration
4. Go to https://provider.rapidapi.com/

## Part 3: Add Your API to RapidAPI

### 3.1 Create New API

1. Log into RapidAPI Provider Dashboard
2. Click "Add New API"
3. Fill in basic info:
   - **API Name:** AI API Broker (or your preferred name)
   - **API Description:** Multi-provider AI API with unified billing - Chat (OpenAI/Anthropic/Gemini), Image Generation (DALL-E), TTS, and Music
   - **Category:** AI/Machine Learning
   - **Base URL:** Your Cloudflare Worker URL
     ```
     https://ai-api-broker-gateway.YOUR_SUBDOMAIN.workers.dev
     ```

### 3.2 Configure Authentication

1. In API Settings → Security
2. Select **"API Key Header"**
3. Header Name: `X-RapidAPI-Key`
4. RapidAPI handles this automatically - users' keys are sent via `X-RapidAPI-Proxy-Secret`

### 3.3 Add Endpoints

For each endpoint, click "Add Endpoint":

#### Endpoint 1: Get Balance
- **Method:** GET
- **Path:** `/v1/balance`
- **Name:** Get Credit Balance
- **Description:** Check remaining credits for your API key
- **Sample Response:**
  ```json
  {"credits": 10000}
  ```

#### Endpoint 2: Chat Completion
- **Method:** POST
- **Path:** `/v1/chat`
- **Name:** Chat Completion
- **Description:** Generate text using OpenAI, Anthropic, or Gemini
- **Parameters:**
  - `provider` (string, required): openai, anthropic, or gemini
  - `model` (string, required): Model name (e.g., gpt-4o-mini, claude-3-haiku-20240307, gemini-1.5-flash)
  - `messages` (array, required): Chat messages array with role and content
- **Sample Request:**
  ```json
  {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}]
  }
  ```

#### Endpoint 3: Image Generation
- **Method:** POST
- **Path:** `/v1/image`
- **Name:** Generate Image
- **Description:** Create images using DALL-E
- **Parameters:**
  - `model` (string, required): dall-e-3 or dall-e-2
  - `prompt` (string, required): Image description
  - `n` (integer, optional): Number of images (default: 1)
- **Sample Request:**
  ```json
  {
    "model": "dall-e-3",
    "prompt": "A futuristic city at sunset",
    "n": 1
  }
  ```

#### Endpoint 4: Text-to-Speech
- **Method:** POST
- **Path:** `/v1/tts`
- **Name:** Text-to-Speech
- **Description:** Convert text to audio using ElevenLabs
- **Parameters:**
  - `text` (string, required): Text to convert
  - `voiceId` (string, optional): Voice ID
  - `estimateSeconds` (number, optional): Estimated duration
- **Sample Request:**
  ```json
  {
    "text": "Hello, world!",
    "estimateSeconds": 10
  }
  ```

#### Endpoint 5: Music Generation
- **Method:** POST
- **Path:** `/v1/music`
- **Name:** Generate Music
- **Description:** Create music using Stability AI
- **Parameters:**
  - `prompt` (string, required): Music description
  - `duration` (number, optional): Duration in seconds
- **Sample Request:**
  ```json
  {
    "prompt": "Upbeat electronic dance music",
    "duration": 30
  }
  ```

### 3.4 Configure Pricing

RapidAPI has 4 pricing tiers. Here's a suggested structure:

**Basic Plan (Free/Freemium):**
- 100 credits
- For testing

**Pro Plan:**
- 10,000 credits - $10/month
- Popular for regular users

**Ultra Plan:**
- 50,000 credits - $40/month
- For power users

**Mega Plan:**
- 200,000 credits - $150/month
- For businesses

**Note:** Users on RapidAPI won't manage credits directly - they subscribe to plans. You'll need to:
1. Track RapidAPI users separately
2. Allocate credits based on their plan
3. Reset credits monthly (RapidAPI handles billing)

## Part 4: Set RapidAPI Secret in Your Worker

RapidAPI sends a proxy secret header to verify requests are coming from their platform.

1. Get your RapidAPI proxy secret:
   - Go to RapidAPI Provider Dashboard
   - Click on your API
   - Go to Settings → Security
   - Copy the "Proxy Secret"

2. Set it in your Cloudflare Worker:
   ```bash
   cd apps/gateway
   npx wrangler secret put RAPIDAPI_SECRET
   # Paste your RapidAPI proxy secret when prompted
   ```

## Part 5: Test Your RapidAPI Integration

### 5.1 Test from RapidAPI Console

1. In RapidAPI Provider Dashboard, go to your API
2. Click "Test Endpoint"
3. Try the `/v1/balance` endpoint
4. Should return: `{"credits": <some_number>}`

### 5.2 Test Authentication Flow

Your `auth.ts` already handles RapidAPI authentication:
```typescript
const rapidSecret = c.req.header('X-RapidAPI-Proxy-Secret');
if (rapidSecret && rapidSecret !== c.env.RAPIDAPI_SECRET) {
  return null; // invalid RapidAPI proxy secret
}
```

This means:
- If `X-RapidAPI-Proxy-Secret` header is present, it MUST match your secret
- RapidAPI users' keys are mapped to your internal keys
- You control credit allocation

## Part 6: User Onboarding via RapidAPI

When users subscribe on RapidAPI:

1. **RapidAPI sends subscription webhook** (optional to implement)
2. **You need to provision credits** for their RapidAPI user ID

### Option A: Manual Provisioning (MVP)

When you see a new RapidAPI user in logs:
```bash
# Add credits for RapidAPI user
curl -X POST "https://your-worker.workers.dev/admin/add-credits" \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"rapidapi-user-12345","credits":10000}'
```

### Option B: Automatic Provisioning (Recommended)

Create a RapidAPI webhook handler in your worker:

```typescript
// In webhooks.ts, add:
webhooks.post('/webhooks/rapidapi', async (c) => {
  const secret = c.req.header('x-rapidapi-webhook-secret');
  if (secret !== c.env.RAPIDAPI_WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const event = await c.req.json();
  
  if (event.type === 'subscription.created') {
    const userId = event.data.user_id;
    const planId = event.data.plan_id;
    
    // Map plan to credits
    const creditsByPlan = {
      'basic': 100,
      'pro': 10000,
      'ultra': 50000,
      'mega': 200000
    };
    
    const credits = creditsByPlan[planId] || 100;
    await addCredits(c.env as any, `rapidapi-${userId}`, credits);
    
    return c.json({ success: true });
  }
  
  return c.json({ received: true });
});
```

## Part 7: Credit Management for RapidAPI Users

### Strategy 1: One API Key Per RapidAPI User

Store in Redis:
- Key: `user:rapidapi-{userId}:credits`
- Value: Credits based on their plan

When RapidAPI sends request:
1. Extract `X-RapidAPI-User` header (contains their user ID)
2. Look up `user:rapidapi-{userId}:credits`
3. Deduct credits
4. Return response

### Strategy 2: Monthly Reset

Since RapidAPI plans are monthly subscriptions:
1. Store current month: `user:rapidapi-{userId}:month`
2. If month changed, reset credits to plan amount
3. Deduct from current month's balance

## Part 8: Publish Your API

1. In RapidAPI Provider Dashboard
2. Click "Publish API"
3. Submit for review (usually takes 1-2 business days)
4. Once approved, your API is live on RapidAPI marketplace!

## Part 9: Monitor Usage

### View RapidAPI Analytics
- Go to Provider Dashboard
- Click "Analytics"
- See subscriber count, requests, revenue

### View Your Worker Logs
```bash
cd apps/gateway
npx wrangler tail
```

### Track Credits
Monitor Redis for credit consumption:
```bash
# In Upstash console, search for keys:
user:rapidapi-*:credits
```

## Pricing Strategy Recommendations

**Conservative (Safe for starting):**
- Basic: 100 credits = Free
- Pro: 1,000 credits = $5/month
- Ultra: 10,000 credits = $40/month
- Mega: 50,000 credits = $150/month

**Aggressive (Higher margins):**
- Basic: 500 credits = Free
- Pro: 5,000 credits = $10/month
- Ultra: 25,000 credits = $40/month
- Mega: 100,000 credits = $150/month

**Cost per Credit:** Your current setting is $0.01/credit with 1.8x markup.

**Typical Usage:**
- Chat request: ~1 credit
- Image generation: ~7 credits
- TTS (10 seconds): ~1 credit
- Music generation: ~9 credits

## Marketing Your API on RapidAPI

1. **Good Documentation:** Use the API description to explain multi-provider support
2. **Competitive Pricing:** Research similar APIs (OpenAI, Anthropic alternatives)
3. **Free Tier:** Always offer free tier to attract users
4. **Unique Selling Point:** "Access OpenAI, Anthropic, and Gemini with one API key"
5. **Use Cases:** Add tutorials and code examples
6. **Responsive Support:** Answer questions in API comments

## Troubleshooting

### Users Getting 401 Errors
- Verify RAPIDAPI_SECRET is set correctly
- Check logs: `npx wrangler tail`
- Test endpoint directly (should work)

### Credits Not Deducting
- Check Redis connection (UPSTASH secrets set?)
- View logs to see if consumeCredits is being called
- Verify user's API key exists in Redis

### Rate Limits
- RapidAPI enforces rate limits per plan
- You can add additional rate limiting in your worker
- Use Cloudflare rate limiting rules

## Next Steps

1. ✅ Deploy to Cloudflare Workers (QUICKSTART.md)
2. ✅ Test all endpoints work
3. ✅ Create RapidAPI Provider account
4. ✅ List your API on RapidAPI
5. ✅ Set RAPIDAPI_SECRET in worker
6. ✅ Test from RapidAPI console
7. ✅ Configure pricing tiers
8. ✅ Publish API for review
9. ✅ Monitor usage and optimize

---

**Your API is already RapidAPI-ready! Just follow this guide to list it. 🚀**

Need help? Check the logs with `npx wrangler tail` or refer to RapidAPI's provider documentation.
