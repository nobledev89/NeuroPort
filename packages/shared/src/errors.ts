export class InsufficientCreditsError extends Error {
  constructor(message = 'Insufficient credits') {
    super(message);
    this.name = 'InsufficientCreditsError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ProviderError extends Error {
  constructor(provider: string, status: number, message?: string) {
    super(message || `Provider ${provider} returned status ${status}`);
    this.name = 'ProviderError';
  }
}
