export async function stabilityMusic(apiKey: string, body: any) {
  // Default to Stability "Stable Audio" v2beta endpoint.
  // See: https://api.stability.ai (account + API key required)
  const endpoint = body.endpoint || 'https://api.stability.ai/v2beta/music/generate';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return res; // caller handles non-OK and error details
}

