/**
 * CR-COST-05 PR5: Tests for BaseHttpConnector (Polite Scraping, Rate Limiting & Error Barriers)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BaseHttpConnector,
  HttpAuthenticationRequiredError,
  HttpRateLimitError,
} from './base-http-connector';

class TestHttpConnector extends BaseHttpConnector {
  public async testFetchText(url: string, signal?: AbortSignal) {
    return this.fetchText(url, signal);
  }

  public async testFetchJson<T>(url: string, signal?: AbortSignal) {
    return this.fetchJson<T>(url, signal);
  }

  public async testFetchBuffer(url: string, signal?: AbortSignal) {
    return this.fetchBuffer(url, signal);
  }
}

describe('BaseHttpConnector', () => {
  beforeEach(() => {
    BaseHttpConnector.resetRateLimits();
    vi.restoreAllMocks();
  });

  it('includes institutional User-Agent and Accept headers in outgoing requests', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'OK payload',
    });

    const connector = new TestHttpConnector({
      fetchFn: mockFetch as any,
      minRequestIntervalMs: 0,
    });

    await connector.testFetchText('https://canarias-distribucion.test/catalogo');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get('User-Agent')).toContain('YourMeal-OS/1.0 - Core Market Intelligence');
    expect(headers.get('Accept')).toBeDefined();
  });

  it('fails fast on HTTP 429 Too Many Requests without hammering the host', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '60' }),
    });

    const connector = new TestHttpConnector({
      fetchFn: mockFetch as any,
      minRequestIntervalMs: 0,
    });

    await expect(
      connector.testFetchText('https://api.distribuidor-local.test/precios')
    ).rejects.toThrow(HttpRateLimitError);

    try {
      await connector.testFetchText('https://api.distribuidor-local.test/precios');
    } catch (err: any) {
      expect(err.message).toContain('HTTP 429 Too Many Requests');
      expect(err.message).toContain('Deteniendo peticiones inmediatamente por cortesía técnica');
      expect(err.retryAfterSeconds).toBe(60);
    }
  });

  it('fails fast on HTTP 401/403 and halts credential bypass attempts', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    });

    const connector = new TestHttpConnector({
      fetchFn: mockFetch as any,
      minRequestIntervalMs: 0,
    });

    await expect(
      connector.testFetchText('https://portal-privado.test/ofertas')
    ).rejects.toThrow(HttpAuthenticationRequiredError);

    try {
      await connector.testFetchText('https://portal-privado.test/ofertas');
    } catch (err: any) {
      expect(err.message).toContain('HTTP 403');
      expect(err.message).toContain('Prohibido por diseño el scraping no autorizado o bypass de credenciales');
    }
  });

  it('respects per-host rate limiting by introducing polite pauses between consecutive calls', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });

    const minIntervalMs = 50;
    const connector = new TestHttpConnector({
      fetchFn: mockFetch as any,
      minRequestIntervalMs: minIntervalMs,
    });

    const start = Date.now();
    await connector.testFetchJson('https://host-amigable.test/page1');
    await connector.testFetchJson('https://host-amigable.test/page2');
    const elapsed = Date.now() - start;

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(elapsed).toBeGreaterThanOrEqual(minIntervalMs - 10);
  });

  it('aborts when caller signal triggers an abort', async () => {
    const controller = new AbortController();
    const mockFetch = vi.fn().mockImplementation((_url, opts) => {
      return new Promise((_resolve, reject) => {
        if (opts.signal?.aborted) {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
          return;
        }
        opts.signal?.addEventListener('abort', () => {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    const connector = new TestHttpConnector({
      fetchFn: mockFetch as any,
      minRequestIntervalMs: 0,
    });

    const promise = connector.testFetchText('https://slow-site.test/data', controller.signal);
    controller.abort();

    await expect(promise).rejects.toThrow();
  });
});
