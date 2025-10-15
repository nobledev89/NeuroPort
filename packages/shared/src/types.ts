export interface BalanceResponse { credits: number }
export interface UsageLog { route: string; details: Record<string, any>; ts?: number }
