import type {
  DraftMenuPresentation,
  PresentedSlot,
} from "@/modules/weekly-menu/presentation/draft-menu-presentation";
/** Lab-only read projection. No route, requests, write actions or order commands. */
export function DraftMenuPreview({
  preview,
  formatPrice,
}: {
  preview: DraftMenuPresentation;
  formatPrice: (value: number) => string;
}) {
  const slots = (items: PresentedSlot[]) =>
    items.map((item) => (
      <li key={item.offer.slotId} data-slot-id={item.offer.slotId} data-dish-id={item.offer.dishId}>
        <strong>{[item.label, item.categoryLabel].filter(Boolean).join(" · ")}</strong>
        <span> {item.dish.name}</span>
        <span> — {formatPrice(item.offer.effectivePrice)}</span>
      </li>
    ));
  return (
    <section aria-label="Preview aislada de menú" className="space-y-4">
      <h1>Preview de borrador · sin publicación</h1>
      {preview.issues.length > 0 && (
        <aside aria-label="Validación del borrador">
          <h2>Revisar antes de publicar</h2>
          <ul>
            {preview.issues.map((issue, i) => (
              <li key={`${i}:${issue}`}>{issue}</li>
            ))}
          </ul>
        </aside>
      )}
      <ul aria-label="Platillos">{slots(preview.primary)}</ul>
      {preview.extras.length > 0 && (
        <>
          <h2>Extras</h2>
          <ul aria-label="Extras">{slots(preview.extras)}</ul>
        </>
      )}
      {preview.unassigned.length > 0 && (
        <>
          <h2>Sin asignación</h2>
          <ul>{slots(preview.unassigned)}</ul>
        </>
      )}
    </section>
  );
}
