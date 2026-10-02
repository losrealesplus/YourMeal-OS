import { describe, it, expect } from "vitest";
import {
  EU_ALLERGENS,
  STANDARD_RESTRICTIONS,
  STANDARD_PREFERENCES,
  buildOrderDietarySnapshot,
  hasAllergenAlerts,
  hasDietaryData,
  resolveAllergenLabels,
  resolveRestrictionLabels,
  resolvePreferenceLabels,
  CONSTITUTIONAL_DIETARY_DISCLAIMER,
  type CustomerDietaryProfile,
} from "./dietary";

describe("CR-CUST-01 Dietary Domain & Taxonomy", () => {
  it("defines the exact EU-14 mandatory allergens taxonomy", () => {
    expect(EU_ALLERGENS).toHaveLength(14);
    const ids = EU_ALLERGENS.map((a) => a.id);
    expect(ids).toContain("gluten");
    expect(ids).toContain("peanuts");
    expect(ids).toContain("milk");
    expect(ids).toContain("fish");
    expect(ids).toContain("eggs");
    expect(ids).toContain("nuts");
    expect(ids).toContain("crustaceans");
    expect(ids).toContain("soy");
    expect(ids).toContain("celery");
    expect(ids).toContain("mustard");
    expect(ids).toContain("sesame");
    expect(ids).toContain("sulphites");
    expect(ids).toContain("lupin");
    expect(ids).toContain("molluscs");
  });

  it("resolves allergen labels accurately", () => {
    const labels = resolveAllergenLabels(["gluten", "nuts"], ["kiwi"]);
    expect(labels).toEqual(["Gluten", "Frutos de cáscara", "kiwi"]);
  });

  it("resolves restrictions and preference labels accurately", () => {
    expect(resolveRestrictionLabels(["celiac"])).toEqual(["Celíaco (Estricto sin trazas)"]);
    expect(resolvePreferenceLabels(["no_onion"])).toEqual(["Sin Cebolla"]);
  });

  it("identifies allergen alerts correctly", () => {
    expect(hasAllergenAlerts(null)).toBe(false);
    expect(hasAllergenAlerts({ tenantId: "t1", customerId: "c1", allergens: [], customAllergens: [], restrictions: [], preferences: [], dietaryNotes: null })).toBe(false);
    expect(hasAllergenAlerts({ tenantId: "t1", customerId: "c1", allergens: ["milk"], customAllergens: [], restrictions: [], preferences: [], dietaryNotes: null })).toBe(true);
    expect(hasAllergenAlerts({ tenantId: "t1", customerId: "c1", allergens: [], customAllergens: ["fresa"], restrictions: [], preferences: [], dietaryNotes: null })).toBe(true);
  });

  it("identifies presence of any dietary data", () => {
    expect(hasDietaryData(null)).toBe(false);
    expect(hasDietaryData({ tenantId: "t1", customerId: "c1", allergens: [], customAllergens: [], restrictions: [], preferences: [], dietaryNotes: "   " })).toBe(false);
    expect(hasDietaryData({ tenantId: "t1", customerId: "c1", allergens: [], customAllergens: [], restrictions: ["celiac"], preferences: [], dietaryNotes: null })).toBe(true);
    expect(hasDietaryData({ tenantId: "t1", customerId: "c1", allergens: [], customAllergens: [], restrictions: [], preferences: [], dietaryNotes: "Prefiere poca sal" })).toBe(true);
  });

  describe("buildOrderDietarySnapshot", () => {
    const mockProfile: CustomerDietaryProfile = {
      id: "dp-1",
      tenantId: "tenant-eatclean",
      customerId: "cust-1",
      allergens: ["gluten", "peanuts"],
      customAllergens: ["kiwi"],
      restrictions: ["celiac"],
      preferences: ["no_onion"],
      dietaryNotes: "Alérgica severa a frutos secos y kiwi",
    };

    it("captures customer profile cleanly when no override is provided", () => {
      const snapshot = buildOrderDietarySnapshot({
        customerProfile: mockProfile,
        authorUserId: "staff-123",
      });

      expect(snapshot).not.toBeNull();
      expect(snapshot?.allergens).toEqual(["gluten", "peanuts"]);
      expect(snapshot?.customAllergens).toEqual(["kiwi"]);
      expect(snapshot?.restrictions).toEqual(["celiac"]);
      expect(snapshot?.preferences).toEqual(["no_onion"]);
      expect(snapshot?.dietaryNotes).toBe("Alérgica severa a frutos secos y kiwi");
      expect(snapshot?.isOverride).toBe(false);
      expect(snapshot?.overrideReason).toBeNull();
      expect(snapshot?.authorUserId).toBe("staff-123");
      expect(snapshot?.capturedAt).toBeDefined();
    });

    it("applies order-level overrides without mutating original profile", () => {
      const snapshot = buildOrderDietarySnapshot({
        customerProfile: mockProfile,
        override: {
          allergens: ["gluten"], // removed peanuts for this order
          customAllergens: [],
          restrictions: ["celiac"],
          preferences: ["no_onion", "no_garlic"],
          dietaryNotes: "Pedido especial para invitado",
          overrideReason: "Cena compartida",
        },
        authorUserId: "staff-456",
      });

      expect(snapshot).not.toBeNull();
      expect(snapshot?.isOverride).toBe(true);
      expect(snapshot?.overrideReason).toBe("Cena compartida");
      expect(snapshot?.allergens).toEqual(["gluten"]);
      expect(snapshot?.customAllergens).toEqual([]);
      expect(snapshot?.preferences).toEqual(["no_onion", "no_garlic"]);
      expect(snapshot?.dietaryNotes).toBe("Pedido especial para invitado");

      // Original profile remains untouched
      expect(mockProfile.allergens).toEqual(["gluten", "peanuts"]);
      expect(mockProfile.customAllergens).toEqual(["kiwi"]);
    });

    it("returns null if customer profile is empty and no override provided", () => {
      const emptyProfile: CustomerDietaryProfile = {
        tenantId: "t1",
        customerId: "c2",
        allergens: [],
        customAllergens: [],
        restrictions: [],
        preferences: [],
        dietaryNotes: null,
      };

      const snapshot = buildOrderDietarySnapshot({
        customerProfile: emptyProfile,
      });

      expect(snapshot).toBeNull();
    });

    it("throws an error if an override is provided without a justification reason", () => {
      expect(() => {
        buildOrderDietarySnapshot({
          customerProfile: mockProfile,
          override: {
            allergens: ["gluten"],
            overrideReason: "",
          },
        });
      }).toThrow("Un override dietético requiere un motivo obligatorio (mínimo 5 caracteres).");
    });

    it("throws an error if override justification reason has fewer than 5 characters", () => {
      expect(() => {
        buildOrderDietarySnapshot({
          customerProfile: mockProfile,
          override: {
            dietaryNotes: "Notas temporales",
            overrideReason: "abc",
          },
        });
      }).toThrow("Un override dietético requiere un motivo obligatorio (mínimo 5 caracteres).");
    });
  });

  describe("Constitutional Food Safety Disclaimer", () => {
    it("exports the mandatory food safety constitutional disclaimer", () => {
      expect(CONSTITUTIONAL_DIETARY_DISCLAIMER).toBe(
        "El perfil dietético informa exclusivamente sobre las condiciones declaradas por el cliente; no certifica por sí mismo la ausencia de alérgenos ni la seguridad alimentaria de un plato."
      );
    });
  });
});

