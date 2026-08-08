/**
 * ME004 — Dish Library picker for weekly planning (Experience only).
 *
 * Find → preview → insert/replace → continue planning.
 * Libraries are where knowledge is reused — not where work lives.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { StatusChip } from "@/components/admin";
import {
  availabilityLabel,
  completenessLabel,
  markDishUsed,
  rankDishLibrary,
  toDishPick,
  type DishLibraryItem,
} from "@/menu-experience/dish-library";
import type { DishPick } from "@/menu-experience/MenuPlanningPanel";
import { cn } from "@/lib/utils";

type Mode = "insert" | "replace";

type Props = {
  items: DishLibraryItem[];
  mode: Mode;
  title?: string;
  canWrite: boolean;
  onPick: (dish: DishPick) => void;
  onClose: () => void;
};

export function DishLibraryPicker({
  items,
  mode,
  title,
  canWrite,
  onPick,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const ranked = useMemo(
    () => rankDishLibrary(items, query).slice(0, 40),
    [items, query],
  );

  const selected =
    ranked.find((i) => i.id === selectedId) ?? ranked[0] ?? null;

  function confirm(item: DishLibraryItem) {
    if (!canWrite) return;
    markDishUsed(item.id);
    onPick(toDishPick(item));
  }

  return (
    <section
      className="space-y-3 rounded-md border border-border px-3 py-3"
      aria-labelledby="me-dish-lib"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id="me-dish-lib" className="text-sm font-semibold tracking-wide">
            {title ??
              (mode === "replace"
                ? "Biblioteca · Reemplazar plato"
                : "Biblioteca · Insertar plato")}
          </h3>
          <p className="text-xs text-muted-foreground">
            Memoria operativa del tenant — reutilizar, no recrear
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs underline-offset-2 hover:underline"
        >
          Cerrar
        </button>
      </div>

      <label className="sr-only" htmlFor="me-dish-search">
        Buscar plato
      </label>
      <input
        id="me-dish-search"
        ref={searchRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nombre, etiqueta, alérgeno…"
        autoComplete="off"
        className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {ranked.length === 0 ? (
        <div className="space-y-2 py-2">
          <p className="text-sm font-medium">No hay plato coincidente.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/admin/dishes"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Crear plato
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Volver a planificación
            </button>
          </div>
        </div>
      ) : (
        <ul className="max-h-64 divide-y divide-border/60 overflow-y-auto" role="listbox">
          {ranked.map((item) => {
            const active = (selected?.id ?? null) === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "flex min-h-11 w-full flex-col items-start gap-0.5 py-2 text-left hover:bg-muted/40",
                    active && "bg-muted/50",
                  )}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.tags.slice(0, 3).join(" · ") || "Sin etiquetas"}
                    {item.useCount > 0 ? ` · usado ${item.useCount}×` : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected ? (
        <div className="space-y-2 border-t border-border/50 pt-3">
          <p className="text-sm font-medium">{selected.label}</p>
          {selected.description ? (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {selected.description}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            <StatusChip
              tone={selected.availability === "available" ? "positive" : "warning"}
              label={availabilityLabel(selected.availability)}
            />
            <StatusChip
              tone="neutral"
              label={completenessLabel("Macros", selected.macrosComplete)}
            />
            <StatusChip
              tone="neutral"
              label={completenessLabel("Alérgenos", selected.allergenComplete)}
            />
            {selected.macrosHint ? (
              <StatusChip tone="info" label={selected.macrosHint} />
            ) : null}
            {selected.allergenHint ? (
              <StatusChip tone="info" label={selected.allergenHint} />
            ) : null}
            {selected.lastUsedAt ? (
              <StatusChip tone="neutral" label="Usado recientemente" />
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={!canWrite || selected.availability === "archived"}
              onClick={() => confirm(selected)}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
            >
              {mode === "replace" ? "Reemplazar plato actual" : "Insertar"}
            </button>
            <Link
              to="/admin/dishes"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Abrir plato
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Cancelar
            </button>
            <span className="inline-flex min-h-11 items-center px-2 text-xs text-muted-foreground">
              Duplicar plato → futuro
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
