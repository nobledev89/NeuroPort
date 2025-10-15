import type { KVNamespace } from '@cloudflare/workers-types';

// Minimal Redis (Upstash) client via REST
export class Redis {
  constructor(private url: string, private token: string) {}
  async get(key: string) { return (await fetch(`${this.url}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${this.token}` } })).json(); }
  async set(key: string, val: string) { return (await fetch(`${this.url}/set/${encodeURIComponent(key)}/${encodeURIComponent(val)}`, { method: 'POST', headers: { Authorization: `Bearer ${this.token}` } })).json(); }
  async decrby(key: string, n: number) { return (await fetch(`${this.url}/decrby/${encodeURIComponent(key)}/${n}`, { method: 'POST', headers: { Authorization: `Bearer ${this.token}` } })).json(); }
  async incrby(key: string, n: number) { return (await fetch(`${this.url}/incrby/${encodeURIComponent(key)}/${n}`, { method: 'POST', headers: { Authorization: `Bearer ${this.token}` } })).json(); }
}

export interface Env { UPSTASH_REDIS_REST_URL: string; UPSTASH_REDIS_REST_TOKEN: string; KV: KVNamespace; RAPIDAPI_SECRET: string; }

export function redisFromEnv(env: Env) {
  return new Redis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
}

export async function getCredits(env: Env, apiKey: string) {
  const r = redisFromEnv(env);
  const key = `user:${apiKey}:credits`;
  const res: any = await r.get(key);
  return Number(res?.result ?? 0);
}

export async function addCredits(env: Env, apiKey: string, n: number) {
  const r = redisFromEnv(env);
  const key = `user:${apiKey}:credits`;
  await r.incrby(key, n);
}

export async function consumeCredits(env: Env, apiKey: string, n: number) {
  const r = redisFromEnv(env);
  const key = `user:${apiKey}:credits`;
  const res: any = await r.decrby(key, n);
  const after = Number(res?.result ?? 0);
  if (after < 0) {
    // rollback
    await r.incrby(key, n);
    throw new Error('INSUFFICIENT_CREDITS');
  }
  return after;
}

export async function logUsage(env: Env, apiKey: string, route: string, details: Record<string, any>) {
  const id = crypto.randomUUID();
  await env.KV.put(`usage:${apiKey}:${Date.now()}:${id}`, JSON.stringify({ route, details }));
}
