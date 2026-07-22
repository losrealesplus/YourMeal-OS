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
  goal: string;
  capability: string;
  object: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3 mb-6 border-b border-dashed border-border pb-4">
      <Row label="Objetivo" value={goal} />
      <Row label="Capability" value={capability} />
      <Row label="Core Object" value={object} />
    </div>
  );
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
