import React from "react";
import { createRoot } from "react-dom/client";
import { UniversalOrderIntakeDrawer } from "../../src/components/orders/universal-order-intake-drawer";
import { CanonicalOrderEditPanel } from "../../src/components/orders/canonical-order-edit-panel";
import "../../src/styles.css";
const params = new URLSearchParams(location.search);
export function Fixture() {
  const [open, setOpen] = React.useState(true);
  const [saved, setSaved] = React.useState("");
  return (
    <main>
      <p role="status">{saved}</p>
      {params.get("surface") === "edit" ? (
        <CanonicalOrderEditPanel
          orderId="60000000-0000-4000-8000-000000000001"
          channel="individual"
          onSuccess={() => setSaved("Guardado")}
        />
      ) : (
        <UniversalOrderIntakeDrawer
          open={open}
          onOpenChange={setOpen}
          preselectedCustomerId="30000000-0000-4000-8000-000000000001"
          preselectedCustomerName="Cliente sintético"
          preselectedWeekStart="2026-10-05"
          onSuccess={() => setSaved("Guardado")}
        />
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
