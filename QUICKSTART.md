# 🚀 Quick Start Guide

## Your API keys have been prepared!

I've created setup scripts with your provider API keys. Follow these steps to deploy:

## Step 1: Set up Upstash Redis (5 minutes)

You need a Redis database for credit management. 

1. Go to https://console.upstash.com/
2. Create a free account (if you don't have one)
3. Click "Create Database"
4. Choose a name (e.g., "ai-broker-credits")
5. Select a region close to your users
6. Click "Create"
7. Copy the **REST URL** and **REST TOKEN** from the database details page

## Step 2: Run the Setup Script (2 minutes)

Open a terminal in the `apps/gateway` directory:

```bash
cd apps/gateway

# On Windows (double-click or run in cmd)
setup-secrets.bat

# On Mac/Linux
chmod +x setup-secrets.sh
./setup-secrets.sh
```

This will set your OpenAI, Anthropic, and Google API keys.

## Step 3: Set Upstash Redis Credentials (1 minute)

After the script finishes, run these commands and paste your Upstash credentials:

```bash
npx wrangler secret put UPSTASH_REDIS_REST_URL
# Paste your REST URL (e.g., https://your-db-12345.upstash.io)

npx wrangler secret put UPSTASH_REDIS_REST_TOKEN
# Paste your REST TOKEN
```

## Step 4: Initialize Test API Key (2 minutes)

In the Upstash console:
1. Go to your database
2. Click the "Data Browser" tab
3. Click "Add New Key"
4. Key: `user:test-key-123:credits`
5. Value: `10000`
6. Click "Save"

## Step 5: Build and Deploy (2 minutes)

```bash
# Still in apps/gateway directory
npm run build
npm run deploy
```

You'll see output like:
```
Published ai-api-broker-gateway
  https://ai-api-broker-gateway.YOUR_SUBDOMAIN.workers.dev
```

**Copy this URL!**

## Step 6: Test It! (1 minute)

```bash
# Replace with your actual worker URL
set WORKER_URL=https://ai-api-broker-gateway.YOUR_SUBDOMAIN.workers.dev

# Test balance
curl -H "Authorization: Bearer test-key-123" "%WORKER_URL%/v1/balance"

# Should return: {"credits":10000}

# Test chat
curl -X POST "%WORKER_URL%/v1/chat" -H "Authorization: Bearer test-key-123" -H "Content-Type: application/json" -d "{\"provider\":\"openai\",\"model\":\"gpt-4o-mini\",\"messages\":[{\"role\":\"user\",\"content\":\"Say hi\"}]}"

# Check balance again (should be reduced by ~1 credit)
curl -H "Authorization: Bearer test-key-123" "%WORKER_URL%/v1/balance"
```

## 🎉 You're Live!

Your API broker is now running and accepting requests!

### Next Steps:

1. **Generate User API Keys**: Create more keys in Redis with format `user:<apiKey>:credits`
2. **Set Up Billing**: Configure Stripe webhook (see PRODUCTION_SETUP.md)
3. **Monitor Usage**: Use `npx wrangler tail` to see live logs
4. **Deploy Docs Site**: Update `NEXT_PUBLIC_GATEWAY_URL` in apps/site and deploy

### Testing All Providers:

**OpenAI:**
```bash
curl -X POST "%WORKER_URL%/v1/chat" -H "Authorization: Bearer test-key-123" -H "Content-Type: application/json" -d "{\"provider\":\"openai\",\"model\":\"gpt-4o-mini\",\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}]}"
```

**Anthropic:**
```bash
curl -X POST "%WORKER_URL%/v1/chat" -H "Authorization: Bearer test-key-123" -H "Content-Type: application/json" -d "{\"provider\":\"anthropic\",\"model\":\"claude-3-haiku-20240307\",\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}]}"
```

**Gemini:**
```bash
curl -X POST "%WORKER_URL%/v1/chat" -H "Authorization: Bearer test-key-123" -H "Content-Type: application/json" -d "{\"provider\":\"gemini\",\"model\":\"gemini-1.5-flash\",\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}]}"
```

**Image Generation:**
```bash
curl -X POST "%WORKER_URL%/v1/image" -H "Authorization: Bearer test-key-123" -H "Content-Type: application/json" -d "{\"model\":\"dall-e-3\",\"prompt\":\"a friendly robot\",\"n\":1}"
```

### Troubleshooting:

**"Missing API key" error:**
- Make sure you include the Authorization header
- Check that the API key exists in Redis

**"INSUFFICIENT_CREDITS" error:**
- Check your balance: `curl -H "Authorization: Bearer test-key-123" "%WORKER_URL%/v1/balance"`
- Add more credits in Upstash console

**Provider errors:**
- Check that all secrets are set: `npx wrangler secret list`
- Verify your provider API keys are valid
- View logs: `npx wrangler tail`

### Need Help?

- Full documentation: See `PRODUCTION_SETUP.md`
- View logs: `npx wrangler tail`
- Check secrets: `npx wrangler secret list`

---

**Total Setup Time: ~15 minutes** ⏱️

Happy building! 🚀
