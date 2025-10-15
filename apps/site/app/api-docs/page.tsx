export default function Docs() {
  const gw = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://<worker>.workers.dev';
  return (
    <main style={{ maxWidth: 860, margin: '40px auto', padding: 24 }}>
      <h1>API Reference</h1>
      <h2>Auth</h2>
      <pre>Authorization: Bearer &lt;your_api_key&gt;</pre>

      <h2>Balance</h2>
      <pre>{`GET ${gw}/v1/balance`}</pre>

      <h2>Chat</h2>
      <pre>{`POST ${gw}/v1/chat\n{\n  "provider": "openai|anthropic|gemini",\n  "model": "gpt-4o-mini",\n  "messages": [{"role":"user","content":"Hello"}]\n}`}</pre>

      <h2>Image</h2>
      <pre>{`POST ${gw}/v1/image\n{\n  "model": "gpt-image-1",\n  "prompt": "A kawaii robot",\n  "n": 1\n}`}</pre>
      
    </main>
  );
}
