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
import { useCallback, useEffect, useMemo, useRef, useState, useEffectEvent } from "react";
import type { RefObject } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Utensils } from "lucide-react";
import { fetchPublishedWeeklyMenu } from "@/modules/weekly-menu/application/weekly-menu-queries";
import type { WeeklyMenuView } from "@/modules/weekly-menu/application/weekly-menu-mapper";
import {
  utcWeekStartMonday,
  utcWeekDates,
  DAY_NAMES_ES,
} from "@/modules/weekly-menu/application/week-dates";
import { AdminHeader, SectionTitle, StatusChip } from "@/components/admin";
import { useCustomer } from "@/customer/useCustomer";
import { useOrder } from "@/order/useOrder";
import { useIdentity } from "@/identity/useIdentity";
import {
  getCustomerQuery,
  searchCustomersQuery,
  listRecentCustomersQuery,
} from "@/customer/CustomerQueries";
import type { CustomerContext, CustomerSummary, PartyKind } from "@/customer/CustomerContext";
import {
  companyCodeFromTags,
  customerTypeLabel,
  rankSearchHits,
} from "@/customer-experience/search-rank";
import { getLivingProfile } from "@/customer-experience/living-profile";
import { applyOperationalCorrection } from "@/customer-experience/operational-corrections";
import { createCustomerCommand } from "@/customer/CustomerCommands";
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
import { OrderSearchPanel, type OrderSearchHit } from "@/order-experience/OrderSearchPanel";
import { OrderEditPanel } from "@/order-experience/OrderEditPanel";
import { OrderTemplatesPanel } from "@/order-experience/OrderTemplatesPanel";
import { OrderIncidentPanel } from "@/order-experience/OrderIncidentPanel";
import { saveOrderTemplate, type OrderTemplate } from "@/order-experience/order-templates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ExperienceMode = "search" | "capture" | "edit" | "templates" | "incident";

export const Route = createFileRoute("/_authenticated/admin/order-capture")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "orders.read");
  },
  component: OrderCaptureExperiencePage,
  validateSearch: (search: Record<string, unknown>) => ({
    customerId: typeof search.customerId === "string" ? search.customerId : undefined,
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
  const [sessionCommitments, setSessionCommitments] = useState<OperationalCommitment[]>([]);
  const [deliveryDay, setDeliveryDay] = useState(() => upcomingDeliveryDays(1)[0] ?? mondayIso());
  const [lines, setLines] = useState<CommitmentItem[]>([]);
  const [customLabel, setCustomLabel] = useState("");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<OperationalCommitment | null>(null);
  const deepLinked = useRef(false);

  // Quick create customer state
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [quickStreet, setQuickStreet] = useState("");
  const [quickCity, setQuickCity] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const nextActionRef = useRef<HTMLButtonElement>(null);
  const clientRequestIdRef = useRef<string>(crypto.randomUUID());
  const deliveryDays = upcomingDeliveryDays(6);

  async function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!quickName.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }
    setCreatingCustomer(true);
    try {
      const res = await customer.createCustomer(
        createCustomerCommand({
          partyKind: "individual",
          mode: "staff_create",
          displayName: quickName.trim(),
          phone: quickPhone.trim() || null,
          street: quickStreet.trim() || null,
          city: quickCity.trim() || null,
        }),
      );
      if (res.ok && res.context) {
        toast.success("Cliente creado correctamente");
        setShowQuickCreate(false);
        setQuickName("");
        setQuickPhone("");
        setQuickStreet("");
        setQuickCity("");
        await selectCustomer(res.context.summary);
      } else {
        toast.error(res.errors[0]?.message ?? "Error al crear el cliente");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingCustomer(false);
    }
  }

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
              companyLabel: companyCodeFromTags(ctx.summary) ?? base.companyLabel,
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
        ? await customer.searchCustomers(searchCustomersQuery({ query: trimmed, limit: 20 }))
        : await customer.listRecentCustomers(listRecentCustomersQuery({ limit: 12 }));
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
          toast.error(result.errors[0]?.message ?? "No se pudo abrir el cliente");
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
          kind: summary.partyKind === "company_account" ? "company_account" : "individual",
          id: summary.id,
        });
        const bits = [growth?.foodRestrictions, growth?.allergies, growth?.preferences]
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
        return prev.map((l) => (l.dishId === dishId ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { dishId, label, qty: 1 }];
    });
  }

  function bumpQty(dishId: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.dishId === dishId ? { ...l, qty: Math.max(0, l.qty + delta) } : l))
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
        selected.summary.partyKind === "company_account" ? "company_account" : "individual";

      let persistence: OperationalCommitment["persistence"] = "experience_session";
      let facadeOrderId: string | null = null;

      if (order.isReady) {
        const result = await order.planWeeklyOrder(
          planWeeklyOrderCommand({
            weekStart,
            channel: "phone",
            targetCustomerId: customerId,
            notes: instructions.trim() || null,
            clientRequestId: clientRequestIdRef.current,
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
            toast.error(result.errors[0]?.message ?? "No se pudo crear el pedido");
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
    clientRequestIdRef.current = crypto.randomUUID();
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
    clientRequestIdRef.current = crypto.randomUUID();
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
    setInstructions([t.instructions, t.dietaryNotes].filter(Boolean).join(" · "));
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
    setInstructions([t.instructions, t.dietaryNotes].filter(Boolean).join(" · "));
    if (t.preferredDeliveryDay) setDeliveryDay(t.preferredDeliveryDay);
  }

  function saveTemplateFromCommitment(c: OperationalCommitment) {
    if (!canWrite) {
      toast.error("Sin permiso de escritura");
      return;
    }
    const name = `${c.customerName} · ${c.items
      .map((i) => i.label)
      .slice(0, 2)
      .join(" · ")}`;
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
  const city = selected?.profile?.addresses?.[0]?.city ?? null;
  const fullAddress = [address, city].filter(Boolean).join(", ") || null;
  const phone = selected?.profile?.phones?.[0]?.e164 ?? null;
  const email = selected?.profile?.email ?? null;
  const growth = selected
    ? getLivingProfile({
        kind: selected.summary.partyKind === "company_account" ? "company_account" : "individual",
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
        <Link to="/admin/customer-workspace" className="text-xs underline-offset-2 hover:underline">
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
            const customerId = hit.session?.customerId ?? hit.facadeSummary?.partyRef.id;
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
                hit.session?.customerKind ?? hit.facadeSummary?.partyRef.kind ?? "individual",
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
                <div className="flex gap-2">
                  <input
                    id="oe-search"
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nombre, teléfono o empresa…"
                    autoComplete="off"
                    className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setQuickName(query);
                      setShowQuickCreate(true);
                    }}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-border px-3 text-xs font-semibold hover:bg-muted/40"
                  >
                    + Alta rápida
                  </button>
                </div>
                {loadingSearch && <p className="text-sm text-muted-foreground">Buscando…</p>}
                {!loadingSearch && hits.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">No se encontró el cliente.</p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setQuickName(query);
                          setShowQuickCreate(true);
                        }}
                        className="inline-flex min-h-10 items-center justify-center rounded-md bg-foreground px-4 text-xs font-semibold text-background hover:opacity-90"
                      >
                        + Crear cliente inline
                      </button>
                      <Link
                        to="/admin/customer-workspace"
                        search={{ tab: "profile" }}
                        className="inline-flex min-h-10 items-center font-medium text-xs text-muted-foreground underline-offset-2 hover:underline"
                      >
                        Ir al Customer Workspace
                      </Link>
                    </div>
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
                        <span className="font-medium">{hit.summary.displayName}</span>
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
              <div
                className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3"
                aria-label="Customer Context Preview"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        {selected.summary.displayName}
                      </h3>
                      <StatusChip
                        tone={selected.summary.partyKind === "company_account" ? "info" : "neutral"}
                        label={
                          selected.summary.partyKind === "company_account"
                            ? "Empresa / B2B"
                            : "Particular B2C"
                        }
                      />
                      {companyCodeFromTags(selected.summary) ? (
                        <span className="text-xs text-muted-foreground font-mono">
                          {companyCodeFromTags(selected.summary)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {phone ? <span>📞 {phone}</span> : <span>📞 Sin teléfono</span>}
                      {email ? <span>✉️ {email}</span> : null}
                      {fullAddress ? <span>📍 {fullAddress}</span> : <span>📍 Sin dirección</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/admin/customer-workspace"
                      search={{ customerId: selected.summary.id, tab: "profile" }}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted/50"
                    >
                      Ver ficha completa
                    </Link>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 px-1"
                      onClick={() => {
                        setSelected(null);
                        setCreated(null);
                        window.setTimeout(() => searchRef.current?.focus(), 0);
                      }}
                    >
                      Cambiar
                    </button>
                  </div>
                </div>

                {(growth?.foodRestrictions ||
                  growth?.allergies ||
                  growth?.operationalNotes ||
                  prevOrders.length > 0) && (
                  <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {growth?.foodRestrictions || growth?.allergies || growth?.operationalNotes ? (
                      <div
                        className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium"
                        aria-label="Restricciones conocidas"
                      >
                        <span>⚠️</span>
                        <span>
                          {[growth.foodRestrictions, growth.allergies, growth.operationalNotes]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                    ) : (
                      <span />
                    )}
                    {prevOrders.length > 0 ? (
                      <span className="text-muted-foreground">
                        Último pedido:{" "}
                        <span className="font-medium text-foreground">{prevOrders[0]?.status}</span>{" "}
                        ({formatDayLabel(prevOrders[0]?.deliveryDayPrimary ?? mondayIso())})
                      </span>
                    ) : null}
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

              <section className="mb-8" aria-label="Menú de la semana">
                <ActiveWeeklyMenuPreview
                  tenantId={identity.tenant?.id ?? null}
                  deliveryDay={deliveryDay}
                  hasMenuReadCapability={caps.includes("menus.read")}
                  customerRestrictions={
                    growth
                      ? [growth.foodRestrictions, growth.allergies, growth.operationalNotes]
                          .filter(Boolean)
                          .join(" · ") || null
                      : null
                  }
                  onSelectDeliveryDay={(day) => setDeliveryDay(day)}
                  onAddDish={(dishId, label) => addDish(dishId, label)}
                />
              </section>

              <section className="mb-8 space-y-3" aria-labelledby="oe-items">
                <h2 id="oe-items" className="text-sm font-semibold tracking-wide">
                  Platos
                </h2>
                <p className="text-xs text-muted-foreground">
                  Aceleradores de conversación · menú durable llega con Menu Experience
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
                          <span className="w-6 text-center tabular-nums">{l.qty}</span>
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
      <Dialog open={showQuickCreate} onOpenChange={setShowQuickCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alta Rápida de Cliente</DialogTitle>
            <DialogDescription>
              Crea un cliente particular directamente desde la captura de pedidos sin abandonar el
              flujo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleQuickCreate(e)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="quick-name" className="text-xs font-semibold text-foreground">
                Nombre completo / Razón social *
              </label>
              <input
                id="quick-name"
                required
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="Ej. Carmen Navarro"
                className="min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="quick-phone" className="text-xs font-semibold text-foreground">
                Teléfono
              </label>
              <input
                id="quick-phone"
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                placeholder="Ej. +34 600 123 456"
                className="min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label htmlFor="quick-street" className="text-xs font-semibold text-foreground">
                  Dirección / Calle
                </label>
                <input
                  id="quick-street"
                  value={quickStreet}
                  onChange={(e) => setQuickStreet(e.target.value)}
                  placeholder="Ej. C/ Gran Vía 28"
                  className="min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="quick-city" className="text-xs font-semibold text-foreground">
                  Ciudad
                </label>
                <input
                  id="quick-city"
                  value={quickCity}
                  onChange={(e) => setQuickCity(e.target.value)}
                  placeholder="Ej. Madrid"
                  className="min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowQuickCreate(false)}
                className="min-h-10 rounded-md border border-border px-4 text-xs font-semibold hover:bg-muted/40"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creatingCustomer || !quickName.trim()}
                className="min-h-10 rounded-md bg-foreground px-4 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-40"
              >
                {creatingCustomer ? "Creando…" : "Crear y Continuar"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
      {commitment.instructions ? <p className="text-sm">{commitment.instructions}</p> : null}
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
            to="/admin/customer-workspace"
            search={{ customerId: commitment.customerId, tab: "orders" }}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm font-semibold text-background shadow-sm hover:opacity-90"
          >
            Volver a la ficha del cliente
          </Link>
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
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-medium hover:bg-muted/40"
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
        </div>
      </div>
    </section>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatWeekRange(weekStart: string): string {
  const dates = utcWeekDates(weekStart);
  const startDay = parseInt(weekStart.slice(8, 10), 10);
  const endDay = parseInt((dates[6] ?? weekStart).slice(8, 10), 10);
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const startMonth = months[parseInt(weekStart.slice(5, 7), 10) - 1] ?? "";
  const endMonth = months[parseInt((dates[6] ?? weekStart).slice(5, 7), 10) - 1] ?? "";

  return startMonth === endMonth
    ? `${startDay} — ${endDay} ${startMonth}`
    : `${startDay} ${startMonth} — ${endDay} ${endMonth}`;
}

export function ActiveWeeklyMenuPreview({
  tenantId,
  deliveryDay,
  hasMenuReadCapability,
  customerRestrictions,
  onSelectDeliveryDay,
  onAddDish,
}: {
  tenantId: string | null;
  deliveryDay: string;
  hasMenuReadCapability: boolean;
  customerRestrictions?: string | null;
  onSelectDeliveryDay: (dayDate: string) => void;
  onAddDish: (dishId: string, label: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuView, setMenuView] = useState<WeeklyMenuView | null>(null);

  const weekStart = useMemo(() => {
    try {
      const [y, m, d] = deliveryDay.split("-").map(Number);
      return utcWeekStartMonday(new Date(Date.UTC(y, m - 1, d)));
    } catch {
      return utcWeekStartMonday();
    }
  }, [deliveryDay]);

  useEffect(() => {
    let active = true;
    if (!tenantId) return;
    if (!hasMenuReadCapability) {
      setError("Vista previa de menú no disponible (permiso menus.read requerido).");
      return;
    }

    async function loadPublishedMenu() {
      setLoading(true);
      setError(null);
      try {
        const view = await fetchPublishedWeeklyMenu(tenantId!, weekStart);
        if (!active) return;
        setMenuView(view);
      } catch {
        if (!active) return;
        setError("Vista previa de menú no disponible. La captura manual continúa disponible.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPublishedMenu();
    return () => {
      active = false;
    };
  }, [tenantId, weekStart, hasMenuReadCapability]);

  const isPublished = menuView?.status === "published";
  const hasAnyDishes = menuView?.days.some((d) => d.dishes.length > 0) ?? false;

  const dayOffers = useMemo(() => {
    if (!menuView) return [];
    return menuView.days.map((day, idx) => ({
      dayDate: day.dayDate,
      dayName: DAY_NAMES_ES[idx] ?? `Día ${idx + 1}`,
      dishes: day.dishes,
    }));
  }, [menuView]);

  return (
    <div
      className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
      aria-label="Weekly Menu Intelligence"
    >
      <div className="flex items-center justify-between p-4 bg-muted/20 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Utensils className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Menú de la semana ({formatWeekRange(weekStart)})
          </h3>
          {isPublished ? (
            <StatusChip tone="positive" label="Publicado" />
          ) : (
            <StatusChip tone="neutral" label="Sin publicar" />
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/40"
          aria-label={collapsed ? "Expandir menú de la semana" : "Colapsar menú de la semana"}
        >
          {collapsed ? (
            <>
              <span>Mostrar</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              <span>Ocultar</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {!collapsed ? (
        <div className="p-4 space-y-4">
          {loading ? (
            <p className="text-xs text-muted-foreground animate-pulse py-2">
              Consultando oferta publicada para la semana…
            </p>
          ) : error ? (
            <div className="rounded-lg border border-border/60 bg-muted/10 p-3 text-xs text-muted-foreground">
              {error}
            </div>
          ) : !isPublished ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center space-y-1">
              <p className="text-xs font-medium text-foreground">
                No hay menú publicado para esta semana ({formatWeekRange(weekStart)}).
              </p>
              <p className="text-[11px] text-muted-foreground">
                Puedes continuar con la captura manual de platos.
              </p>
            </div>
          ) : !hasAnyDishes ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center space-y-1">
              <p className="text-xs font-medium text-foreground">
                El menú de esta semana está publicado pero no contiene platos asignados.
              </p>
              <p className="text-[11px] text-muted-foreground">
                Puedes continuar con la captura manual de platos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerRestrictions ? (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>
                    Revisar restricciones del cliente: <strong>{customerRestrictions}</strong>
                  </span>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dayOffers.map((day) => {
                  const isSelectedDelivery = day.dayDate === deliveryDay;
                  return (
                    <div
                      key={day.dayDate}
                      className={cn(
                        "rounded-lg border p-3 space-y-2 transition-colors",
                        isSelectedDelivery
                          ? "border-primary/50 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                          : "border-border/60 bg-background/50",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {day.dayName}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({day.dayDate.slice(8, 10)}/{day.dayDate.slice(5, 7)})
                          </span>
                        </span>
                        {isSelectedDelivery ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                            ✓ Día de entrega
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectDeliveryDay(day.dayDate)}
                            className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted/50 transition-colors"
                            title={`Cambiar fecha de entrega a ${day.dayName}`}
                          >
                            Seleccionar este día
                          </button>
                        )}
                      </div>

                      {day.dishes.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground italic py-1">
                          Sin platos programados
                        </p>
                      ) : (
                        <ul className="space-y-1.5 divide-y divide-border/40">
                          {day.dishes.map((dish) => {
                            const priceNum = Number(dish.price ?? 0);
                            const priceFmt =
                              priceNum > 0 ? `${priceNum.toFixed(2).replace(".", ",")} €` : "";

                            return (
                              <li
                                key={dish.id}
                                className="pt-1.5 first:pt-0 flex items-start justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">
                                    {dish.name}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                    {priceFmt ? (
                                      <span className="font-semibold text-foreground">
                                        {priceFmt}
                                      </span>
                                    ) : null}
                                    {dish.allergens && dish.allergens.length > 0 ? (
                                      <span>· {dish.allergens.join(", ")}</span>
                                    ) : null}
                                  </div>
                                </div>
                                {isSelectedDelivery ? (
                                  <button
                                    type="button"
                                    onClick={() => onAddDish(dish.id, dish.name)}
                                    className="shrink-0 inline-flex items-center justify-center rounded border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:bg-foreground hover:text-background transition-colors"
                                    title="Añadir al pedido"
                                  >
                                    + Añadir
                                  </button>
                                ) : (
                                  <span className="shrink-0 text-[11px] text-muted-foreground italic px-1.5 py-1">
                                    Solo lectura
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
