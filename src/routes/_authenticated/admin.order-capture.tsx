/**
 * ORDER EXPERIENCE · Capture · Search · Edit · Templates · Incident (001–005)
 *
 * Conversation speed — not CRUD.
 * useCustomer + useOrder only. No Capability / Facade / Engine changes.
 *
 * Staff intake UNIMPLEMENTED · no UpdateOrder · templates = session patterns.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useEffectEvent,
} from "react";
import type { RefObject } from "react";
import { toast } from "sonner";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { useCustomer } from "@/customer/useCustomer";
import { useOrder } from "@/order/useOrder";
import { useIdentity } from "@/identity/useIdentity";
import {
  getCustomerQuery,
  searchCustomersQuery,
  listRecentCustomersQuery,
} from "@/customer/CustomerQueries";
import type {
  CustomerContext,
  CustomerSummary,
  PartyKind,
} from "@/customer/CustomerContext";
import {
  companyCodeFromTags,
  customerTypeLabel,
  rankSearchHits,
} from "@/customer-experience/search-rank";
import { getLivingProfile } from "@/customer-experience/living-profile";
import { applyOperationalCorrection } from "@/customer-experience/operational-corrections";
import { planWeeklyOrderCommand } from "@/order/OrderCommands";
import { getOrdersByCustomerQuery } from "@/order/OrderQueries";
import type { OrderSummary } from "@/order/OrderContext";
import {
  CONVERSATION_DISHES,
  customDishId,
  dishById,
} from "@/order-experience/conversation-catalog";
import {
  formatDayLabel,
  listOperationalCommitments,
  mondayIso,
  saveOperationalCommitment,
  upcomingDeliveryDays,
  type CommitmentItem,
  type OperationalCommitment,
} from "@/order-experience/operational-commitments";
import {
  OrderSearchPanel,
  type OrderSearchHit,
} from "@/order-experience/OrderSearchPanel";
import { OrderEditPanel } from "@/order-experience/OrderEditPanel";
import { OrderTemplatesPanel } from "@/order-experience/OrderTemplatesPanel";
import { OrderIncidentPanel } from "@/order-experience/OrderIncidentPanel";
import {
  saveOrderTemplate,
  type OrderTemplate,
} from "@/order-experience/order-templates";
import { cn } from "@/lib/utils";

type ExperienceMode = "search" | "capture" | "edit" | "templates" | "incident";

export const Route = createFileRoute("/_authenticated/admin/order-capture")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "orders.read");
  },
  component: OrderCaptureExperiencePage,
  validateSearch: (search: Record<string, unknown>) => ({
    customerId:
      typeof search.customerId === "string" ? search.customerId : undefined,
    kind:
      search.kind === "company_account" || search.kind === "individual"
        ? (search.kind as PartyKind)
        : undefined,
    mode:
      search.mode === "capture" ||
      search.mode === "edit" ||
      search.mode === "templates" ||
      search.mode === "incident"
        ? (search.mode as ExperienceMode)
        : ("search" as const),
  }),
  head: () => ({
    meta: [
      {
        title: "YourMeal OS — Order Experience · Incident · Templates · Search · Capture",
      },
      {
        name: "description",
        content:
          "ORDER EXPERIENCE 005 Incident · 004 Templates · 003 Edit · 002 Search · 001 Capture",
      },
    ],
  }),
});

type SearchHit = {
  summary: CustomerSummary;
  phone: string | null;
  area: string | null;
  companyLabel: string | null;
};

function hitKey(s: CustomerSummary) {
  return `${s.partyKind}:${s.id}`;
}

function OrderCaptureExperiencePage() {
  const customer = useCustomer();
  const order = useOrder();
  const identity = useIdentity();
  const searchParams = Route.useSearch();
  const caps = identity.permissions.capabilities;
  const canWrite = caps.includes("orders.write");

  const [mode, setMode] = useState<ExperienceMode>(
    searchParams.mode === "capture" || searchParams.customerId
      ? "capture"
      : searchParams.mode === "edit" ||
          searchParams.mode === "templates" ||
          searchParams.mode === "incident"
        ? searchParams.mode
        : "search",
  );
  const [editHit, setEditHit] = useState<OrderSearchHit | null>(null);
  const [incidentHit, setIncidentHit] = useState<OrderSearchHit | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selected, setSelected] = useState<CustomerContext | null>(null);
  const [prevOrders, setPrevOrders] = useState<OrderSummary[]>([]);
  const [sessionCommitments, setSessionCommitments] = useState<
    OperationalCommitment[]
  >([]);
  const [deliveryDay, setDeliveryDay] = useState(
    () => upcomingDeliveryDays(1)[0] ?? mondayIso(),
  );
  const [lines, setLines] = useState<CommitmentItem[]>([]);
  const [customLabel, setCustomLabel] = useState("");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<OperationalCommitment | null>(null);
  const deepLinked = useRef(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const nextActionRef = useRef<HTMLButtonElement>(null);
  const deliveryDays = upcomingDeliveryDays(6);

  const enrichSummaries = useEffectEvent(
    async (summaries: CustomerSummary[], q: string): Promise<SearchHit[]> => {
      const slice = summaries.slice(0, 16);
      const enriched = await Promise.all(
        slice.map(async (summary) => {
          const base: SearchHit = {
            summary,
            phone: null,
            area: null,
            companyLabel: companyCodeFromTags(summary),
          };
          try {
            const result = await customer.getCustomer(
              getCustomerQuery({
                partyRef: { kind: summary.partyKind, id: summary.id },
              }),
            );
            if (!result.ok || !result.context) return base;
            const ctx = applyOperationalCorrection(result.context);
            const phone = ctx.profile?.phones?.[0]?.e164?.trim() || null;
            const area =
              ctx.profile?.addresses
                ?.map((a) => a.city || a.line1)
                .find((v) => v?.trim())
                ?.trim() || null;
            return {
              summary: ctx.summary,
              phone,
              area,
              companyLabel:
                companyCodeFromTags(ctx.summary) ?? base.companyLabel,
            };
          } catch {
            return base;
          }
        }),
      );
      return rankSearchHits(enriched, q);
    },
  );

  const runSearch = useEffectEvent(async (q: string) => {
    if (!customer.isReady) return;
    setLoadingSearch(true);
    try {
      const trimmed = q.trim();
      const result = trimmed
        ? await customer.searchCustomers(
            searchCustomersQuery({ query: trimmed, limit: 20 }),
          )
        : await customer.listRecentCustomers(
            listRecentCustomersQuery({ limit: 12 }),
          );
      if (!result.ok) {
        setHits([]);
        return;
      }
      setHits(await enrichSummaries(result.summaries, trimmed));
    } finally {
      setLoadingSearch(false);
    }
  });

  useEffect(() => {
    const t = window.setTimeout(() => void runSearch(query), 160);
    return () => window.clearTimeout(t);
  }, [query, customer.isReady]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const selectCustomer = useCallback(
    async (summary: CustomerSummary) => {
      setBusy(true);
      setCreated(null);
      try {
        const result = await customer.getCustomer(
          getCustomerQuery({
            partyRef: { kind: summary.partyKind, id: summary.id },
          }),
        );
        if (!result.ok || !result.context) {
          toast.error(
            result.errors[0]?.message ?? "No se pudo abrir el cliente",
          );
          return;
        }
        const ctx = applyOperationalCorrection(result.context);
        setSelected(ctx);
        setSessionCommitments(listOperationalCommitments(summary.id));

        if (order.isReady) {
          const listed = await order.getOrdersByCustomer(
            getOrdersByCustomerQuery({ customerId: summary.id, limit: 5 }),
          );
          setPrevOrders(listed.ok ? listed.summaries : []);
        } else {
          setPrevOrders([]);
        }

        const growth = getLivingProfile({
          kind:
            summary.partyKind === "company_account"
              ? "company_account"
              : "individual",
          id: summary.id,
        });
        const bits = [
          growth?.foodRestrictions,
          growth?.allergies,
          growth?.preferences,
        ]
          .map((s) => s?.trim())
          .filter(Boolean);
        setInstructions((prev) => (prev.trim() ? prev : bits.join(" · ")));

        window.setTimeout(() => confirmRef.current?.focus(), 0);
      } finally {
        setBusy(false);
      }
    },
    [customer, order],
  );

  useEffect(() => {
    if (deepLinked.current) return;
    if (!searchParams.customerId || !customer.isReady) return;
    deepLinked.current = true;
    const kind = searchParams.kind ?? "individual";
    void selectCustomer({
      partyKind: kind,
      id: searchParams.customerId,
      displayName: "…",
      status: "active",
      demandChannelDefault: "individual",
      tenantId: identity.tenant?.id ?? "",
      tags: [],
      userId: null,
    });
  }, [
    searchParams.customerId,
    searchParams.kind,
    customer.isReady,
    identity.tenant?.id,
    selectCustomer,
  ]);

  function addDish(dishId: string, label: string) {
    setLines((prev) => {
      const existing = prev.find((l) => l.dishId === dishId);
      if (existing) {
        return prev.map((l) =>
          l.dishId === dishId ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...prev, { dishId, label, qty: 1 }];
    });
  }

  function bumpQty(dishId: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) =>
          l.dishId === dishId ? { ...l, qty: Math.max(0, l.qty + delta) } : l,
        )
        .filter((l) => l.qty > 0),
    );
  }

  function addCustom() {
    const label = customLabel.trim();
    if (!label) return;
    addDish(customDishId(label), label);
    setCustomLabel("");
  }

  async function onConfirm() {
    if (!selected || !canWrite || lines.length === 0) return;
    setBusy(true);
    try {
      const weekStart = mondayIso(new Date(`${deliveryDay}T12:00:00`));
      const customerId = selected.summary.id;
      const customerKind =
        selected.summary.partyKind === "company_account"
          ? "company_account"
          : "individual";

      let persistence: OperationalCommitment["persistence"] =
        "experience_session";
      let facadeOrderId: string | null = null;

      if (order.isReady) {
        const result = await order.planWeeklyOrder(
          planWeeklyOrderCommand({
            weekStart,
            channel: "phone",
            targetCustomerId: customerId,
            notes: instructions.trim() || null,
            items: lines.map((l) => ({
              dishId: l.dishId,
              dayDate: deliveryDay,
              qty: l.qty,
            })),
          }),
        );
        if (result.ok && result.orderId) {
          persistence = "facade";
          facadeOrderId = result.orderId;
        } else {
          const code = result.errors[0]?.code;
          if (code !== "UNIMPLEMENTED") {
            toast.error(
              result.errors[0]?.message ?? "No se pudo crear el pedido",
            );
            return;
          }
        }
      }

      const commitment = saveOperationalCommitment({
        customerId,
        customerKind,
        customerName: selected.summary.displayName,
        deliveryDay,
        weekStart,
        items: lines,
        instructions: instructions.trim(),
        channel: "phone",
        persistence,
        facadeOrderId,
      });
      setCreated(commitment);
      setSessionCommitments(listOperationalCommitments(customerId));
      toast.success(
        persistence === "facade"
          ? "Pedido creado"
          : "Compromiso registrado (sesión · staff intake pendiente)",
      );
      window.setTimeout(() => nextActionRef.current?.focus(), 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function resetForAnother() {
    setCreated(null);
    setLines([]);
    setInstructions("");
    setSelected(null);
    setQuery("");
    deepLinked.current = false;
    setMode("capture");
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }

  function goToSearch() {
    setCreated(null);
    setLines([]);
    setInstructions("");
    setSelected(null);
    setQuery("");
    setEditHit(null);
    setIncidentHit(null);
    deepLinked.current = false;
    setMode("search");
  }

  function openIncident(hit: OrderSearchHit) {
    setIncidentHit(hit);
    setMode("incident");
  }

  async function applyTemplate(t: OrderTemplate) {
    setCreated(null);
    setEditHit(null);
    setIncidentHit(null);
    setLines(t.items.map((i) => ({ ...i })));
    setInstructions(
      [t.instructions, t.dietaryNotes].filter(Boolean).join(" · "),
    );
    if (t.preferredDeliveryDay) {
      setDeliveryDay(t.preferredDeliveryDay);
    }
    setMode("capture");
    await selectCustomer({
      partyKind: t.customerKind,
      id: t.customerId,
      displayName: t.customerName,
      status: "active",
      demandChannelDefault: "individual",
      tenantId: identity.tenant?.id ?? "",
      tags: [],
      userId: null,
    });
    // Re-apply after selectCustomer may prefill instructions from living profile
    setLines(t.items.map((i) => ({ ...i })));
    setInstructions(
      [t.instructions, t.dietaryNotes].filter(Boolean).join(" · "),
    );
    if (t.preferredDeliveryDay) setDeliveryDay(t.preferredDeliveryDay);
  }

  function saveTemplateFromCommitment(c: OperationalCommitment) {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    const name = `${c.customerName} · ${c.items.map((i) => i.label).slice(0, 2).join(" · ")}`;
    saveOrderTemplate({
      name,
      customerId: c.customerId,
      customerKind: c.customerKind,
      customerName: c.customerName,
      preferredDeliveryDay: c.deliveryDay,
      items: c.items,
      instructions: c.instructions,
      source: "from_order",
    });
    toast.success("Plantilla guardada (sesión)");
  }

  const address = selected?.profile?.addresses?.[0]?.line1 ?? null;
  const phone = selected?.profile?.phones?.[0]?.e164 ?? null;
  const growth = selected
    ? getLivingProfile({
        kind:
          selected.summary.partyKind === "company_account"
            ? "company_account"
            : "individual",
        id: selected.summary.id,
      })
    : null;

  return (
    <div className="animate-fade-in mx-auto max-w-3xl pb-24">
      <SectionTitle
        overline={
          mode === "incident"
            ? "ORDER EXPERIENCE 005 · Phase 005 Incident"
            : mode === "templates"
              ? "ORDER EXPERIENCE 004 · Phase 004 Templates"
              : mode === "edit"
                ? "ORDER EXPERIENCE 003 · Phase 003 Edit"
                : mode === "search"
                  ? "ORDER EXPERIENCE 002 · Phase 002 Search"
                  : "ORDER EXPERIENCE 001 · Phase 001 Capture"
        }
        title={
          mode === "incident"
            ? "Zero Friction Operational Incident"
            : mode === "templates"
              ? "Zero Friction Order Templates"
              : mode === "edit"
                ? "Zero Friction Order Edit"
                : mode === "search"
                  ? "Zero Friction Order Search"
                  : "Zero Friction Order Capture"
        }
        subtitle={
          mode === "incident"
            ? "Registra la excepción y derívala — sin inventar un workaround"
            : mode === "templates"
              ? "Partir de un patrón conocido — nunca desde cero"
              : mode === "edit"
                ? "Corregir un compromiso en vivo — sin perder el hilo"
                : mode === "search"
                  ? "Encuentra el compromiso en segundos — gente, días, situaciones"
                  : "Registrar el pedido mientras hablas — el software desaparece"
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {mode === "incident" ? (
          <StatusChip tone="warning" label="TTRI < 30 s" />
        ) : mode === "templates" ? (
          <StatusChip tone="warning" label="Reuse < 10 s" />
        ) : mode === "edit" ? (
          <StatusChip tone="warning" label="TTEO < 20 s" />
        ) : mode === "search" ? (
          <StatusChip tone="warning" label="TTFO < 10 s" />
        ) : (
          <StatusChip tone="warning" label="TTO < 45 s" />
        )}
        <StatusChip tone="info" label="Conversation · not CRUD" />
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={goToSearch}
        >
          Búsqueda
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => setMode("capture")}
        >
          Captura
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => setMode("templates")}
        >
          Plantillas
        </button>
        <button
          type="button"
          className="text-xs underline-offset-2 hover:underline"
          onClick={() => setMode("incident")}
        >
          Incidencia
        </button>
        <Link
          to="/admin/customer-workspace"
          className="text-xs underline-offset-2 hover:underline"
        >
          Customer Experience
        </Link>
      </div>

      <AdminHeader
        goal={
          mode === "incident"
            ? "Registrar incidencia <30s · derivar <10s · sin callejón sin salida"
            : mode === "templates"
              ? "Crear pedido frecuente <20s · reutilizar patrón <10s"
              : mode === "edit"
                ? "Corregir un compromiso frecuente en <20s · resume <5s"
                : mode === "search"
                  ? "Encontrar cualquier compromiso operativo en <10s"
                  : "Crear compromiso operativo en <45s durante la llamada"
        }
        capability="orders.read / orders.write · customers.read"
        object="Operational incidents · order templates · session honesty"
      />

      {mode === "templates" && !created ? (
        <OrderTemplatesPanel
          customerId={selected?.summary.id}
          customerName={selected?.summary.displayName}
          canWrite={canWrite}
          onApply={(t) => void applyTemplate(t)}
          onCreateOrder={() => setMode("capture")}
          onBack={goToSearch}
        />
      ) : null}

      {mode === "edit" && editHit && !created ? (
        <OrderEditPanel
          hit={editHit}
          canWrite={canWrite}
          onClose={goToSearch}
          onSaved={(next) => setEditHit(next)}
          onSaveAsTemplate={(hit) => {
            if (!canWrite) {
              toast.error("Sin permiso de escritura");
              return;
            }
            const customerId =
              hit.session?.customerId ?? hit.facadeSummary?.partyRef.id;
            if (!customerId) {
              toast.error("No se pudo asociar la plantilla a un cliente");
              return;
            }
            const items =
              hit.session?.items ??
              (hit.itemCount
                ? [
                    {
                      dishId: "exp:from-facade",
                      label: `${hit.itemCount} ítem(s)`,
                      qty: hit.itemCount,
                    },
                  ]
                : []);
            saveOrderTemplate({
              name: `${hit.customerName} · patrón`,
              customerId,
              customerKind:
                hit.session?.customerKind ??
                hit.facadeSummary?.partyRef.kind ??
                "individual",
              customerName: hit.customerName,
              preferredDeliveryDay: hit.deliveryDay,
              items,
              instructions: hit.session?.instructions ?? "",
              addressNote: hit.area ?? undefined,
              source: "from_order",
            });
            toast.success("Plantilla guardada (sesión)");
          }}
          onReportIncident={openIncident}
        />
      ) : null}

      {mode === "incident" && !created ? (
        <OrderIncidentPanel
          hit={incidentHit}
          canWrite={canWrite}
          onClose={goToSearch}
          onOpenOrder={
            incidentHit
              ? () => {
                  setEditHit(incidentHit);
                  setMode("edit");
                }
              : undefined
          }
        />
      ) : null}

      {mode === "search" && !created ? (
        <OrderSearchPanel
          onCreateOrder={() => {
            setMode("capture");
            window.setTimeout(() => searchRef.current?.focus(), 0);
          }}
          onEditOrder={(hit) => {
            setEditHit(hit);
            setMode("edit");
          }}
          onReportIncident={openIncident}
        />
      ) : null}

      {created ? (
        <CreatedPanel
          commitment={created}
          nextActionRef={nextActionRef}
          onAnother={resetForAnother}
          onSearch={goToSearch}
          onSaveTemplate={() => saveTemplateFromCommitment(created)}
          onTemplates={() => setMode("templates")}
        />
      ) : mode === "capture" ? (
        <>
          <section className="mb-8 space-y-3" aria-labelledby="oe-customer">
            <h2 id="oe-customer" className="text-sm font-semibold tracking-wide">
              Cliente
            </h2>
            {!selected ? (
              <>
                <label className="sr-only" htmlFor="oe-search">
                  Buscar cliente
                </label>
                <input
                  id="oe-search"
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nombre, teléfono…"
                  autoComplete="off"
                  className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {loadingSearch && (
                  <p className="text-sm text-muted-foreground">Buscando…</p>
                )}
                {!loadingSearch && hits.length === 0 && (
                  <div className="space-y-2 text-sm">
                    <p>No se encontró el cliente.</p>
                    <Link
                      to="/admin/customer-workspace"
                      className="inline-flex min-h-11 items-center font-medium underline-offset-2 hover:underline"
                    >
                      Crear cliente
                    </Link>
                  </div>
                )}
                <ul className="divide-y divide-border/60" role="listbox">
                  {hits.map((hit) => (
                    <li key={hitKey(hit.summary)}>
                      <button
                        type="button"
                        role="option"
                        disabled={busy}
                        onClick={() => void selectCustomer(hit.summary)}
                        className="flex min-h-11 w-full flex-col items-start gap-0.5 py-2.5 text-left hover:bg-muted/40"
                      >
                        <span className="font-medium">
                          {hit.summary.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {customerTypeLabel(hit.summary)}
                          {hit.phone ? ` · ${hit.phone}` : ""}
                          {hit.area ? ` · ${hit.area}` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="space-y-2 border-b border-border/50 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-medium leading-tight">
                      {selected.summary.displayName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {customerTypeLabel(selected.summary)}
                      {phone ? ` · ${phone}` : ""}
                    </p>
                    {address && (
                      <p className="text-sm text-muted-foreground">{address}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="min-h-11 text-sm underline-offset-2 hover:underline"
                    onClick={() => {
                      setSelected(null);
                      setCreated(null);
                      window.setTimeout(() => searchRef.current?.focus(), 0);
                    }}
                  >
                    Cambiar
                  </button>
                </div>
                {(growth?.foodRestrictions ||
                  growth?.allergies ||
                  growth?.operationalNotes) && (
                  <p
                    className="text-sm text-muted-foreground"
                    aria-label="Restricciones conocidas"
                  >
                    {[
                      growth.foodRestrictions,
                      growth.allergies,
                      growth.operationalNotes,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {(prevOrders.length > 0 || sessionCommitments.length > 0) && (
                  <div className="text-xs text-muted-foreground">
                    {prevOrders.length > 0 && (
                      <p>
                        Pedidos recientes:{" "}
                        {prevOrders
                          .slice(0, 3)
                          .map((o) => o.status)
                          .join(" · ")}
                      </p>
                    )}
                    {sessionCommitments.length > 0 && (
                      <p>
                        Compromisos de sesión: {sessionCommitments.length}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {selected && (
            <>
              <section className="mb-8 space-y-3" aria-labelledby="oe-day">
                <h2 id="oe-day" className="text-sm font-semibold tracking-wide">
                  Día de entrega
                </h2>
                <div className="flex flex-wrap gap-2">
                  {deliveryDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setDeliveryDay(day)}
                      className={cn(
                        "min-h-11 rounded-md border px-3 text-sm",
                        day === deliveryDay
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background",
                      )}
                    >
                      {formatDayLabel(day)}
                    </button>
                  ))}
                </div>
              </section>

              <section className="mb-8 space-y-3" aria-labelledby="oe-items">
                <h2 id="oe-items" className="text-sm font-semibold tracking-wide">
                  Platos
                </h2>
                <p className="text-xs text-muted-foreground">
                  Aceleradores de conversación · menú durable llega con Menu
                  Experience
                </p>
                <div className="flex flex-wrap gap-2">
                  {CONVERSATION_DISHES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => addDish(d.id, d.label)}
                      className="min-h-11 rounded-md border border-border px-3 text-sm hover:bg-muted/40"
                    >
                      + {d.short}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustom();
                      }
                    }}
                    placeholder="Otro plato (como lo dice el cliente)"
                    className="min-h-11 flex-1 rounded-md border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={addCustom}
                    className="min-h-11 rounded-md border border-border px-4 text-sm"
                  >
                    Añadir
                  </button>
                </div>
                {lines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin platos aún — toca un acelerador o escribe lo que pide.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {lines.map((l) => (
                      <li
                        key={l.dishId}
                        className="flex min-h-11 items-center justify-between gap-3"
                      >
                        <span className="font-medium">
                          {l.label || dishById(l.dishId)?.label || l.dishId}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="min-h-11 min-w-11 border border-border"
                            onClick={() => bumpQty(l.dishId, -1)}
                            aria-label="Menos"
                          >
                            −
                          </button>
                          <span className="w-6 text-center tabular-nums">
                            {l.qty}
                          </span>
                          <button
                            type="button"
                            className="min-h-11 min-w-11 border border-border"
                            onClick={() => bumpQty(l.dishId, 1)}
                            aria-label="Más"
                          >
                            +
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="mb-8 space-y-3" aria-labelledby="oe-notes">
                <h2 id="oe-notes" className="text-sm font-semibold tracking-wide">
                  Instrucciones especiales
                </h2>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  placeholder="Sin cebolla · dejar en recepción · …"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </section>

              <section className="space-y-3">
                {!canWrite && (
                  <p className="text-sm text-muted-foreground">
                    Necesitas permiso de escritura de pedidos.
                  </p>
                )}
                <button
                  ref={confirmRef}
                  type="button"
                  disabled={busy || !canWrite || lines.length === 0}
                  onClick={() => void onConfirm()}
                  className="flex min-h-12 w-full items-center justify-center rounded-md bg-foreground px-4 text-base font-medium text-background disabled:opacity-40"
                >
                  {busy ? "Registrando…" : "Confirmar pedido"}
                </button>
              </section>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

function CreatedPanel({
  commitment,
  nextActionRef,
  onAnother,
  onSearch,
  onSaveTemplate,
  onTemplates,
}: {
  commitment: OperationalCommitment;
  nextActionRef: RefObject<HTMLButtonElement | null>;
  onAnother: () => void;
  onSearch: () => void;
  onSaveTemplate: () => void;
  onTemplates: () => void;
}) {
  return (
    <section className="space-y-4" aria-labelledby="oe-created" aria-live="polite">
      <h2 id="oe-created" className="text-sm font-semibold tracking-wide">
        Pedido creado
      </h2>
      <p className="text-lg font-medium">{commitment.customerName}</p>
      <p className="text-sm text-muted-foreground">
        {formatDayLabel(commitment.deliveryDay)} ·{" "}
        {commitment.items.map((i) => `${i.qty}× ${i.label}`).join(" · ")}
      </p>
      {commitment.instructions ? (
        <p className="text-sm">{commitment.instructions}</p>
      ) : null}
      <StatusChip
        tone={commitment.persistence === "facade" ? "positive" : "warning"}
        label={
          commitment.persistence === "facade"
            ? "Persistido · Facade"
            : "Sesión · staff intake UNIMPLEMENTED"
        }
      />

      <div className="space-y-2 pt-2">
        <p className="text-sm font-medium">¿Qué quieres hacer ahora?</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            to="/admin/production-workspace"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
          >
            Generar producción
          </Link>
          <button
            ref={nextActionRef}
            type="button"
            onClick={onAnother}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
          >
            Continuar con otro pedido
          </button>
          <button
            type="button"
            onClick={onSaveTemplate}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
          >
            Guardar como plantilla
          </button>
          <button
            type="button"
            onClick={onTemplates}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
          >
            Ver plantillas
          </button>
          <button
            type="button"
            onClick={onSearch}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
          >
            Buscar pedidos
          </button>
          <Link
            to="/admin/customer-workspace"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm"
          >
            Abrir cliente
          </Link>
        </div>
      </div>
    </section>
  );
}
