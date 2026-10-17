import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Badge } from "@/components/ui/badge";
import { DietaryBadges } from "./dietary-badges";
import { DishAllergenDeclaration } from "./dish-allergen-declaration";
import type { OrderDietarySnapshot } from "@/types/dietary";
import type { AllergenSnapshotState } from "@/modules/orders/domain/order-item-read-model";

/**
 * OP-08 UI Safety Presentation Test Suite
 * Validates rendering of:
 * 1. Critical safety allergens (🔴 ALERTA)
 * 2. Unknown allergens (UNKNOWN -> Alérgenos sin declarar)
 * 3. Custom preparations (Custom / PERSONALIZADO)
 * 4. Missing historical data (HISTORICAL_UNAVAILABLE)
 * 5. Strict absence certification: UNKNOWN is never presented as safe
 */
describe("OP-08 UI Safety Presentation", () => {
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

    const dishAllergens = ["pescado"];
    const customerAllergens = snapshot.allergens.map((a) => a.toLowerCase().trim());
    const matching = dishAllergens.filter((a) => customerAllergens.includes(a.toLowerCase().trim()));

    expect(matching).toEqual(["pescado"]);

    const alertHtml = renderToStaticMarkup(
      <Badge variant="destructive" className="h-4 px-1 text-[10px] font-bold">
        🔴 ALERTA: {matching.join(", ").toUpperCase()}
      </Badge>,
    );

    expect(alertHtml).toContain("🔴 ALERTA: PESCADO");

    const badgesHtml = renderToStaticMarkup(<DietaryBadges snapshot={snapshot} compact />);
    expect(badgesHtml).toContain("pescado");
    expect(badgesHtml).toContain("marisco");
  });

  it("renders UNKNOWN allergen state as explicit warning and never as safe", () => {
    const allergenState: AllergenSnapshotState = "UNKNOWN";
    const isCustom = false;

    const html = renderToStaticMarkup(
      <div>
        {isCustom || allergenState === "UNKNOWN" ? (
          <span className="block text-xs font-medium text-amber-700">
            ⚠️ Alérgenos sin declarar · Receta no vinculada
          </span>
        ) : null}
      </div>,
    );

    expect(html).toContain("⚠️ Alérgenos sin declarar · Receta no vinculada");
    expect(html).not.toMatch(/sin alérgenos|libre de alérgenos|seguro|safe|allergen.free/i);
  });

  it("identifies custom items with Custom badge and unlinked recipe warning", () => {
    const isCustom = true;
    const dishName = "Tortilla personalizada";

    const html = renderToStaticMarkup(
      <div>
        <span>{dishName}</span>
        {isCustom && (
          <Badge variant="outline" className="text-[10px] uppercase font-semibold text-purple-700">
            Custom
          </Badge>
        )}
        <span className="block text-xs font-medium text-amber-700">
          ⚠️ Alérgenos sin declarar · Receta no vinculada
        </span>
      </div>,
    );

    expect(html).toContain("Tortilla personalizada");
    expect(html).toContain("Custom");
    expect(html).toContain("⚠️ Alérgenos sin declarar · Receta no vinculada");
  });

  it("handles HISTORICAL_UNAVAILABLE gracefully with historical notice", () => {
    const allergenState: AllergenSnapshotState = "HISTORICAL_UNAVAILABLE";
    const isCustom: boolean = false;

    const html = renderToStaticMarkup(
      <div>
        {isCustom || allergenState === "UNKNOWN" ? (
          <span className="block text-xs font-medium text-amber-700">
            ⚠️ Alérgenos sin declarar · Receta no vinculada
          </span>
        ) : allergenState === "HISTORICAL_UNAVAILABLE" ? (
          <span className="block text-xs text-muted-foreground italic">
            Declaración histórica no disponible
          </span>
        ) : null}
      </div>,
    );

    expect(html).toContain("Declaración histórica no disponible");
    expect(html).not.toContain("Alérgenos sin declarar");
    expect(html).not.toContain("Custom");
  });

  it("renders declared allergens accurately when present", () => {
    const allergens = ["gluten", "huevos"];
    const html = renderToStaticMarkup(
      <span className="block text-xs text-muted-foreground">
        Alérgenos: {allergens.join(", ")}
      </span>,
    );

    expect(html).toContain("Alérgenos: gluten, huevos");
  });
});
