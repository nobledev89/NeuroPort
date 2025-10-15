# AI API Broker – Monorepo Scaffold

A production-ready scaffold for a **passive, usage‑metered AI API reseller**. 

- **Gateway**: Cloudflare Workers (Hono) – fast, cheap, globally distributed
- **Billing**: Stripe credits (prepaid) + optional USDC via webhooks (stub)
- **Metering**: Upstash Redis (per‑user credits, rate limits, usage logs)
- **Routing**: Multi‑provider (OpenAI, Anthropic, Google Gemini, ElevenLabs, Suno)
- **Docs Site**: Next.js – simple landing + API reference (RapidAPI‑friendly)
- **Automation**: GitHub Actions deploy, error alerts, cron cleanup

> Drop this repo into **VS Code + Cline**, fill in `.env`, then `npm i && npm run deploy:gateway && npm run dev:site`.

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Secrets

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Then set your secrets in the Cloudflare Workers dashboard:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY` (for Gemini)
- `ELEVENLABS_API_KEY`
- `SUNO_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RAPIDAPI_SECRET`
- `STRIPE_SECRET_KEY` (optional)
- `STRIPE_WEBHOOK_SECRET` (optional)

### 3. Create KV and D1 Resources

```bash
cd apps/gateway
npx wrangler kv:namespace create KV
npx wrangler d1 create broker_d1
```

Update the IDs in `wrangler.toml` with the created resources.

### 4. Deploy Gateway

```bash
npm run deploy:gateway
```

### 5. Run Docs Site Locally

```bash
npm run dev:site
```

Visit http://localhost:3000 to see the landing page.

---

## Project Structure

```
ai-api-broker/
├─ apps/
│  ├─ gateway/                 # Cloudflare Worker (Hono)
│  │  ├─ src/
│  │  │  ├─ index.ts
│  │  │  ├─ routes/            # API routes
│  │  │  └─ lib/               # Core libraries & providers
│  │  ├─ wrangler.toml
│  │  └─ package.json
│  └─ site/                    # Next.js docs/landing
│     ├─ app/
│     │  ├─ page.tsx
│     │  └─ api-docs/page.tsx
│     └─ package.json
├─ packages/
│  └─ shared/                  # Shared types and utilities
│     └─ src/
│        ├─ types.ts
│        └─ errors.ts
├─ .github/workflows/          # CI/CD
├─ package.json                # Workspaces
└─ README.md
```

---

## API Endpoints

### Authentication
All endpoints require an API key passed via:
- `Authorization: Bearer <api_key>` header, or
- `X-API-Key: <api_key>` header

### Available Routes

- **GET /v1/balance** – Check credit balance
- **POST /v1/chat** – Multi-provider chat completions (OpenAI, Anthropic, Gemini)
- **POST /v1/tts** – Text-to-speech (ElevenLabs)
- **POST /v1/image** – Image generation (OpenAI)
- **POST /v1/music** – Music generation (Suno)

See the [Gateway README](apps/gateway/README.md) for detailed usage.

---

## Credits & Billing

- Credits are stored in Upstash Redis per API key
- Charges are calculated based on provider costs + configurable markup
- Default: $0.01 per credit, 1.8x margin multiplier
- Integrate Stripe webhooks to automatically add credits on purchase

### Provisioning Credits

Manually via Upstash Redis REST API:
```bash
curl -X POST https://your-redis-url/incrby/user:API_KEY:credits/1000 \
  -H "Authorization: Bearer YOUR_REDIS_TOKEN"
```

Or set up Stripe webhook integration (see gateway code).

---

## Deployment

### Automatic via GitHub Actions

Push to `main` branch with changes in `apps/gateway/**` to trigger automatic deployment.

Required secrets in GitHub:
- `CF_API_TOKEN`
- `CF_ACCOUNT_ID`

### Manual Deployment

```bash
npm run deploy:gateway
```

---

## Hardening Checklist (Post-MVP)

- [ ] **Token metering**: Switch to provider usage reports for exact token/second charges
- [ ] **Rate limits**: Implement KV-based per-minute & per-day limits
- [ ] **Abuse filters**: Add content policy checks per route
- [ ] **Observability**: Integrate Sentry, uptime monitoring, error alerts
- [ ] **RapidAPI listing**: Add marketplace listing with logo and examples
- [ ] **Self-serve keys**: Implement /v1/register endpoint
- [ ] **USDC billing**: Add Coinbase Commerce webhook integration

---

## Development

### Running Gateway Locally

```bash
cd apps/gateway
npm run dev
```

Test with:
```bash
curl http://127.0.0.1:8787/v1/balance \
  -H "Authorization: Bearer TEST"
```

### Building

```bash
npm run build
```

---

## License

See [TERMS.md](TERMS.md) for usage terms and conditions.

---

## Support

For issues or questions, please open an issue on GitHub.
