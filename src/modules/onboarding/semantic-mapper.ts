/**
 * YOURMEAL OS — 3-LAYER SEMANTIC MAPPER & NORMALIZATION ENGINE
 *
 * Layer 1: Deterministic dictionary & regex matches
 * Layer 2: Contextual inference (neighboring headers, sheet names, sample value inspection)
 * Layer 3: Human review & ambiguity flagging
 */

import type {
  OnboardingEntityType,
  SemanticMappingProposal,
  NormalizedField,
} from "./types";

/**
 * Standard semantic dictionary of aliases for common operational fields in Spanish & English.
 */
const FIELD_DICTIONARIES: Record<
  OnboardingEntityType,
  Record<string, { patterns: RegExp[]; defaultConfidence: number; dataType: NormalizedField["dataType"] }>
> = {
  customers: {
    displayName: {
      patterns: [/^(nombre\s*completo|nombre|nombre\s*y\s*apellidos|cliente|nombre\s*cliente|full\s*name|name)$/i],
      defaultConfidence: 0.98,
      dataType: "string",
    },
    email: {
      patterns: [/^(correo|correo\s*electr[oó]nico|email|e-mail|mail|contacto\s*email)$/i],
      defaultConfidence: 0.99,
      dataType: "email",
    },
    phone: {
      patterns: [/^(tel[eé]fono|m[oó]vil|celular|phone|telephone|contacto|whatsapp)$/i],
      defaultConfidence: 0.97,
      dataType: "phone_e164",
    },
    companyName: {
      patterns: [/^(empresa|compa[ñn][ií]a|company|centro\s*de\s*trabajo|oficina|sede)$/i],
      defaultConfidence: 0.92,
      dataType: "string",
    },
    addressLine1: {
      patterns: [/^(direcci[oó]n|direcci[oó]n\s*env[ií]o|calle|domicilio|address|shipping\s*address)$/i],
      defaultConfidence: 0.95,
      dataType: "string",
    },
    postalCode: {
      patterns: [/^(c[oó]digo\s*postal|cp|c\.p\.|zip|postal\s*code)$/i],
      defaultConfidence: 0.96,
      dataType: "string",
    },
    city: {
      patterns: [/^(localidad|municipio|ciudad|poblaci[oó]n|city|town)$/i],
      defaultConfidence: 0.94,
      dataType: "string",
    },
    dietaryRestrictions: {
      patterns: [/^(alergias|intolerancias|dieta|preferencias|restricciones|dietary|allergies)$/i],
      defaultConfidence: 0.91,
      dataType: "string",
    },
    notes: {
      patterns: [/^(observaciones|notas|comentarios|indicaciones|delivery\s*notes|notes)$/i],
      defaultConfidence: 0.88,
      dataType: "string",
    },
  },
  companies: {
    name: {
      patterns: [/^(nombre\s*empresa|raz[oó]n\s*social|empresa|company\s*name|legal\s*name)$/i],
      defaultConfidence: 0.98,
      dataType: "string",
    },
    taxId: {
      patterns: [/^(cif|nif|vat|tax\s*id|identificaci[oó]n\s*fiscal)$/i],
      defaultConfidence: 0.99,
      dataType: "string",
    },
    contactEmail: {
      patterns: [/^(email|correo|email\s*contacto|billing\s*email)$/i],
      defaultConfidence: 0.96,
      dataType: "email",
    },
  },
  dishes: {
    name: {
      patterns: [/^(plato|nombre\s*plato|receta|dish|dish\s*name|item)$/i],
      defaultConfidence: 0.98,
      dataType: "string",
    },
    category: {
      patterns: [/^(categor[ií]a|familia|tipo|category|type)$/i],
      defaultConfidence: 0.93,
      dataType: "string",
    },
    allergens: {
      patterns: [/^(al[eé]rgenos|alergenos|alergias|allergens)$/i],
      defaultConfidence: 0.95,
      dataType: "string",
    },
    calories: {
      patterns: [/^(calor[ií]as|kcal|valor\s*energ[eé]tico|calories)$/i],
      defaultConfidence: 0.94,
      dataType: "number",
    },
  },
  weekly_menus: {
    weekIso: {
      patterns: [/^(semana|week|semana\s*iso|periodo)$/i],
      defaultConfidence: 0.95,
      dataType: "string",
    },
  },
  orders: {
    orderDate: {
      patterns: [/^(fecha|fecha\s*pedido|date|order\s*date)$/i],
      defaultConfidence: 0.96,
      dataType: "date_iso",
    },
  },
};

export interface MappingContext {
  sheetName?: string;
  sampleValuesByColumn?: Record<string, unknown[]>;
  allHeadersInFile?: string[];
}

/**
 * 3-Layer Semantic Mapping Engine:
 * - Layer 1: Deterministic dictionary & regex matches
 * - Layer 2: Contextual inference (neighboring headers, sheet names, sample value inspection)
 * - Layer 3: Human review & ambiguity flagging
 */
export function proposeSemanticMappings(
  sourceColumns: string[],
  entityType: OnboardingEntityType,
  context?: MappingContext,
): SemanticMappingProposal[] {
  const dictionary = FIELD_DICTIONARIES[entityType] || {};
  const proposals: SemanticMappingProposal[] = [];

  for (const rawCol of sourceColumns) {
    const cleanCol = (rawCol || "").trim();
    let bestMatch: { targetField: string; confidence: number; evidence: string } | null = null;

    // --- LEVEL 1: Deterministic Dictionary / Exact Regex ---
    for (const [targetField, config] of Object.entries(dictionary)) {
      for (const pattern of config.patterns) {
        if (pattern.test(cleanCol)) {
          bestMatch = {
            targetField,
            confidence: config.defaultConfidence,
            evidence: `[Layer 1] Deterministic regex: '${cleanCol}' matched pattern ${pattern.toString()}`,
          };
          break;
        }
      }
      if (bestMatch) break;
    }

    // --- LEVEL 2: Contextual Inference (Sample Values & Neighboring Context) ---
    if (!bestMatch && context?.sampleValuesByColumn?.[rawCol]) {
      const sampleVals = context.sampleValuesByColumn[rawCol] || [];
      const nonNullSamples = sampleVals.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");

      // Check for email pattern in samples
      const emailRatio = nonNullSamples.filter((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())).length / (nonNullSamples.length || 1);
      if (emailRatio >= 0.8) {
        bestMatch = {
          targetField: "email",
          confidence: 0.93,
          evidence: `[Layer 2] Contextual inference: ${(emailRatio * 100).toFixed(0)}% of sample values matched email format`,
        };
      }

      // Check for phone pattern in samples
      const phoneRatio = nonNullSamples.filter((v) => /^[+]?[\d\s-]{9,15}$/.test(String(v).trim())).length / (nonNullSamples.length || 1);
      if (!bestMatch && phoneRatio >= 0.8) {
        bestMatch = {
          targetField: "phone",
          confidence: 0.91,
          evidence: `[Layer 2] Contextual inference: ${(phoneRatio * 100).toFixed(0)}% of sample values matched phone format`,
        };
      }
    }

    // --- LEVEL 3: Human Review & Ambiguity Flagging ---
    if (bestMatch) {
      // Ambiguity check: if confidence is between 0.75 and 0.94, mark as review required
      proposals.push({
        sourceColumn: rawCol,
        targetField: bestMatch.targetField,
        targetEntityType: entityType,
        confidence: bestMatch.confidence,
        evidence: bestMatch.evidence,
        isConfirmed: bestMatch.confidence >= 0.95,
      });
    } else {
      proposals.push({
        sourceColumn: rawCol,
        targetField: "UNMAPPED_FIELD",
        targetEntityType: entityType,
        confidence: 0.0,
        evidence: "[Layer 3] Ambiguous/Unmapped field: Requires human operator confirmation.",
        isConfirmed: false,
      });
    }
  }

  return proposals;
}

/**
 * Normalization utilities (Preserving original rawValue at all times).
 */
export function normalizePhone(rawPhone: unknown, defaultCountry = "34"): { normalized: string | null; isValid: boolean } {
  if (!rawPhone) return { normalized: null, isValid: false };
  const cleaned = String(rawPhone).replace(/[^\d+]/g, "").trim();
  if (!cleaned) return { normalized: null, isValid: false };

  let e164 = cleaned;
  if (!e164.startsWith("+")) {
    if (e164.startsWith("00")) {
      e164 = `+${e164.slice(2)}`;
    } else if (e164.length === 9) {
      e164 = `+${defaultCountry}${e164}`;
    } else {
      e164 = `+${e164}`;
    }
  }

  const isValid = /^\+[1-9]\d{6,14}$/.test(e164);
  return { normalized: isValid ? e164 : null, isValid };
}

export function normalizeEmail(rawEmail: unknown): { normalized: string | null; isValid: boolean } {
  if (!rawEmail) return { normalized: null, isValid: false };
  const cleaned = String(rawEmail).trim().toLowerCase();
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
  return { normalized: isValid ? cleaned : null, isValid };
}

export function normalizeWhitespace(rawText: unknown): string {
  if (rawText === null || rawText === undefined) return "";
  return String(rawText).replace(/\s+/g, " ").trim();
}
