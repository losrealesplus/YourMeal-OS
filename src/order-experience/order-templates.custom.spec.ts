import { afterEach, describe, expect, it } from "vitest";
import {
  clearOrderTemplatesForTests,
  listOrderTemplates,
  markTemplateUsed,
  saveOrderTemplate,
  templateSummary,
  type OrderTemplate,
} from "./order-templates";

afterEach(clearOrderTemplatesForTests);

describe("legacy template custom safeguards", () => {
  it("retains future snapshot objects but rejects apply before changing session state", () => {
    const custom = {
      dishId: null,
      kind: "custom",
      sourceOrderItemId: "source-uuid",
      name_snapshot: "Sopa personalizada",
      description_snapshot: "Nota",
      qty: 2,
      allergens_snapshot: [],
      allergen_state: "UNKNOWN",
      unit_price: 0,
    };
    const template = saveOrderTemplate({
      name: "Futura",
      customerId: "customer",
      customerKind: "individual",
      customerName: "Cliente",
      instructions: "",
      source: "from_order",
      items: [custom] as unknown as OrderTemplate["items"],
    });
    expect(listOrderTemplates()[0]?.items[0]).toEqual(custom);
    expect(templateSummary(template)).toContain("Sopa personalizada");
    expect(() => markTemplateUsed(template.id)).toThrow("writer v2 is not enabled");
    expect(listOrderTemplates()[0]?.useCount).toBe(0);
    expect(listOrderTemplates()[0]?.items[0]).toEqual(custom);
  });
  it("continues applying legacy Dish templates", () => {
    const template = saveOrderTemplate({
      name: "Legacy",
      customerId: "customer",
      customerKind: "individual",
      customerName: "Cliente",
      instructions: "",
      source: "manual",
      items: [{ dishId: "dish", label: "Plato", qty: 2 }],
    });
    expect(markTemplateUsed(template.id)?.useCount).toBe(1);
  });
});
