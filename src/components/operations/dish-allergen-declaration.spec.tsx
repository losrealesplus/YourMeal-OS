import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DishAllergenDeclaration } from "./dish-allergen-declaration";
import { getAllergenDeclarationStatus } from "@/modules/dish-library/domain/policies/allergen-declaration";

describe("dish allergen declaration semantics", () => {
  it.each([null, undefined, []])("treats missing declarations as unknown: %j", (allergens) => {
    expect(getAllergenDeclarationStatus(allergens)).toBe("UNKNOWN");
    const html = renderToStaticMarkup(<DishAllergenDeclaration allergens={allergens} />);
    expect(html).toContain('data-allergen-declaration="UNKNOWN"');
    expect(html).toContain("Alérgenos sin declarar");
    expect(html).not.toMatch(/sin alérgenos|libre de alérgenos|allergen.free|VERIFIED/i);
  });
  it("preserves declarations without presenting them as verified", () => {
    const allergens = Object.freeze(["gluten", "milk"]);
    expect(getAllergenDeclarationStatus(allergens)).toBe("DECLARED");
    expect(renderToStaticMarkup(<DishAllergenDeclaration allergens={allergens} />)).toBe("");
    const html = renderToStaticMarkup(
      <DishAllergenDeclaration allergens={allergens} showDeclared />,
    );
    expect(html).toContain('data-allergen-declaration="DECLARED"');
    expect(html).toContain("Alérgenos declarados:");
    expect(html).not.toContain("VERIFIED");
    expect(allergens).toEqual(["gluten", "milk"]);
  });
});
