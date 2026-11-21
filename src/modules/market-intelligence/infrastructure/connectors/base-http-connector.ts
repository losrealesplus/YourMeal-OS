/**
 * CR-COST-05 PR5: Base HTTP Connector with Polite Scraping & Rate Limiting Controls
 *
 * Implements strict etiquette:
 * 1. Explicit institutional User-Agent header.
 * 2. Per-host rate limiting (min interval between requests).
 * 3. Request timeout with AbortController.
 * 4. HTTP 429 handling with fail-closed stop (never hammers servers).
 * 5. HTTP 401/403 barrier (fails immediately; never evades auth or solves CAPTCHAs).
 * 6. Injectable fetchFn for deterministic local testing with fixtures.
 */

export interface BaseHttpConnectorOptions {
  userAgent?: string;
  timeoutMs?: number;
  minRequestIntervalMs?: number;
  fetchFn?: typeof fetch;
  maxRetries?: number;
}

export class HttpRateLimitError extends Error {
  constructor(
    public readonly host: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(
      `Límite de peticiones alcanzado (HTTP 429 Too Many Requests) en ${host}. ` +
      `Deteniendo peticiones inmediatamente por cortesía técnica.`
    );
    this.name = 'HttpRateLimitError';
  }
}

export class HttpAuthenticationRequiredError extends Error {
  constructor(
    public readonly host: string,
    public readonly statusCode: number,
  ) {
    super(
      `Acceso no autorizado o prohibido (HTTP ${statusCode}) en ${host}. ` +
      `Prohibido por diseño el scraping no autorizado o bypass de credenciales.`
    );
    this.name = 'HttpAuthenticationRequiredError';
  }
}

export abstract class BaseHttpConnector {
  protected readonly userAgent: string;
  protected readonly timeoutMs: number;
  protected readonly minRequestIntervalMs: number;
  protected readonly fetchFn: typeof fetch;
  protected readonly maxRetries: number;

  // Shared per-host timestamp registry to respect domain-level rate limits
  private static readonly lastRequestPerHost = new Map<string, number>();

  constructor(options: BaseHttpConnectorOptions = {}) {
    this.userAgent =
      options.userAgent ||
      'YourMeal-OS/1.0 - Core Market Intelligence (contact@yourmeal.io; public-data-bot)';
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.minRequestIntervalMs = options.minRequestIntervalMs ?? 1_000;
    this.fetchFn =
      options.fetchFn ||
      (typeof globalThis.fetch === 'function'
        ? globalThis.fetch.bind(globalThis)
        : (fetch as typeof globalThis.fetch));
    this.maxRetries = options.maxRetries ?? 2;
  }

  /**
   * Enforces inter-request pause per host to adhere to polite crawling policies.
   */
  protected async respectRateLimit(urlStr: string): Promise<void> {
    try {
      const parsedUrl = new URL(urlStr);
      const host = parsedUrl.host.toLowerCase();
      const now = Date.now();
      const last = BaseHttpConnector.lastRequestPerHost.get(host) ?? 0;
      const elapsed = now - last;

      if (elapsed < this.minRequestIntervalMs) {
        const waitTime = this.minRequestIntervalMs - elapsed;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      BaseHttpConnector.lastRequestPerHost.set(host, Date.now());
    } catch {
      // Invalid URL syntax will be handled by fetch
    }
  }

  /**
   * Resets rate limit trackers (primarily used in tests).
   */
  public static resetRateLimits(): void {
    BaseHttpConnector.lastRequestPerHost.clear();
  }

  /**
   * Executes a monitored HTTP request with timeout, polite rate limiting and status verification.
   */
  protected async request(
    urlStr: string,
    init: RequestInit = {},
    callerSignal?: AbortSignal,
  ): Promise<Response> {
    await this.respectRateLimit(urlStr);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    let abortListener: (() => void) | undefined;
    if (callerSignal) {
      if (callerSignal.aborted) {
        clearTimeout(timeoutId);
        controller.abort();
      } else {
        abortListener = () => controller.abort();
        callerSignal.addEventListener('abort', abortListener);
      }
    }

    const headers = new Headers(init.headers || {});
    if (!headers.has('User-Agent')) {
      headers.set('User-Agent', this.userAgent);
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json, text/plain, application/pdf, */*');
    }

    try {
      const response = await this.fetchFn(urlStr, {
        ...init,
        headers,
        signal: controller.signal,
      });

      // Handle 429 Too Many Requests
      if (response.status === 429) {
        let retryAfter: number | undefined;
        const retryHeader = response.headers?.get('Retry-After');
        if (retryHeader) {
          const parsed = parseInt(retryHeader, 10);
          if (!isNaN(parsed) && parsed > 0) {
            retryAfter = parsed;
          }
        }
        let host = 'remote-host';
        try {
          host = new URL(urlStr).host;
        } catch {
          // ignore
        }
        throw new HttpRateLimitError(host, retryAfter);
      }

      // Handle 401 / 403 Forbidden / Login walls
      if (response.status === 401 || response.status === 403) {
        let host = 'remote-host';
        try {
          host = new URL(urlStr).host;
        } catch {
          // ignore
        }
        throw new HttpAuthenticationRequiredError(host, response.status);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
      if (callerSignal && abortListener) {
        callerSignal.removeEventListener('abort', abortListener);
      }
    }
  }

  /**
   * Fetches text content (e.g. HTML or CSV) safely.
   */
  public async fetchText(
    url: string,
    callerSignal?: AbortSignal,
  ): Promise<{ text: string; status: number }> {
    const res = await this.request(url, {}, callerSignal);
    if (!res.ok) {
      throw new Error(`Error HTTP al consultar '${url}': ${res.status} ${res.statusText}`);
    }
    const text = await res.text();
    return { text, status: res.status };
  }

  /**
   * Fetches JSON data safely.
   */
  public async fetchJson<T = unknown>(
    url: string,
    callerSignal?: AbortSignal,
  ): Promise<{ data: T; status: number }> {
    const res = await this.request(
      url,
      { headers: { Accept: 'application/json' } },
      callerSignal,
    );
    if (!res.ok) {
      throw new Error(`Error HTTP al consultar '${url}': ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as T;
    return { data, status: res.status };
  }

  /**
   * Fetches binary buffer safely (e.g. PDF documents).
   */
  public async fetchBuffer(
    url: string,
    callerSignal?: AbortSignal,
  ): Promise<{ buffer: Uint8Array; status: number }> {
    const res = await this.request(url, {}, callerSignal);
    if (!res.ok) {
      throw new Error(`Error HTTP al consultar '${url}': ${res.status} ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return { buffer: new Uint8Array(arrayBuffer), status: res.status };
  }
}
