/**
 * CR-CUST-01: Customer Dietary Preferences, Restrictions & Allergen Domain Model
 * Defines the canonical EU 14 allergens taxonomy, customer dietary profile contracts,
 * and immutable order dietary snapshots for operational surfaces.
 */

export interface EUAllergenDef {
  id: string;
  code: string;
  label: string;
  enLabel: string;
}

/** Canonical European Union 14 mandatory allergens (Regulation (EU) No 1169/2011) */
export const EU_ALLERGENS: readonly EUAllergenDef[] = [
  { id: "gluten", code: "GLU", label: "Gluten", enLabel: "Gluten" },
  { id: "crustaceans", code: "CRU", label: "Crustáceos", enLabel: "Crustaceans" },
  { id: "eggs", code: "EGG", label: "Huevos", enLabel: "Eggs" },
  { id: "fish", code: "FSH", label: "Pescado", enLabel: "Fish" },
  { id: "peanuts", code: "PNT", label: "Cacahuetes", enLabel: "Peanuts" },
  { id: "soy", code: "SOY", label: "Soja", enLabel: "Soybeans" },
  { id: "milk", code: "MLK", label: "Lácteos", enLabel: "Milk / Dairy" },
  { id: "nuts", code: "NUT", label: "Frutos de cáscara", enLabel: "Tree nuts" },
  { id: "celery", code: "CEL", label: "Apio", enLabel: "Celery" },
  { id: "mustard", code: "MST", label: "Mostaza", enLabel: "Mustard" },
  { id: "sesame", code: "SES", label: "Sésamo", enLabel: "Sesame seeds" },
  { id: "sulphites", code: "SO2", label: "Sulfitos", enLabel: "Sulphur dioxide / Sulphites" },
  { id: "lupin", code: "LUP", label: "Altramuces", enLabel: "Lupin" },
  { id: "molluscs", code: "MOL", label: "Moluscos", enLabel: "Molluscs" },
] as const;

/** Standard Dietary Restrictions (Intolerances / Medical & Nutritional Regimens) */
export interface StandardDietaryRestrictionDef {
  id: string;
  label: string;
  severity: "medium" | "high";
}

export const STANDARD_RESTRICTIONS: readonly StandardDietaryRestrictionDef[] = [
  { id: "celiac", label: "Celíaco (Estricto sin trazas)", severity: "high" },
  { id: "lactose_intolerance", label: "Intolerancia a la Lactosa", severity: "medium" },
  { id: "low_sodium", label: "Bajo en Sodio / Hipertensión", severity: "medium" },
  { id: "diabetic_friendly", label: "Apto para Diabéticos / Bajo IG", severity: "medium" },
  { id: "fructose_intolerance", label: "Intolerancia a la Fructosa", severity: "medium" },
] as const;

/** Standard Culinary Preferences (Likes, Exclusions & Lifestyle) */
export interface StandardPreferenceDef {
  id: string;
  label: string;
}

export const STANDARD_PREFERENCES: readonly StandardPreferenceDef[] = [
  { id: "vegetarian", label: "Vegetariano" },
  { id: "vegan", label: "Vegano" },
  { id: "pescatarian", label: "Pescetariano" },
  { id: "keto", label: "Keto / Cetogénico" },
  { id: "no_pork", label: "Sin Cerdo" },
  { id: "no_onion", label: "Sin Cebolla" },
  { id: "no_garlic", label: "Sin Ajo" },
  { id: "no_spicy", label: "Sin Picante" },
  { id: "no_coriander", label: "Sin Cilantro" },
] as const;

/** Living customer dietary profile stored in DB */
export interface CustomerDietaryProfile {
  id?: string;
  tenantId: string;
  customerId: string;
  allergens: string[]; // standard EU allergen IDs
  customAllergens: string[]; // free-tag strings (e.g. "kiwi", "fresa")
  restrictions: string[]; // standard or custom restriction keys
  preferences: string[]; // standard or custom preference keys
  dietaryNotes: string | null; // free text operational context
  createdAt?: string;
  updatedAt?: string;
}

/** Immutable order-level snapshot captured at order creation */
export interface OrderDietarySnapshot {
  capturedAt: string;
  allergens: string[];
  customAllergens: string[];
  restrictions: string[];
  preferences: string[];
  dietaryNotes: string | null;
  isOverride: boolean;
  overrideReason?: string | null;
  authorUserId?: string | null;
}

/** Input DTO for saving/updating a customer's dietary profile */
export interface SaveCustomerDietaryProfileDTO {
  customerId: string;
  allergens: string[];
  customAllergens?: string[];
  restrictions?: string[];
  preferences?: string[];
  dietaryNotes?: string | null;
}

/** Helper to check if a profile or snapshot has any allergen warnings */
export function hasAllergenAlerts(
  profileOrSnapshot: CustomerDietaryProfile | OrderDietarySnapshot | null | undefined
): boolean {
  if (!profileOrSnapshot) return false;
  return (
    (profileOrSnapshot.allergens && profileOrSnapshot.allergens.length > 0) ||
    (profileOrSnapshot.customAllergens && profileOrSnapshot.customAllergens.length > 0)
  );
}

/** Helper to check if profile has any dietary data at all */
export function hasDietaryData(
  profileOrSnapshot: CustomerDietaryProfile | OrderDietarySnapshot | null | undefined
): boolean {
  if (!profileOrSnapshot) return false;
  return (
    hasAllergenAlerts(profileOrSnapshot) ||
    (profileOrSnapshot.restrictions && profileOrSnapshot.restrictions.length > 0) ||
    (profileOrSnapshot.preferences && profileOrSnapshot.preferences.length > 0) ||
    Boolean(profileOrSnapshot.dietaryNotes && profileOrSnapshot.dietaryNotes.trim().length > 0)
  );
}

/** Formats allergen labels into human readable string array */
export function resolveAllergenLabels(
  allergenIds: readonly string[],
  customAllergens: readonly string[] = []
): string[] {
  const standardLabels = allergenIds.map((id) => {
    const found = EU_ALLERGENS.find((a) => a.id === id);
    return found ? found.label : id;
  });
  return [...standardLabels, ...customAllergens];
}

/** Formats restrictions into human readable string array */
export function resolveRestrictionLabels(restrictionIds: readonly string[]): string[] {
  return restrictionIds.map((id) => {
    const found = STANDARD_RESTRICTIONS.find((r) => r.id === id);
    return found ? found.label : id;
  });
}

/** Formats preferences into human readable string array */
export function resolvePreferenceLabels(preferenceIds: readonly string[]): string[] {
  return preferenceIds.map((id) => {
    const found = STANDARD_PREFERENCES.find((p) => p.id === id);
    return found ? found.label : id;
  });
}

/** Constitutional food safety disclaimer mandated by Scope Lock */
export const CONSTITUTIONAL_DIETARY_DISCLAIMER =
  "El perfil dietético informa exclusivamente sobre las condiciones declaradas por el cliente; no certifica por sí mismo la ausencia de alérgenos ni la seguridad alimentaria de un plato.";

/** Creates an immutable OrderDietarySnapshot from customer profile + optional override */
export function buildOrderDietarySnapshot(params: {
  customerProfile: CustomerDietaryProfile | null | undefined;
  override?: {
    allergens?: string[];
    customAllergens?: string[];
    restrictions?: string[];
    preferences?: string[];
    dietaryNotes?: string | null;
    overrideReason?: string | null;
  } | null;
  authorUserId?: string | null;
}): OrderDietarySnapshot | null {
  const { customerProfile, override, authorUserId } = params;

  if (!customerProfile && !override) {
    return null;
  }

  const isOverride = Boolean(
    override &&
      (override.allergens !== undefined ||
        override.customAllergens !== undefined ||
        override.restrictions !== undefined ||
        override.preferences !== undefined ||
        override.dietaryNotes !== undefined)
  );

  // Scope Lock Rule 3: Override requires mandatory justification reason (min 5 chars)
  if (isOverride) {
    const reason = override?.overrideReason?.trim();
    if (!reason || reason.length < 5) {
      throw new Error(
        "Un override dietético requiere un motivo obligatorio (mínimo 5 caracteres)."
      );
    }
  }

  const allergens = isOverride && override?.allergens !== undefined
    ? override.allergens
    : customerProfile?.allergens ?? [];

  const customAllergens = isOverride && override?.customAllergens !== undefined
    ? override.customAllergens
    : customerProfile?.customAllergens ?? [];

  const restrictions = isOverride && override?.restrictions !== undefined
    ? override.restrictions
    : customerProfile?.restrictions ?? [];

  const preferences = isOverride && override?.preferences !== undefined
    ? override.preferences
    : customerProfile?.preferences ?? [];

  const dietaryNotes = isOverride && override?.dietaryNotes !== undefined
    ? override.dietaryNotes
    : customerProfile?.dietaryNotes ?? null;

  // If completely empty across all fields, return null to avoid storing blank objects
  if (
    allergens.length === 0 &&
    customAllergens.length === 0 &&
    restrictions.length === 0 &&
    preferences.length === 0 &&
    (!dietaryNotes || dietaryNotes.trim().length === 0)
  ) {
    return null;
  }

  return {
    capturedAt: new Date().toISOString(),
    allergens: [...allergens],
    customAllergens: [...customAllergens],
    restrictions: [...restrictions],
    preferences: [...preferences],
    dietaryNotes: dietaryNotes ? dietaryNotes.trim() : null,
    isOverride,
    overrideReason: isOverride ? override!.overrideReason!.trim() : null,
    authorUserId: authorUserId ?? null,
  };
}
