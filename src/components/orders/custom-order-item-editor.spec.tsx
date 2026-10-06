import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CustomOrderItemEditor } from "./custom-order-item-editor";
import { newCustomItemDraft } from "@/modules/orders/domain/custom-order-capture-draft";
describe("custom editor semantic presentation", () => {
  it("labels inputs and distinguishes UNKNOWN from recipe availability and catalogue", () => {
    const html = renderToStaticMarkup(
      <CustomOrderItemEditor
        draft={newCustomItemDraft("2026-10-06")}
        weekDays={["2026-10-06"]}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(html).toContain("UNKNOWN (desconocidos)");
    expect(html).toContain("NOT_AVAILABLE (no disponible)");
    expect(html).toContain("Descripción (opcional)");
    expect(html).toMatch(/for="[^"]+-name"/);
  });
  it("zero starts unconfirmed and editor respects locked state", () => {
    const html = renderToStaticMarkup(
      <CustomOrderItemEditor
        draft={{ ...newCustomItemDraft("2026-10-06"), price: "0" }}
        weekDays={["2026-10-06"]}
        disabled
        onChange={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(html).toContain("Confirmo expresamente el precio de 0");
    expect(html).toContain("disabled");
    expect(html).not.toContain('checked=""');
  });
});
