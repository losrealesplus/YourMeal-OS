import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CustomOperationalContext,
  OperationalAllergenDeclaration,
} from "./operational-item-presentation";
import { isCustomOperationalItem, operationalItemIdentity } from "./operational-item-identity";

describe("native custom operational presentation", () => {
  it("distinguishes unknown, historical absence and captured declaration in printed output", () => {
    expect(
      renderToStaticMarkup(
        <OperationalAllergenDeclaration item={{ allergens: [], allergenState: "UNKNOWN" }} />,
      ),
    ).toContain("Alérgenos sin declarar");
    expect(
      renderToStaticMarkup(
        <OperationalAllergenDeclaration
          item={{ allergens: ["gluten"], allergenState: "HISTORICAL_UNAVAILABLE" }}
        />,
      ),
    ).toContain("Declaración histórica no disponible");
    expect(
      renderToStaticMarkup(
        <OperationalAllergenDeclaration
          item={{ allergens: ["gluten"], allergenState: "DECLARED" }}
          showDeclared
        />,
      ),
    ).toContain("Alérgenos declarados");
    expect(
      renderToStaticMarkup(
        <OperationalAllergenDeclaration
          item={{ allergens: ["gluten"], allergenState: "UNKNOWN", kind: "custom" }}
          showDeclared
        />,
      ),
    ).toContain("Alérgenos sin declarar");
  });
  it("rejects incoherent prefixes, sentinel IDs and mismatched source identity", () => {
    for (const item of [
      { dishId: null, itemIdentity: "dish:null" },
      { dishId: null, itemIdentity: "custom:null" },
      { dishId: null, itemIdentity: "custom:undefined" },
      { dishId: "dish", itemIdentity: "custom:source" },
      { dishId: "dish", itemIdentity: "dish:other" },
      { dishId: "null" },
      { dishId: null, itemIdentity: "custom:source", orderItemId: "different" },
    ])
      expect(() => operationalItemIdentity(item)).toThrow("CUSTOM_OPERATIONAL_IDENTITY_REQUIRED");
  });
  it("keeps same-name custom lines distinct and distinct from a Dish", () => {
    const first = { dishId: null, itemIdentity: "custom:first", kind: "custom" as const };
    const second = { dishId: null, itemIdentity: "custom:second", kind: "custom" as const };
    expect(operationalItemIdentity(first)).not.toBe(operationalItemIdentity(second));
    expect(operationalItemIdentity(first)).not.toBe(operationalItemIdentity({ dishId: "first" }));
    expect(isCustomOperationalItem(first)).toBe(true);
    expect(isCustomOperationalItem({ dishId: "first" })).toBe(false);
  });

  it("fails closed for a missing custom identity", () => {
    expect(() => operationalItemIdentity({ dishId: null })).toThrow(
      "CUSTOM_OPERATIONAL_IDENTITY_REQUIRED",
    );
    expect(() => operationalItemIdentity({ dishId: "dish", kind: "custom" })).toThrow(
      "CUSTOM_OPERATIONAL_IDENTITY_REQUIRED",
    );
  });

  it("keeps marker, recipe absence and identity visible in printable markup", () => {
    const html = renderToStaticMarkup(
      <CustomOperationalContext item={{ dishId: null, itemIdentity: "custom:first" }} />,
    );
    expect(html).toContain("PERSONALIZADO");
    expect(html).toContain("Receta no vinculada");
    expect(html).toContain("custom:first");
    expect(html).not.toContain("SIN ALÉRGENOS");
    expect(renderToStaticMarkup(<CustomOperationalContext item={{ dishId: "dish" }} />)).toBe("");
  });
});
