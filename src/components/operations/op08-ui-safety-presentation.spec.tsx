import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DietaryBadges } from "./dietary-badges";
import { DishSafetyAlert, getCriticalAllergens } from "./dish-safety-alert";
import type { OrderDietarySnapshot } from "@/types/dietary";

/**
 * OP-08 UI Safety Presentation Test Suite
 * Validates uniform food safety presentations across Kitchen and Packaging dialogs:
 * 1. Critical allergy matching badge (🔴 ALERTA: ...)
 * 2. UNKNOWN allergen state (preserves unlinked recipe warning, never safe)
 * 3. Custom preparations (Custom badge + unlinked recipe warning)
 * 4. HISTORICAL_UNAVAILABLE state (shows historical unavailable notice)
 * 5. Declared allergens (renders allergen list)
 * 6. Custom preparations override DECLARED state (strict food safety for free items)
 * 7. Compact rendering for dense packaging cards
 */
describe("OP-08 UI Safety Presentation (DishSafetyAlert)", () => {
  it("renders critical allergy alert when dish allergen matches customer dietary snapshot", () => {
    const snapshot: OrderDietarySnapshot = {
      allergens: ["pescado", "marisco"],
      customAllergens: [],
      restrictions: [],
      preferences: [],
      dietaryNotes: null,
      overrideReason: null,
      isOverride: false,
      capturedAt: "2026-10-17T12:00:00Z",
      authorUserId: "user-1",
    };

    const matching = getCriticalAllergens(["Pescado"], snapshot.allergens);
    expect(matching).toEqual(["Pescado"]);

    const html = renderToStaticMarkup(
      <DishSafetyAlert
        allergens={["pescado"]}
        customerAllergens={snapshot.allergens}
      />,
    );

    expect(html).toContain("🔴 ALERTA: PESCADO");

    const badgesHtml = renderToStaticMarkup(<DietaryBadges snapshot={snapshot} compact />);
    expect(badgesHtml).toContain("pescado");
    expect(badgesHtml).toContain("marisco");
  });

  it("renders UNKNOWN allergen state as explicit warning and never as safe", () => {
    const html = renderToStaticMarkup(
      <DishSafetyAlert
        allergenState="UNKNOWN"
        isCustom={false}
      />,
    );

    expect(html).toContain("⚠️ Alérgenos sin declarar · Receta no vinculada");
    expect(html).not.toMatch(/sin alérgenos|libre de alérgenos|seguro|safe|allergen.free/i);
  });

  it("identifies custom items with Custom badge and unlinked recipe warning", () => {
    const html = renderToStaticMarkup(
      <DishSafetyAlert
        isCustom={true}
        showCustomBadge={true}
      />,
    );

    expect(html).toContain("Custom");
    expect(html).toContain("⚠️ Alérgenos sin declarar · Receta no vinculada");
  });

  it("handles HISTORICAL_UNAVAILABLE gracefully with historical notice", () => {
    const html = renderToStaticMarkup(
      <DishSafetyAlert
        allergenState="HISTORICAL_UNAVAILABLE"
        isCustom={false}
      />,
    );

    expect(html).toContain("Declaración histórica no disponible");
    expect(html).not.toContain("Alérgenos sin declarar");
    expect(html).not.toContain("Custom");
  });

  it("renders declared allergens accurately when present", () => {
    const html = renderToStaticMarkup(
      <DishSafetyAlert
        allergenState="DECLARED"
        allergens={["gluten", "huevos"]}
      />,
    );

    expect(html).toContain("Alérgenos: gluten, huevos");
  });

  it("ensures custom items ALWAYS show unlinked recipe warning even if allergenState is DECLARED", () => {
    const html = renderToStaticMarkup(
      <DishSafetyAlert
        isCustom={true}
        allergenState="DECLARED"
        allergens={["apio"]}
      />,
    );

    expect(html).toContain("⚠️ Alérgenos sin declarar · Receta no vinculada");
  });

  it("supports compact rendering for dense packaging cards", () => {
    const html = renderToStaticMarkup(
      <DishSafetyAlert
        allergenState="UNKNOWN"
        compact={true}
      />,
    );

    expect(html).toContain("text-[11px]");
    expect(html).toContain("⚠️ Alérgenos sin declarar · Receta no vinculada");
  });
});
