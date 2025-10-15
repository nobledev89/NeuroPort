export type Unit = "token" | "second" | "image" | "clip" | "request";
export type RouteKey = "chat" | "tts" | "image" | "music";

/** Base cost you pay providers (approx / configurable). */
export const providerCosts = {
  chat: {
    openai: { unit: "token" as Unit, in: 1e-6, out: 4e-6 }, // USD/token
    anthropic: { unit: "token" as Unit, in: 3e-6, out: 15e-6 },
    gemini: { unit: "token" as Unit, in: 0.0, out: 0.0 } // define per model tier
  },
  tts: {
    elevenlabs: { unit: "second" as Unit, sec: 0.0003 } // e.g. $0.0003/sec
  },
  image: {
    openai: { unit: "image" as Unit, each: 0.04 }
  },
  music: {
    stability: { unit: "clip" as Unit, each: 0.05 }
  }
} as const;

/** Retail markup: multiply provider cost to compute credits charge. */
export function getDefaultMargin(env: any) {
  return Number(env.MARGIN_MULTIPLIER || 1.8);
}

export function usdToCredits(usd: number, env: any) {
  const usdPerCredit = Number(env.STRIPE_PRICE_USD_PER_CREDIT || 0.01);
  return Math.ceil(usd / usdPerCredit);
}

export function chargeFor(route: RouteKey, estimatedUsd: number, env: any) {
  const margin = getDefaultMargin(env);
  const retail = estimatedUsd * margin;
  return Math.max(1, usdToCredits(retail, env));
}
