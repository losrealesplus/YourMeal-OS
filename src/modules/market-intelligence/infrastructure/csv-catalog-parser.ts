/**
 * CR-COST-05: Robust CSV Catalog Parser
 * Supports comma, semicolon, tab delimiters, quoted values, and header alias normalization.
 */

export interface RawCsvRow {
  lineNumber: number;
  data: Record<string, string>;
  rawLine: string;
}

export interface CsvParseResult {
  headers: string[];
  rows: RawCsvRow[];
}

export class CsvCatalogParser {
  private static readonly HEADER_ALIASES: Record<string, string> = {
    // source
    proveedor: 'source_name',
    fuente: 'source_name',
    source: 'source_name',
    source_name: 'source_name',
    // product name
    producto: 'product_name',
    descripcion: 'product_name',
    nombre: 'product_name',
    raw_name: 'product_name',
    product_name: 'product_name',
    // price
    precio: 'raw_price',
    pvp: 'raw_price',
    importe: 'raw_price',
    price: 'raw_price',
    raw_price: 'raw_price',
    // quantity
    cantidad: 'quantity',
    formato: 'quantity',
    peso: 'quantity',
    qty: 'quantity',
    quantity: 'quantity',
    // unit
    unidad: 'unit',
    medida: 'unit',
    uom: 'unit',
    unit: 'unit',
    // tax mode
    iva_incluido: 'tax_mode',
    tipo_precio: 'tax_mode',
    tax_mode: 'tax_mode',
    // tax rate
    iva: 'tax_rate',
    igic: 'tax_rate',
    tipo_iva: 'tax_rate',
    tipo_igic: 'tax_rate',
    tax_rate: 'tax_rate',
    // region code
    region: 'region_code',
    provincia: 'region_code',
    zona: 'region_code',
    region_code: 'region_code',
    // sku
    sku: 'external_sku',
    ref: 'external_sku',
    codigo_articulo: 'external_sku',
    external_sku: 'external_sku',
    // brand
    marca: 'brand',
    brand: 'brand',
    // category
    familia: 'category',
    categoria: 'category',
    category: 'category',
    // thermal state
    temperatura: 'thermal_state',
    conservacion: 'thermal_state',
    thermal_state: 'thermal_state',
    // cut spec
    corte: 'cut_spec',
    especificacion: 'cut_spec',
    cut_spec: 'cut_spec',
    // quality grade
    calidad: 'quality_grade',
    gama: 'quality_grade',
    quality_grade: 'quality_grade',
    // net drained qty
    peso_escurrido: 'net_drained_qty',
    net_drained: 'net_drained_qty',
    net_drained_qty: 'net_drained_qty',
    // location name
    tienda: 'location_name',
    almacen: 'location_name',
    establecimiento: 'location_name',
    location_name: 'location_name',
    // dates
    fecha_desde: 'valid_from',
    desde: 'valid_from',
    valid_from: 'valid_from',
    fecha_hasta: 'valid_to',
    hasta: 'valid_to',
    valid_to: 'valid_to',
    // promo
    oferta: 'promotion_status',
    promo: 'promotion_status',
    promotion_status: 'promotion_status',
    condicion_promo: 'promotion_condition',
    promotion_condition: 'promotion_condition',
    promo_hasta: 'promotion_valid_to',
    promotion_valid_to: 'promotion_valid_to',
    // physical format (Block 2)
    ean: 'gtin',
    codigo_barras: 'gtin',
    barcode: 'gtin',
    gtin: 'gtin',
    origen: 'origin',
    origin: 'origin',
    presentacion: 'pack_presentation',
    envase: 'pack_presentation',
    pack_presentation: 'pack_presentation',
    unidades_caja: 'pack_count',
    unidades_pack: 'pack_count',
    num_envases: 'pack_count',
    pack_count: 'pack_count',
    contenido_envase: 'unit_content_qty',
    unit_content_qty: 'unit_content_qty',
    unidad_envase: 'unit_content_unit',
    unit_content_unit: 'unit_content_unit',
    contenido_neto: 'net_content_qty',
    net_content_qty: 'net_content_qty',
    unidad_neto: 'net_content_unit',
    net_content_unit: 'net_content_unit',
    unidad_peso_escurrido: 'drained_weight_unit',
    drained_weight_unit: 'drained_weight_unit',
    densidad: 'density_kg_per_l',
    density_kg_per_l: 'density_kg_per_l',
    base_precio: 'observed_price_basis',
    observed_price_basis: 'observed_price_basis',
    // geo & availability (Block 2)
    pais: 'observation_country_code',
    country_code: 'observation_country_code',
    observation_country_code: 'observation_country_code',
    subdivision: 'observation_subdivision_code',
    observation_subdivision_code: 'observation_subdivision_code',
    provincia_cod: 'observation_province_code',
    observation_province_code: 'observation_province_code',
    isla: 'observation_island_code',
    island_code: 'observation_island_code',
    observation_island_code: 'observation_island_code',
    cp: 'observation_postal_code',
    codigo_postal: 'observation_postal_code',
    postal_code: 'observation_postal_code',
    observation_postal_code: 'observation_postal_code',
    canal_observado: 'observed_channel',
    observed_channel: 'observed_channel',
    cobertura_entrega: 'delivery_coverage_state',
    delivery_coverage_state: 'delivery_coverage_state',
    disponibilidad: 'availability_status',
    availability_status: 'availability_status',
    fuente_vigencia: 'validity_source',
    validity_source: 'validity_source',
    // fiscal & commercial conditions (Block 2)
    moneda: 'currency',
    currency: 'currency',
    regimen_fiscal: 'tax_regime',
    tax_regime: 'tax_regime',
    fuente_impuesto: 'tax_rate_source',
    tax_rate_source: 'tax_rate_source',
    norma_fiscal: 'tax_rule_ref',
    tax_rule_ref: 'tax_rule_ref',
    fiscal_desde: 'tax_effective_from',
    tax_effective_from: 'tax_effective_from',
    fiscal_hasta: 'tax_effective_to',
    tax_effective_to: 'tax_effective_to',
    aiem: 'aiem_status',
    aiem_status: 'aiem_status',
    evidencia_aiem: 'aiem_evidence',
    aiem_evidence: 'aiem_evidence',
    tipo_aiem: 'aiem_rate',
    aiem_rate: 'aiem_rate',
    importe_aiem: 'aiem_amount_raw',
    aiem_amount_raw: 'aiem_amount_raw',
    portes: 'freight_inclusion',
    freight_inclusion: 'freight_inclusion',
    coste_portes: 'freight_cost_raw',
    freight_cost_raw: 'freight_cost_raw',
    portes_gratis_desde: 'free_freight_min_order_amount',
    free_freight_min_order_amount: 'free_freight_min_order_amount',
    pedido_minimo: 'min_order_qty',
    min_order_qty: 'min_order_qty',
    unidad_pedido_minimo: 'min_order_unit',
    min_order_unit: 'min_order_unit',
  };

  /**
   * Parses raw CSV string into normalized headers and rows.
   */
  public static parse(csvContent: string): CsvParseResult {
    // Strip UTF-8 BOM if present
    const cleanContent = csvContent.replace(/^\uFEFF/, '').trim();
    if (!cleanContent) {
      return { headers: [], rows: [] };
    }

    const rawLines = cleanContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (rawLines.length === 0) {
      return { headers: [], rows: [] };
    }

    // Detect delimiter from header line (, ; \t)
    const headerLine = rawLines[0];
    const delimiter = this.detectDelimiter(headerLine);

    const rawHeaders = this.parseCsvLine(headerLine, delimiter);
    const normalizedHeaders = rawHeaders.map((h) => this.normalizeHeader(h));

    const rows: RawCsvRow[] = [];
    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i];
      const values = this.parseCsvLine(line, delimiter);
      const rowData: Record<string, string> = {};

      for (let j = 0; j < normalizedHeaders.length; j++) {
        const headerKey = normalizedHeaders[j];
        if (headerKey) {
          rowData[headerKey] = (values[j] ?? '').trim();
        }
      }

      rows.push({
        lineNumber: i + 1,
        data: rowData,
        rawLine: line,
      });
    }

    return {
      headers: normalizedHeaders.filter((h) => h.length > 0),
      rows,
    };
  }

  private static detectDelimiter(line: string): string {
    const commaCount = (line.match(/,/g) || []).length;
    const semicolonCount = (line.match(/;/g) || []).length;
    const tabCount = (line.match(/\t/g) || []).length;

    if (semicolonCount > commaCount && semicolonCount >= tabCount) {
      return ';';
    }
    if (tabCount > commaCount && tabCount > semicolonCount) {
      return '\t';
    }
    return ',';
  }

  private static parseCsvLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    return values.map((v) => v.trim());
  }

  private static normalizeHeader(rawHeader: string): string {
    const clean = rawHeader
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    return this.HEADER_ALIASES[clean] || clean;
  }
}
