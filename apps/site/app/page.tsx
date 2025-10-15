export default function Home() {
  return (
    <main style={{ maxWidth: 860, margin: '40px auto', padding: 24 }}>
      <h1>AI API Broker</h1>
      <p>Usage‑metered multi‑provider AI API. Buy credits → call endpoints → get results.</p>
      <h2>Endpoints</h2>
      <ul>
        <li><a href="/api-docs">/v1/chat</a> (OpenAI, Anthropic, Gemini)</li>
        <li>/v1/tts (ElevenLabs)</li>
        <li>/v1/image (OpenAI)</li>
        <li>/v1/music (Suno)</li>
        <li>/v1/balance</li>
      </ul>
    </main>
  );
}
