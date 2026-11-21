/**
 * CR-COST-05 PR4: Open Food Facts Client (Physical & Descriptive Enrichment ONLY)
 * Connects to the public Open Food Facts API to retrieve product packaging and physical dimensions by GTIN/EAN.
 * 
 * STRICT INVARIANT:
 * This client NEVER retrieves, infers or populates prices, taxes, or freight costs.
 * It is solely a physical catalog metadata enricher.
 */

import { parseGtin } from '../domain/physical-format';
import { ContentUnit, PackPresentation } from '../domain/types';

export interface OpenFoodFactsProductData {
  gtin: string;
  productName?: string;
  brand?: string;
  categories?: string[];
  quantityRaw?: string;
  netContentQty?: number;
  netContentUnit?: ContentUnit;
  drainedWeightQty?: number;
  drainedWeightUnit?: 'kg' | 'g';
  packPresentation?: PackPresentation;
  origin?: string;
  ecoscoreGrade?: string;
}

export interface IOpenFoodFactsClient {
  fetchProductByGtin(gtin: string): Promise<OpenFoodFactsProductData | null>;
}

export interface OpenFoodFactsClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  userAgent?: string;
  cacheTtlMs?: number;
  fetchFn?: typeof fetch;
}

export class OpenFoodFactsClient implements IOpenFoodFactsClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly userAgent: string;
  private readonly cacheTtlMs: number;
  private readonly fetchFn: typeof fetch;
  private readonly cache = new Map<string, { data: OpenFoodFactsProductData | null; expiresAt: number }>();
  private lastRequestTime = 0;

  constructor(options: OpenFoodFactsClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'https://world.openfoodfacts.org/api/v2/product';
    this.timeoutMs = options.timeoutMs ?? 3000;
    this.userAgent = options.userAgent || 'YourMeal-OS/1.0 - Core Market Intelligence (contact@yourmeal.io)';
    this.cacheTtlMs = options.cacheTtlMs ?? 24 * 60 * 60 * 1000; // 24 hours
    this.fetchFn = options.fetchFn || (globalThis.fetch ? globalThis.fetch.bind(globalThis) : (fetch as typeof globalThis.fetch));
  }

  public async fetchProductByGtin(gtin: string): Promise<OpenFoodFactsProductData | null> {
    const parsedGtin = parseGtin(gtin);
    if (!parsedGtin.isValidFormat || !parsedGtin.gtin) {
      return null;
    }

    const cleanGtin = parsedGtin.gtin;

    // 1. Check in-memory cache
    const cached = this.cache.get(cleanGtin);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // 2. Throttle slightly to be a polite consumer (minimum 250ms spacing)
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < 250) {
      await new Promise((resolve) => setTimeout(resolve, 250 - elapsed));
    }
    this.lastRequestTime = Date.now();

    // 3. Perform HTTP request with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const url = `${this.baseUrl}/${cleanGtin}.json?fields=code,product_name,brands,categories_tags,quantity,packaging_text,product_quantity,product_quantity_unit,drained_weight,origins_tags,ecoscore_grade`;

      const response = await this.fetchFn(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        this.cache.set(cleanGtin, { data: null, expiresAt: Date.now() + 60 * 1000 }); // 1m negative cache
        return null;
      }

      const json = (await response.json()) as any;
      if (!json || json.status === 0 || !json.product) {
        this.cache.set(cleanGtin, { data: null, expiresAt: Date.now() + 5 * 60 * 1000 });
        return null;
      }

      const product = json.product;
      const enriched = this.mapProductData(cleanGtin, product);

      this.cache.set(cleanGtin, { data: enriched, expiresAt: Date.now() + this.cacheTtlMs });
      return enriched;
    } catch {
      // Network error, timeout, or abort - fail safely returning null
      return null;
    }
  }

  private mapProductData(gtin: string, p: any): OpenFoodFactsProductData {
    const rawQuantity = typeof p.quantity === 'string' ? p.quantity.trim() : undefined;
    const packagingInput = p.packaging_text || p.packaging || '';
    const { netContentQty, netContentUnit, packPresentation } = this.parseQuantitySpec(
      rawQuantity,
      p.product_quantity,
      p.product_quantity_unit,
      packagingInput
    );

    let drainedWeightQty: number | undefined;
    let drainedWeightUnit: 'kg' | 'g' | undefined;
    if (p.drained_weight) {
      const parsedDrained = parseFloat(String(p.drained_weight).replace(',', '.'));
      if (!isNaN(parsedDrained) && parsedDrained > 0) {
        drainedWeightQty = parsedDrained;
        drainedWeightUnit = parsedDrained > 50 ? 'g' : 'kg';
      }
    }

    const originsList = Array.isArray(p.origins_tags) && p.origins_tags.length > 0
      ? p.origins_tags[0].replace(/^en:/, '')
      : typeof p.origins === 'string'
        ? p.origins.split(',')[0].trim()
        : undefined;

    return {
      gtin,
      productName: p.product_name?.trim() || undefined,
      brand: p.brands?.split(',')?.[0]?.trim() || undefined,
      categories: Array.isArray(p.categories_tags)
        ? p.categories_tags.map((c: string) => c.replace(/^en:/, '').replace(/-/g, ' '))
        : undefined,
      quantityRaw: rawQuantity,
      netContentQty,
      netContentUnit,
      drainedWeightQty,
      drainedWeightUnit,
      packPresentation,
      origin: originsList,
      ecoscoreGrade: typeof p.ecoscore_grade === 'string' ? p.ecoscore_grade.toUpperCase() : undefined,
    };
  }

  private parseQuantitySpec(
    rawQuantity?: string,
    productQuantity?: number | string,
    productUnit?: string,
    packagingText?: string
  ): {
    netContentQty?: number;
    netContentUnit?: ContentUnit;
    packPresentation?: PackPresentation;
  } {
    let netContentQty: number | undefined;
    let netContentUnit: ContentUnit | undefined;
    let packPresentation: PackPresentation | undefined;

    // Detect packaging text
    const packText = `${rawQuantity || ''} ${packagingText || ''}`.toLowerCase();
    if (packText.includes('botella') || packText.includes('bottle')) packPresentation = 'bottle';
    else if (packText.includes('lata') || packText.includes('can')) packPresentation = 'can';
    else if (packText.includes('bolsa') || packText.includes('bag')) packPresentation = 'bag';
    else if (packText.includes('caja') || packText.includes('box')) packPresentation = 'box';
    else if (packText.includes('tarro') || packText.includes('jar')) packPresentation = 'jar';
    else if (packText.includes('bandeja') || packText.includes('tray')) packPresentation = 'tray';
    else if (packText.includes('pack')) packPresentation = 'pack';

    // Parse numeric quantity & unit from product_quantity or raw text
    if (productQuantity !== undefined && productQuantity !== null && productUnit) {
      const num = parseFloat(String(productQuantity).replace(',', '.'));
      const unit = productUnit.toLowerCase().trim();
      if (!isNaN(num) && num > 0) {
        netContentQty = num;
        if (unit === 'g' || unit === 'kg' || unit === 'l' || unit === 'ml' || unit === 'cl') {
          netContentUnit = unit as ContentUnit;
        }
      }
    }

    if (!netContentQty && rawQuantity) {
      const match = rawQuantity.match(/([0-9.,]+)\s*(kg|g|l|ml|cl)/i);
      if (match) {
        const num = parseFloat(match[1].replace(',', '.'));
        const unit = match[2].toLowerCase() as ContentUnit;
        if (!isNaN(num) && num > 0) {
          netContentQty = num;
          netContentUnit = unit;
        }
      }
    }

    return { netContentQty, netContentUnit, packPresentation };
  }
}
