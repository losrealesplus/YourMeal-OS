/**
 * CR-COST-05 PR5: Restricted Sources & Anti-Scraping Policy Registry
 *
 * Explicitly catalogizes and halts any unauthorized automated extraction,
 * credential bypass, login bypass, or anti-bot evasions for proprietary wholesale
 * or retail portals that mandate commercial agreements, credentials, or authorized feeds.
 */

export interface RestrictedSourceRule {
  sourceId: string;
  sourceName: string;
  isRestricted: boolean;
  reason: string;
  allowedIngestionModes: Array<'authorized_feed' | 'b2b_invoice_pdf' | 'b2b_document_image' | 'manual_entry'>;
  legalNotice: string;
}

export const RESTRICTED_SOURCE_CATALOG: Record<string, RestrictedSourceRule> = {
  'src-makro': {
    sourceId: 'src-makro',
    sourceName: 'Makro / Metro AG',
    isRestricted: true,
    reason: 'Portal exclusivo para profesionales con tarjeta de cliente. Prohibido scraping no autorizado o bypass de login.',
    allowedIngestionModes: ['authorized_feed', 'b2b_invoice_pdf', 'b2b_document_image', 'manual_entry'],
    legalNotice: 'Los datos de Makro deben incorporarse exclusivamente mediante albaranes/facturas reales del cliente o feed EDI acordado.',
  },
  'src-gmcash': {
    sourceId: 'src-gmcash',
    sourceName: 'GM Cash (Transgourmet)',
    isRestricted: true,
    reason: 'Tarifas y promociones accesibles únicamente mediante credencial HORECA. Prohibido scraping o login programático.',
    allowedIngestionModes: ['authorized_feed', 'b2b_invoice_pdf', 'b2b_document_image', 'manual_entry'],
    legalNotice: 'Solo ingesta de albaranes/facturas B2B o integración de feed autorizado por Transgourmet.',
  },
  'src-hiperdino': {
    sourceId: 'src-hiperdino',
    sourceName: 'HiperDino / Dinosol',
    isRestricted: true,
    reason: 'Términos de servicio con protección antibot y condiciones cerradas. Prohibida la extracción no autorizada.',
    allowedIngestionModes: ['authorized_feed', 'b2b_invoice_pdf', 'manual_entry'],
    legalNotice: 'Requiere autorización formal o ingesta de tickets/facturas comerciales aportados por el restaurante.',
  },
  'src-mercadona': {
    sourceId: 'src-mercadona',
    sourceName: 'Mercadona',
    isRestricted: true,
    reason: 'Condiciones de uso prohíben expresamente el rastreo masivo automatizado para fines comerciales.',
    allowedIngestionModes: ['authorized_feed', 'b2b_invoice_pdf', 'manual_entry'],
    legalNotice: 'Precios de referencia retail solo admitidos vía acuerdos o facturas directas.',
  },
  'src-carrefour': {
    sourceId: 'src-carrefour',
    sourceName: 'Carrefour España',
    isRestricted: true,
    reason: 'Términos web con reserva expresa de derechos de minería de datos y barreras de sesión.',
    allowedIngestionModes: ['authorized_feed', 'b2b_invoice_pdf', 'manual_entry'],
    legalNotice: 'Admitido únicamente mediante facturas comerciales aportadas por el operador o feed B2B.',
  },
  'src-alcampo': {
    sourceId: 'src-alcampo',
    sourceName: 'Alcampo (Auchan)',
    isRestricted: true,
    reason: 'Políticas de acceso condicionadas a sesión de compra minorista. No autorizada extracción automática masiva.',
    allowedIngestionModes: ['authorized_feed', 'b2b_invoice_pdf', 'manual_entry'],
    legalNotice: 'Ingesta documental de compras reales o feed autorizado.',
  },
  'src-eroski': {
    sourceId: 'src-eroski',
    sourceName: 'Eroski',
    isRestricted: true,
    reason: 'Acceso regulado a socios y clientes. Prohibida extracción sistemática de tarifas.',
    allowedIngestionModes: ['authorized_feed', 'b2b_invoice_pdf', 'manual_entry'],
    legalNotice: 'Requiere acuerdo de suministro o facturación directa del cliente.',
  },
  'src-eci': {
    sourceId: 'src-eci',
    sourceName: 'El Corte Inglés / Supercor',
    isRestricted: true,
    reason: 'Portal minorista con controles de sesión activa y limitaciones de scraping comercial.',
    allowedIngestionModes: ['authorized_feed', 'b2b_invoice_pdf', 'manual_entry'],
    legalNotice: 'Ingesta mediante facturas/tickets reales o feed acordado.',
  },
};

export class RestrictedSourceError extends Error {
  constructor(
    public readonly sourceId: string,
    public readonly rule: RestrictedSourceRule,
  ) {
    super(
      `Acceso denegado por política core de YourMeal-OS: la fuente '${rule.sourceName}' (${sourceId}) ` +
      `requiere feed autorizado o ingesta de factura real B2B. Prohibido scraping no autorizado o bypass de credenciales. ` +
      `Vías oficiales permitidas: ${rule.allowedIngestionModes.join(', ')}.`
    );
    this.name = 'RestrictedSourceError';
  }
}

export class RestrictedSourcePolicy {
  /**
   * Checks whether a source ID is subject to scraping restrictions.
   */
  public static isRestrictedSource(sourceId: string): boolean {
    if (!sourceId) return false;
    const normalized = sourceId.trim().toLowerCase();
    return Boolean(RESTRICTED_SOURCE_CATALOG[normalized]?.isRestricted);
  }

  /**
   * Retrieves policy rule for a source.
   */
  public static getRestrictedSourcePolicy(sourceId: string): RestrictedSourceRule | null {
    if (!sourceId) return null;
    const normalized = sourceId.trim().toLowerCase();
    return RESTRICTED_SOURCE_CATALOG[normalized] || null;
  }

  /**
   * Asserts that automated scraping / crawling is permitted for the given source.
   * Throws RestrictedSourceError in Spanish if the source is restricted.
   */
  public static assertScrapingAllowed(sourceId: string): void {
    const policy = this.getRestrictedSourcePolicy(sourceId);
    if (policy && policy.isRestricted) {
      throw new RestrictedSourceError(sourceId, policy);
    }
  }

  /**
   * Validates if a requested batch ingestion mode is authorized for the source.
   */
  public static isModeAllowedForSource(
    sourceId: string,
    mode: 'authorized_feed' | 'b2b_invoice_pdf' | 'b2b_document_image' | 'manual_entry' | 'public_pdf' | 'public_structured_feed',
  ): boolean {
    const policy = this.getRestrictedSourcePolicy(sourceId);
    if (!policy) return true; // Open or uncatalogued source
    if (mode === 'public_pdf' || mode === 'public_structured_feed') {
      return !policy.isRestricted;
    }
    return policy.allowedIngestionModes.includes(mode);
  }
}
