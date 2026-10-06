import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  updateCustomDraft,
  type CustomItemDraft,
} from "@/modules/orders/domain/custom-order-capture-draft";

export function CustomOrderItemEditor({
  draft,
  weekDays,
  disabled = false,
  onChange,
  onRemove,
}: {
  draft: CustomItemDraft;
  weekDays: string[];
  disabled?: boolean;
  onChange: (draft: CustomItemDraft) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const change = (patch: Partial<CustomItemDraft>) => onChange(updateCustomDraft(draft, patch));
  return (
    <fieldset disabled={disabled} className="min-w-0 rounded-lg border p-3 space-y-3">
      <legend className="px-1">
        <Badge variant="outline">Personalizado</Badge>
      </legend>
      <p className="text-xs text-muted-foreground">
        Solo pertenece a este pedido. Alérgenos: UNKNOWN (desconocidos). Receta: NOT_AVAILABLE (no
        disponible).
      </p>
      <div>
        <Label htmlFor={`${id}-name`}>Nombre</Label>
        <Input
          id={`${id}-name`}
          autoComplete="off"
          required
          maxLength={200}
          value={draft.name}
          onChange={(e) => change({ name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor={`${id}-description`}>Descripción (opcional)</Label>
        <Input
          id={`${id}-description`}
          maxLength={2000}
          value={draft.description}
          onChange={(e) => change({ description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
        <div>
          <Label htmlFor={`${id}-qty`}>Cantidad</Label>
          <Input
            id={`${id}-qty`}
            type="number"
            min={1}
            max={2147483647}
            step={1}
            value={Number.isNaN(draft.qty) ? "" : draft.qty}
            onChange={(e) => change({ qty: e.target.valueAsNumber })}
          />
        </div>
        <div>
          <Label htmlFor={`${id}-price`}>Precio unidad (€)</Label>
          <Input
            id={`${id}-price`}
            inputMode="decimal"
            required
            value={draft.price}
            onChange={(e) => change({ price: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor={`${id}-date`}>Fecha entrega</Label>
          <select
            id={`${id}-date`}
            className="h-10 w-full min-w-0 rounded-md border bg-background px-2"
            value={draft.dayDate}
            onChange={(e) => change({ dayDate: e.target.value })}
          >
            {weekDays.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/^0(?:[.,]0{1,4})?$/.test(draft.price.trim()) && (
        <label className="flex gap-2 items-start">
          <input
            type="checkbox"
            checked={draft.explicitZeroConfirmed}
            onChange={(e) => onChange({ ...draft, explicitZeroConfirmed: e.target.checked })}
          />
          Confirmo expresamente el precio de 0 €.
        </label>
      )}
      {draft.repeatProposal && (
        <div className="space-y-2" role="group" aria-label="Reconfirmación del personalizado">
          <p className="text-xs">
            Introduce el precio actual; el precio histórico no se reutiliza.
          </p>
          {(
            [
              ["availabilityConfirmed", "Confirmo la disponibilidad actual"],
              ["preparationConfirmed", "Confirmo la preparación y la intención actual"],
              ["priceConfirmed", "Confirmo el precio actual"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex gap-2 items-start">
              <input
                type="checkbox"
                checked={draft[key] === true}
                onChange={(e) => onChange({ ...draft, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={(event) => {
          const sibling = event.currentTarget.closest("fieldset")?.nextElementSibling;
          const focusTarget = sibling?.matches("button,input")
            ? (sibling as HTMLElement)
            : sibling?.querySelector<HTMLElement>("input,button");
          onRemove();
          requestAnimationFrame(() => focusTarget?.focus());
        }}
        aria-label={`Retirar personalizado ${draft.name || "sin nombre"}`}
      >
        Retirar línea
      </Button>
    </fieldset>
  );
}
