/**
 * Unit conversion helper aligned with the PostgreSQL contract in apply_inventory_consumption_v1:
 * - Mass: kg <-> g (1 kg = 1000 g)
 * - Volume: l <-> ml (1 l = 1000 ml)
 * - Identical units (case-insensitive)
 * - Unsupported conversions return compatible: false (unverifiable availability)
 */

export type UnitConversion =
  | {
      compatible: true;
      /** Factor to multiply stock quantity to express it in line units: stockInLineUnit = stockQty * factor */
      stockToLineFactor: number;
      /** Factor to multiply line quantity to express it in stock units: lineInStockUnit = lineQty * factor */
      lineToStockFactor: number;
      availableInLineUnit: number;
    }
  | {
      compatible: false;
      reason: string;
    };

export function convertUnits(
  stockQty: number,
  stockUnit: string,
  lineQty: number,
  lineUnit: string,
): UnitConversion {
  const su = (stockUnit || "").trim().toLowerCase();
  const lu = (lineUnit || "").trim().toLowerCase();

  if (!su || !lu) {
    return { compatible: false, reason: "Unidad no especificada" };
  }

  if (su === lu) {
    return {
      compatible: true,
      stockToLineFactor: 1,
      lineToStockFactor: 1,
      availableInLineUnit: stockQty,
    };
  }

  // Mass: kg <-> g
  if (su === "kg" && lu === "g") {
    // 1 kg = 1000 g
    return {
      compatible: true,
      stockToLineFactor: 1000,
      lineToStockFactor: 1 / 1000,
      availableInLineUnit: stockQty * 1000,
    };
  }
  if (su === "g" && lu === "kg") {
    // 1 g = 0.001 kg
    return {
      compatible: true,
      stockToLineFactor: 1 / 1000,
      lineToStockFactor: 1000,
      availableInLineUnit: stockQty / 1000,
    };
  }

  // Volume: l <-> ml
  if (su === "l" && lu === "ml") {
    // 1 l = 1000 ml
    return {
      compatible: true,
      stockToLineFactor: 1000,
      lineToStockFactor: 1 / 1000,
      availableInLineUnit: stockQty * 1000,
    };
  }
  if (su === "ml" && lu === "l") {
    // 1 ml = 0.001 l
    return {
      compatible: true,
      stockToLineFactor: 1 / 1000,
      lineToStockFactor: 1000,
      availableInLineUnit: stockQty / 1000,
    };
  }

  return {
    compatible: false,
    reason: `Conversión no soportada entre '${stockUnit}' y '${lineUnit}'`,
  };
}
