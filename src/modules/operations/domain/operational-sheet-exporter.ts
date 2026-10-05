import {
  operationalItemIdentity,
  type ItemIdentity,
  type AllergenSnapshotState,
} from "@/modules/orders/domain/order-item-read-model";
/**
 * CR-OPS-07: Operational Sheet Exporter Subsystem
 * Dual format generator:
 * 1. Flat 17-column granular tabular matrix (CSV / Excel ready) with 0 merged cells.
 * 2. High-contrast workshop printable PDF & Thermal label data models.
 */

import type { NormalizedOperationalLine } from "./operational-engine-types";

export interface FlatAnalyticRow {
  fechaEntrega: string;
  municipio: string;
  canal: string;
  empresa: string;
  sede: string;
  unidadDepartamento: string;
  cliente: string;
  idPedido: string;
  plato: string;
  cantidad: number;
  alergiasSeguridad: string;
  modificaciones: string;
  preferencias: string;
  notasOperativas: string;
  identidadItem: ItemIdentity;
  tipoItem: "dish" | "custom";
  estadoAlergenos: AllergenSnapshotState;
}

export const CANONICAL_EXCEL_HEADERS = [
  "FECHA_ENTREGA",
  "MUNICIPIO",
  "CANAL",
  "EMPRESA",
  "SEDE",
  "UNIDAD_DEPARTAMENTO",
  "CLIENTE",
  "ID_PEDIDO",
  "PLATO",
  "CANTIDAD",
  "ALERGIAS_SEGURIDAD",
  "MODIFICACIONES",
  "PREFERENCIAS",
  "NOTAS_OPERATIVAS",
  "IDENTIDAD_ITEM",
  "TIPO_ITEM",
  "ESTADO_ALERGENOS",
] as const;

/**
 * Builds the canonical 17-column flat analytic matrix from normalized operational lines.
 */
export function buildFlatAnalyticMatrix(lines: NormalizedOperationalLine[]): FlatAnalyticRow[] {
  return lines.map((l) => ({
    fechaEntrega: l.identity.operationalDate,
    municipio: l.municipality,
    canal: l.demandChannel === "company" ? "B2B_EMPRESA" : "B2C_PARTICULAR",
    empresa: l.companyName || "—",
    sede: l.siteName || "—",
    unidadDepartamento: l.organizationalUnitName || "—",
    cliente: l.customerName,
    idPedido: l.identity.orderId,
    plato: l.dishName,
    cantidad: l.qty,
    alergiasSeguridad:
      l.criticalSafetyAllergens.length > 0
        ? `🔴 ${l.criticalSafetyAllergens.join(", ").toUpperCase()}`
        : "—",
    modificaciones: l.modifications.length > 0 ? l.modifications.join(" · ") : "—",
    preferencias: l.preferences.length > 0 ? l.preferences.join(" · ") : "—",
    notasOperativas: l.itemNotes || "—",
    identidadItem: operationalItemIdentity(l.identity),
    tipoItem: l.identity.itemKind ?? "dish",
    estadoAlergenos: l.allergenSnapshotState ?? "HISTORICAL_UNAVAILABLE",
  }));
}

/**
 * Serializes the flat analytic matrix into CSV format (RFC 4180 compliant).
 */
export function exportToCSV(matrix: FlatAnalyticRow[]): string {
  const escapeCell = (val: string | number): string => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows: string[] = [CANONICAL_EXCEL_HEADERS.join(",")];

  for (const r of matrix) {
    const line = [
      escapeCell(r.fechaEntrega),
      escapeCell(r.municipio),
      escapeCell(r.canal),
      escapeCell(r.empresa),
      escapeCell(r.sede),
      escapeCell(r.unidadDepartamento),
      escapeCell(r.cliente),
      escapeCell(r.idPedido),
      escapeCell(r.plato),
      escapeCell(r.cantidad),
      escapeCell(r.alergiasSeguridad),
      escapeCell(r.modificaciones),
      escapeCell(r.preferencias),
      escapeCell(r.notasOperativas),
      escapeCell(r.identidadItem),
      escapeCell(r.tipoItem),
      escapeCell(r.estadoAlergenos),
    ];
    rows.push(line.join(","));
  }

  return rows.join("\n");
}

export interface ThermalLabelModel {
  itemIdentity: ItemIdentity;
  itemKind: "dish" | "custom";
  allergenState: AllergenSnapshotState;
  barcodeKey: string;
  orderId: string;
  customerName: string;
  dishName: string;
  portionIndex: number;
  deliveryDate: string;
  municipality: string;
  companyInfo: string | null;
  safetyTag: string | null;
  modificationTag: string | null;
}

/**
 * Builds thermal label feed (1 label per portion).
 */
export function buildThermalLabels(lines: NormalizedOperationalLine[]): ThermalLabelModel[] {
  return lines.map((l) => {
    const barcodeKey =
      l.identity.itemKind === "custom"
        ? `${operationalItemIdentity(l.identity)}:${l.identity.operationalDate}:${l.identity.portionIndex + 1}`
        : `${l.identity.orderId.slice(0, 8)}:${l.identity.orderItemId.slice(0, 6)}:${l.identity.portionIndex + 1}`;
    let safetyTag: string | null =
      l.identity.itemKind === "custom"
        ? "PERSONALIZADO · Alérgenos sin declarar · Receta no vinculada"
        : null;
    let modificationTag: string | null = null;

    if (l.criticalSafetyAllergens.length > 0) {
      safetyTag = `🔴 ALERGIA: ${l.criticalSafetyAllergens.join(", ").toUpperCase()}`;
    }
    if (l.identity.itemKind === "custom" && l.criticalSafetyAllergens.length > 0)
      safetyTag += " · PERSONALIZADO · Alérgenos sin declarar · Receta no vinculada";
    if (l.modifications.length > 0) {
      modificationTag = `🟡 MODIF: ${l.modifications.join(" · ")}`;
    }

    if (l.identity.itemKind !== "custom" && l.allergenSnapshotState !== "DECLARED") {
      const notice =
        l.allergenSnapshotState === "UNKNOWN"
          ? "Alérgenos sin declarar"
          : "Declaración histórica no disponible";
      safetyTag = safetyTag ? `${safetyTag} · ${notice}` : notice;
    }
    const companyInfo = l.companyName
      ? `${l.companyName} (${l.siteName ?? "Sede"} · ${l.organizationalUnitName ?? "Unidad"})`
      : null;

    return {
      barcodeKey,
      itemIdentity: operationalItemIdentity(l.identity),
      itemKind: l.identity.itemKind ?? "dish",
      allergenState: l.allergenSnapshotState ?? "HISTORICAL_UNAVAILABLE",
      orderId: l.identity.orderId,
      customerName: l.customerName,
      dishName: l.dishName,
      portionIndex: l.identity.portionIndex + 1,
      deliveryDate: l.identity.operationalDate,
      municipality: l.municipality,
      companyInfo,
      safetyTag,
      modificationTag,
    };
  });
}
