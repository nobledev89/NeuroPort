# Gateway – Quickstart

1. **Secrets** (Wrangler Dashboard → Variables):
   - OPENAI_API_KEY
   - ANTHROPIC_API_KEY
   - GOOGLE_API_KEY (Gemini)
   - (Audio providers optional — hidden for now)
   - UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
   - RAPIDAPI_SECRET (for marketplace proxy)
   - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (if using billing webhook)

2. **Dev**
```bash
npm i
npm run preview:gateway
# then curl http://127.0.0.1:8787/v1/balance -H "Authorization: Bearer TEST"
```

3. **Provision credits for a user**
```bash
# Use Redis REST or Stripe webhook (see server below)
```

4. **Deploy**
```bash
npm run deploy:gateway
```

5. **RapidAPI**
- Set **X-RapidAPI-Proxy-Secret** to `RAPIDAPI_SECRET`.
- Pass user API key in `Authorization: Bearer <user_api_key>`.
  
Audio endpoints (TTS/Music) are currently disabled until provider access is finalized.
