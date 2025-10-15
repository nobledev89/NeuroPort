@echo off
echo ========================================
echo AI API Broker - Live API Test Suite
echo ========================================
echo.
if not defined GATEWAY_URL set GATEWAY_URL=https://ai-api-broker-gateway.dpnh1989.workers.dev
echo Worker URL: %GATEWAY_URL%
echo API Key: TEST
echo.

echo [1/6] Testing root endpoint...
curl.exe -s %GATEWAY_URL%/
echo.
echo.

echo [2/6] Testing balance endpoint...
curl.exe -s -H "Authorization: Bearer TEST" %GATEWAY_URL%/v1/balance
echo.
echo.

echo [3/6] Testing OpenAI chat...
curl.exe -s -X POST %GATEWAY_URL%/v1/chat -H "Authorization: Bearer TEST" -H "Content-Type: application/json" -d "{\"provider\":\"openai\",\"model\":\"gpt-4o-mini\",\"messages\":[{\"role\":\"user\",\"content\":\"Say just 'hi' in one word\"}]}"
echo.
echo.

echo [4/6] Checking balance after chat (should be reduced)...
curl.exe -s -H "Authorization: Bearer TEST" %GATEWAY_URL%/v1/balance
echo.
echo.

echo [5/6] Testing Anthropic chat...
curl.exe -s -X POST %GATEWAY_URL%/v1/chat -H "Authorization: Bearer TEST" -H "Content-Type: application/json" -d "{\"provider\":\"anthropic\",\"model\":\"claude-3-haiku-20240307\",\"messages\":[{\"role\":\"user\",\"content\":\"Say just 'hello' in one word\"}]}"
echo.
echo.

echo [6/7] Testing Gemini chat...
curl.exe -s -X POST %GATEWAY_URL%/v1/chat -H "Authorization: Bearer TEST" -H "Content-Type: application/json" -d "{\"provider\":\"gemini\",\"model\":\"gemini-2.5-flash\",\"messages\":[{\"role\":\"user\",\"content\":\"Say just 'greetings' in one word\"}]}"
echo.
echo.

echo [7/8] Testing Image generation (OpenAI)...
curl.exe -s -X POST %GATEWAY_URL%/v1/image -H "Authorization: Bearer TEST" -H "Content-Type: application/json" -d "{\"model\":\"dall-e-3\",\"prompt\":\"a tiny red square on white background\",\"n\":1,\"response_format\":\"url\"}"
echo.
echo.

echo [8/8] Testing Image generation (Gemini)...
curl.exe -s -X POST %GATEWAY_URL%/v1/image -H "Authorization: Bearer TEST" -H "Content-Type: application/json" -d "{\"provider\":\"gemini\",\"model\":\"gemini-2.5-flash-image\",\"prompt\":\"a tiny red square on white background\"}"
echo.
echo.

echo ========================================
echo Test Suite Complete!
echo ========================================
echo.
echo Final balance check:
curl.exe -s -H "Authorization: Bearer TEST" %GATEWAY_URL%/v1/balance
echo.
echo.
if not defined CI if not defined NO_PAUSE pause
