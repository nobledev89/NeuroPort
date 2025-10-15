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

function normalizeGenerationConfig(base: any) {
  const config = base && typeof base === 'object' ? { ...base } : {};
  if (!('responseMimeType' in config) && !('response_mime_type' in config)) {
    config.responseMimeType = 'image/png';
  }
  return config;
}

function stripResponseMimeType(body: any) {
  const generationConfig = body?.generationConfig;
  if (!generationConfig || typeof generationConfig !== 'object') {
    return { stripped: body, changed: false };
  }
  const hasField = Object.prototype.hasOwnProperty.call(generationConfig, 'responseMimeType') ||
    Object.prototype.hasOwnProperty.call(generationConfig, 'response_mime_type');
  if (!hasField) return { stripped: body, changed: false };
  const next: any = { ...body };
  const nextGen: any = { ...generationConfig };
  delete nextGen.responseMimeType;
  delete nextGen.response_mime_type;
  if (Object.keys(nextGen).length) next.generationConfig = nextGen;
  else delete next.generationConfig;
  return { stripped: next, changed: true };
}

function toGeminiImageBody(src: any) {
  if (!src || typeof src !== 'object') return src;
  const generationConfig = normalizeGenerationConfig(src.generationConfig);
  if (Array.isArray(src.contents)) {
    return {
      ...src,
      generationConfig
    };
  }
  const prompt = src?.prompt ?? src?.text ?? src?.input;
  if (!prompt) {
    return {
      ...src,
      generationConfig
    };
  }
  const { prompt: _p, text: _t, input: _i, generationConfig: _gc, ...rest } = src;
  return {
    ...rest,
    generationConfig,
    contents: [{ role: 'user', parts: [{ text: String(prompt) }]}]
  };
}

export interface GeminiImageResult {
  created: number;
  modelVersion?: string;
  images: Array<{ b64_json: string; mimeType: string; finishReason?: string }>;
  raw: any;
}

export async function geminiImage(apiKey: string, model: string, body: any): Promise<GeminiImageResult> {
  let requestBody = toGeminiImageBody(body);
  let res = await callGemini(apiKey, model, requestBody);
  if (!res.ok && res.status === 400) {
    const errText = await res.text().catch(() => '');
    if (errText && /response[_ ]?mime/i.test(errText)) {
      const { stripped, changed } = stripResponseMimeType(requestBody);
      if (changed) {
        requestBody = stripped;
        res = await callGemini(apiKey, model, requestBody);
      } else {
        throw new Error(`Gemini ${res.status} (${model}): ${errText}`);
      }
    } else {
      throw new Error(`Gemini ${res.status} (${model}): ${errText}`);
    }
  }
  if (!res.ok && res.status === 404 && !/-\d+$/.test(model) && !/-latest$/.test(model)) {
    const altModel = `${model}-latest`;
    res = await callGemini(apiKey, altModel, requestBody);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gemini ${res.status} (${altModel}): ${errText}`);
    }
    model = altModel;
  } else if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status} (${model}): ${errText}`);
  }
  const json = await res.json().catch(() => null);
  if (!json) throw new Error('Gemini image response was not JSON');
  const candidates = Array.isArray(json.candidates) ? json.candidates : [];
  const images: Array<{ b64_json: string; mimeType: string; finishReason?: string }> = [];
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    const finishReason = candidate?.finishReason || candidate?.finish_reason;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      const inline = part?.inlineData || part?.inline_data;
      if (inline?.data) {
        images.push({
          b64_json: inline.data,
          mimeType: inline.mimeType || inline.mime_type || 'image/png',
          finishReason
        });
      }
    }
  }
  if (!images.length) {
    throw new Error(`Gemini image response missing inline data: ${JSON.stringify(json).slice(0, 500)}`);
  }
  const created = Math.floor(Date.now() / 1000);
  return {
    created,
    modelVersion: json.modelVersion,
    images,
    raw: json
  };
}
