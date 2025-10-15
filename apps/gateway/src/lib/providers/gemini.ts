async function callGemini(apiKey: string, model: string, body: any) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body)
  });
}

export async function geminiChat(apiKey: string, model: string, body: any) {
  let res = await callGemini(apiKey, model, body);
  if (res.ok) return res;

  // If model likely needs alias, retry with "-latest" once on 404
  if (res.status === 404 && !/-\d+$/.test(model) && !/-latest$/.test(model)) {
    const altModel = `${model}-latest`;
    const retry = await callGemini(apiKey, altModel, body);
    if (retry.ok) return retry;
    const errText = await retry.text().catch(() => '');
    throw new Error(`Gemini ${retry.status} (${altModel}): ${errText}`);
  }

  const errText = await res.text().catch(() => '');
  throw new Error(`Gemini ${res.status} (${model}): ${errText}`);
}
