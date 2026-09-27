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
