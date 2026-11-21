/**
 * CR-COST-05 PR5: Tests for Restricted Sources & Anti-Scraping Policy
 */

import { describe, it, expect } from 'vitest';
import {
  RestrictedSourceError,
  RestrictedSourcePolicy,
} from './restricted-source-policy';

describe('RestrictedSourcePolicy', () => {
  it('correctly categorizes gated wholesale and protected retail sources as restricted', () => {
    const restrictedSources = [
      'src-makro',
      'src-gmcash',
      'src-hiperdino',
      'src-mercadona',
      'src-carrefour',
      'src-alcampo',
      'src-eroski',
      'src-eci',
    ];

    for (const sourceId of restrictedSources) {
      expect(RestrictedSourcePolicy.isRestrictedSource(sourceId)).toBe(true);
      const policy = RestrictedSourcePolicy.getRestrictedSourcePolicy(sourceId);
      expect(policy).not.toBeNull();
      expect(policy?.isRestricted).toBe(true);
      expect(policy?.allowedIngestionModes).toContain('authorized_feed');
      expect(policy?.allowedIngestionModes).toContain('b2b_invoice_pdf');
    }
  });

  it('allows open public flyer and wholesale sources without restriction', () => {
    const openSources = ['src-cash-diplo', 'src-5oceanos', 'src-open-wholesale', 'src-generic-open'];

    for (const sourceId of openSources) {
      expect(RestrictedSourcePolicy.isRestrictedSource(sourceId)).toBe(false);
      expect(() => RestrictedSourcePolicy.assertScrapingAllowed(sourceId)).not.toThrow();
    }
  });

  it('assertScrapingAllowed throws RestrictedSourceError with informative Spanish message for restricted sources', () => {
    expect(() => RestrictedSourcePolicy.assertScrapingAllowed('src-makro')).toThrow(RestrictedSourceError);

    try {
      RestrictedSourcePolicy.assertScrapingAllowed('src-makro');
    } catch (err: any) {
      expect(err).toBeInstanceOf(RestrictedSourceError);
      expect(err.message).toContain('Acceso denegado por política core de YourMeal-OS');
      expect(err.message).toContain('Makro / Metro AG');
      expect(err.message).toContain('requiere feed autorizado o ingesta de factura real B2B');
      expect(err.message).toContain('Prohibido scraping no autorizado o bypass de credenciales');
    }

    try {
      RestrictedSourcePolicy.assertScrapingAllowed('src-hiperdino');
    } catch (err: any) {
      expect(err.message).toContain('HiperDino / Dinosol');
      expect(err.message).toContain('Vías oficiales permitidas');
    }
  });

  it('validates allowed ingestion modes per source', () => {
    // Restricted source: b2b_invoice_pdf and authorized_feed are allowed; public scraping is blocked
    expect(RestrictedSourcePolicy.isModeAllowedForSource('src-gmcash', 'b2b_invoice_pdf')).toBe(true);
    expect(RestrictedSourcePolicy.isModeAllowedForSource('src-gmcash', 'authorized_feed')).toBe(true);
    expect(RestrictedSourcePolicy.isModeAllowedForSource('src-gmcash', 'public_pdf')).toBe(false);
    expect(RestrictedSourcePolicy.isModeAllowedForSource('src-gmcash', 'public_structured_feed')).toBe(false);

    // Open source: public modes are allowed
    expect(RestrictedSourcePolicy.isModeAllowedForSource('src-cash-diplo', 'public_pdf')).toBe(true);
    expect(RestrictedSourcePolicy.isModeAllowedForSource('src-open-wholesale', 'public_structured_feed')).toBe(true);
  });
});
