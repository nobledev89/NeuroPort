export default function Docs() {
  const gw = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://<worker>.workers.dev';
  return (
    <main style={{ maxWidth: 860, margin: '40px auto', padding: 24 }}>
      <h1>API Reference</h1>
      <h2>Authentication</h2>
      <p>All endpoints require authentication via one of these methods:</p>
      <ul>
        <li><code>Authorization: Bearer &lt;your_api_key&gt;</code></li>
        <li><code>X-API-Key: &lt;your_api_key&gt;</code></li>
        <li><code>?api_key=&lt;your_api_key&gt;</code> (query parameter)</li>
      </ul>

      <h2>Balance</h2>
      <p>Check your remaining credits</p>
      <pre>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  ${gw}/v1/balance`}</pre>

      <h2>Chat Completion</h2>
      <p>Generate text completions using OpenAI, Anthropic, or Gemini</p>
      <pre>{`curl -X POST ${gw}/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini",
    "messages": [{"role":"user","content":"Hello"}]
  }'`}</pre>
      <p><strong>Providers:</strong> <code>openai</code>, <code>anthropic</code>, <code>gemini</code></p>

      <h2>Image Generation</h2>
      <p>Generate images using DALL-E</p>
      <pre>{`curl -X POST ${gw}/v1/image \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "dall-e-3",
    "prompt": "A kawaii robot",
    "n": 1
  }'`}</pre>

      <h2>Text-to-Speech</h2>
      <p>Convert text to audio using ElevenLabs</p>
      <pre>{`curl -X POST ${gw}/v1/tts \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello, world!",
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "estimateSeconds": 10
  }'`}</pre>

      <h2>Music Generation</h2>
      <p>Generate music using Stability AI</p>
      <pre>{`curl -X POST ${gw}/v1/music \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "upbeat electronic dance music",
    "duration": 30
  }'`}</pre>
      
    </main>
  );
}
