/**
 * AdminHeader — cabecera con etiquetas de intencionalidad (PRODUCT_RULES).
 * Muestra objetivo operacional · Capability · Core Object para trazabilidad
 * visible del OM en cada pantalla del panel.
 */
export function AdminHeader({
  goal,
  capability,
  object,
}: {
  goal?: string;
  capability?: string;
  object?: string;
}) {
  // Operational UX Rule: Internal architecture metadata (Capability, Core Object)
  // must remain in code/tests/docs but is not rendered in customer/operator-facing UI.
  return null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground shrink-0">
        {label}
      </span>
      <span className="text-xs font-semibold text-foreground truncate">{value}</span>
    </div>
  );
}
