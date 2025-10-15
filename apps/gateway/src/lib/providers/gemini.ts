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

function toGeminiImageBody(src: any) {
  if (src?.contents) return src;
  const prompt = src?.prompt ?? src?.text ?? src?.input;
  if (!prompt) return src;
  const { prompt: _p, text: _t, input: _i, ...rest } = src;
  return {
    ...rest,
    contents: [{ role: 'user', parts: [{ text: String(prompt) }]}],
    generationConfig: {
      ...(src?.generationConfig || {}),
      response_mime_type: (src?.generationConfig?.response_mime_type || 'image/png')
    }
  };
}

export async function geminiImage(apiKey: string, model: string, body: any) {
  const b = toGeminiImageBody(body);
  const res = await callGemini(apiKey, model, b);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status} (${model}): ${errText}`);
  }
  return res;
}
