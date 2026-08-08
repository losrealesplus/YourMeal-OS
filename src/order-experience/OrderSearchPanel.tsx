/**
 * OE002 — Zero Friction Order Search panel (Experience only).
 */

import { Link } from "@tanstack/react-router";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { StatusChip } from "@/components/admin";
import { useCustomer } from "@/customer/useCustomer";
import { useOrder } from "@/order/useOrder";
import { getCustomerQuery } from "@/customer/CustomerQueries";
import {
  getOrderQuery,
  searchOrdersQuery,
} from "@/order/OrderQueries";
import type { OrderStatus, OrderSummary } from "@/order/OrderContext";
import { mondayIso } from "@/order-experience/operational-commitments";
import {
  listOperationalCommitments,
  formatDayLabel,
  type OperationalCommitment,
} from "@/order-experience/operational-commitments";
import {
  rankOrderHits,
  statusLabel,
  statusTone,
  type RankableOrderHit,
} from "@/order-experience/order-search-rank";
import {
  facadeEditKey,
  getOrderEdit,
} from "@/order-experience/operational-order-edits";
import { cn } from "@/lib/utils";

export type OrderSearchHit = RankableOrderHit & {
  facadeSummary?: OrderSummary;
  session?: OperationalCommitment;
};

type Props = {
  onCreateOrder: () => void;
  onEditOrder: (hit: OrderSearchHit) => void;
};

export function OrderSearchPanel({ onCreateOrder, onEditOrder }: Props) {
  const order = useOrder();
  const customer = useCustomer();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | OrderStatus>(
    "all",
  );
  const [hits, setHits] = useState<OrderSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const enrichFacade = useEffectEvent(
    async (summaries: OrderSummary[]): Promise<OrderSearchHit[]> => {
      const slice = summaries.slice(0, 24);
      return Promise.all(
        slice.map(async (s) => {
          let phone: string | null = null;
          let area: string | null = null;
          let organizationLabel: string | null =
            s.demandChannel === "company" ? "Organización" : null;
          let hasInstructions = false;

          try {
            const got = await order.getOrder(getOrderQuery({ orderId: s.id }));
            if (got.ok && got.context) {
              const notes = got.context.details.constraints.modifications;
              hasInstructions = notes.length > 0;
              const allergens = got.context.details.constraints.allergens;
              if (allergens.length) hasInstructions = true;
            }
          } catch {
            /* ignore */
          }

          try {
            const party = await customer.getCustomer(
              getCustomerQuery({
                partyRef: {
                  kind: s.partyRef.kind,
                  id: s.partyRef.id,
                },
              }),
            );
            if (party.ok && party.context) {
              phone = party.context.profile?.phones?.[0]?.e164 ?? null;
              area =
                party.context.profile?.addresses
                  ?.map((a) => a.city || a.line1)
                  .find((v) => v?.trim())
                  ?.trim() || null;
              if (s.partyRef.kind === "company_account") {
                organizationLabel = s.partyRef.displayName;
              }
            }
          } catch {
            /* ignore */
          }

          const overlay = getOrderEdit(facadeEditKey(s.id));
          return {
            id: s.id,
            customerName: s.partyRef.displayName,
            organizationLabel,
            phone,
            area: overlay?.addressNote || area,
            deliveryDay: overlay?.deliveryDay ?? s.deliveryDayPrimary,
            status: s.status,
            itemCount: overlay?.items
              ? overlay.items.reduce((n, i) => n + i.qty, 0)
              : s.itemCount,
            hasInstructions:
              hasInstructions || Boolean(overlay?.instructions?.trim()),
            source: "facade" as const,
            createdAt: null,
            facadeSummary: s,
          };
        }),
      );
    },
  );

  const runSearch = useEffectEvent(async (q: string) => {
    setLoading(true);
    try {
      const weekStart = mondayIso();
      const facadeHits: OrderSearchHit[] = [];

      if (order.isReady) {
        const result = await order.searchOrders(
          searchOrdersQuery({ weekStart, limit: 40 }),
        );
        if (result.ok) {
          facadeHits.push(...(await enrichFacade(result.summaries)));
        }
        // Also pull ready-for-delivery / pending flavour without week lock
        const pending = await order.searchOrders(
          searchOrdersQuery({ limit: 40 }),
        );
        if (pending.ok) {
          const known = new Set(facadeHits.map((h) => h.id));
          const extra = pending.summaries.filter((s) => !known.has(s.id));
          facadeHits.push(...(await enrichFacade(extra)));
        }
      }

      const sessionHits: OrderSearchHit[] = listOperationalCommitments().map(
        (c) => ({
          id: c.id,
          customerName: c.customerName,
          organizationLabel:
            c.customerKind === "company_account" ? "Organización" : null,
          phone: null,
          area: null,
          deliveryDay: c.deliveryDay,
          status: "session_commitment" as const,
          itemCount: c.items.reduce((n, i) => n + i.qty, 0),
          hasInstructions: Boolean(c.instructions.trim()),
          source: "session" as const,
          createdAt: c.createdAt,
          session: c,
        }),
      );

      let merged = rankOrderHits([...facadeHits, ...sessionHits], q);

      if (statusFilter === "pending") {
        merged = merged.filter((h) =>
          [
            "confirmed",
            "in_production",
            "prepared",
            "ready_for_delivery",
            "out_for_delivery",
            "session_commitment",
          ].includes(h.status),
        );
      } else if (statusFilter !== "all") {
        merged = merged.filter((h) => h.status === statusFilter);
      }

      // Text filter after rank (name/day/phone/area)
      if (q.trim()) {
        const ql = q.trim().toLowerCase();
        const qd = q.replace(/\D/g, "");
        merged = merged.filter((h) => {
          const blob = [
            h.customerName,
            h.organizationLabel,
            h.area,
            h.deliveryDay,
            h.status,
            h.phone,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (blob.includes(ql)) return true;
          if (qd.length >= 3 && (h.phone ?? "").replace(/\D/g, "").includes(qd)) {
            return true;
          }
          return false;
        });
        merged = rankOrderHits(merged, q);
      }

      setHits(merged.slice(0, 30));
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    const t = window.setTimeout(() => void runSearch(query), 140);
    return () => window.clearTimeout(t);
  }, [query, statusFilter, order.isReady, customer.isReady]);

  const selected = hits.find((h) => h.id === selectedId) ?? null;

  return (
    <section className="mb-8 space-y-4" aria-labelledby="oe-search">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="oe-search" className="text-sm font-semibold tracking-wide">
          Buscar pedido
        </h2>
        <button
          type="button"
          onClick={onCreateOrder}
          className="inline-flex min-h-11 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
        >
          Nuevo pedido
        </button>
      </div>

      <label className="sr-only" htmlFor="oe-order-search">
        Buscar por cliente, día, zona, estado, teléfono
      </label>
      <input
        id="oe-order-search"
        ref={searchRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cliente, día, zona, estado, teléfono…"
        autoComplete="off"
        className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todos"],
            ["pending", "Pendientes"],
            ["draft", "Borrador"],
            ["confirmed", "Confirmado"],
            ["ready_for_delivery", "Listo reparto"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={cn(
              "min-h-10 rounded-md border px-3 text-xs",
              statusFilter === key
                ? "border-foreground bg-foreground text-background"
                : "border-border",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Buscando…</p>
      )}

      {!loading && hits.length === 0 && (
        <div className="space-y-2 text-sm">
          <p>No se encontró ningún pedido.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onCreateOrder}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            >
              Crear pedido
            </button>
            <Link
              to="/admin/customer-workspace"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
            >
              Abrir cliente
            </Link>
          </div>
        </div>
      )}

      <ul className="space-y-2" role="listbox">
        {hits.map((hit) => (
          <li key={`${hit.source}:${hit.id}`}>
            <article
              className={cn(
                "rounded-md border border-border px-3 py-3 space-y-2",
                selectedId === hit.id && "border-foreground/40 bg-muted/30",
              )}
            >
              <button
                type="button"
                role="option"
                aria-selected={selectedId === hit.id}
                onClick={() =>
                  setSelectedId((id) => (id === hit.id ? null : hit.id))
                }
                className="flex w-full min-h-11 flex-col items-start gap-1 text-left"
              >
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{hit.customerName}</span>
                  <StatusChip
                    tone={statusTone(hit.status)}
                    label={statusLabel(hit.status)}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {hit.organizationLabel ? `${hit.organizationLabel} · ` : ""}
                  {hit.deliveryDay
                    ? formatDayLabel(hit.deliveryDay)
                    : "Sin día"}
                  {hit.area ? ` · ${hit.area}` : ""}
                  {` · ${hit.itemCount} ítem${hit.itemCount === 1 ? "" : "s"}`}
                  {hit.hasInstructions ? " · Notas" : ""}
                  {hit.phone ? ` · ${hit.phone}` : ""}
                </span>
              </button>

              {selectedId === hit.id && (
                <div className="flex flex-wrap gap-2 border-t border-border/50 pt-2">
                  {hit.source === "facade" && (
                    <Link
                      to="/admin/order-workspace"
                      className="inline-flex min-h-10 items-center rounded-md bg-foreground px-3 text-xs font-semibold text-background"
                    >
                      Abrir pedido
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => onEditOrder(hit)}
                    className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-xs font-semibold"
                  >
                    Editar
                  </button>
                  <Link
                    to="/admin/customer-workspace"
                    className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-xs font-semibold"
                  >
                    Abrir cliente
                  </Link>
                  {hit.phone ? (
                    <a
                      href={`tel:${hit.phone.replace(/[^\d+]/g, "")}`}
                      className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-xs font-semibold"
                    >
                      Llamar
                    </a>
                  ) : null}
                  <span className="inline-flex min-h-10 items-center px-2 text-[11px] text-muted-foreground">
                    Similar · Incidencia → próximas fases
                  </span>
                </div>
              )}
            </article>
          </li>
        ))}
      </ul>

      {selected?.session?.instructions ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Instrucciones: {selected.session.instructions}
        </p>
      ) : null}
    </section>
  );
}
