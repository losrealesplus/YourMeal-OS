/**
 * CUSTOMER EXPERIENCE 005 · Zero Friction Customer Growth
 * (+ CX001–004 Create · Search · Edit · Organization on the same surface)
 *
 * Experience above useCustomer() only — no Capability / Facade edits.
 * Mission KPI: frequent enrichment < 30s · Living Customer Profile
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useRef, useState, useEffectEvent } from "react";
import { toast } from "sonner";
import {
  AdminHeader,
  SectionTitle,
  StatusChip,
} from "@/components/admin";
import { useCustomer } from "@/customer/useCustomer";
import { useIdentity } from "@/identity/useIdentity";
import {
  archiveCustomerCommand,
  createCustomerCommand,
} from "@/customer/CustomerCommands";
import {
  getCustomerQuery,
  listRecentCustomersQuery,
  searchCustomersQuery,
} from "@/customer/CustomerQueries";
import type {
  CustomerContext,
  CustomerSummary,
  PartyKind,
  PartyRef,
} from "@/customer/CustomerContext";
import {
  CUSTOMER_CREATION_ORIGIN_LABEL,
  recordCustomerCreationOrigin,
  type CustomerCreationOrigin,
} from "@/customer-experience/creation-origin";
import {
  companyCodeFromTags,
  customerTypeLabel,
  rankSearchHits,
} from "@/customer-experience/search-rank";
import { applyOperationalCorrection } from "@/customer-experience/operational-corrections";
import { CustomerEditPanel } from "@/customer-experience/CustomerEditPanel";
import { OrganizationPanel } from "@/customer-experience/OrganizationPanel";
import { cn } from "@/lib/utils";

/** Silent origin for altas from this Experience surface. */
const CREATE_ORIGIN: CustomerCreationOrigin = "customer_workspace";

type SearchHit = {
  summary: CustomerSummary;
  phone: string | null;
  area: string | null;
  companyLabel: string | null;
};

export const Route = createFileRoute(
  "/_authenticated/admin/customer-workspace",
)({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "customers.read");
  },
  component: CustomerExperiencePage,
  head: () => ({
    meta: [
      {
        title: "YourMeal OS — Zero Friction Customer Growth",
      },
      {
        name: "description",
        content: "Living Customer Profile · CX005 · useCustomer only",
      },
    ],
  }),
});

type Segment = "all" | PartyKind;
type PartyChoice = "individual" | "company_account" | "company_employee" | null;

type CreateDraft = {
  name: string;
  phone: string;
  address: string;
  city: string;
  contactEmail: string;
};

const emptyDraft = (): CreateDraft => ({
  name: "",
  phone: "",
  address: "",
  city: "",
  contactEmail: "",
});

function hitKey(s: CustomerSummary) {
  return `${s.partyKind}:${s.id}`;
}

function CustomerExperiencePage() {
  const customer = useCustomer();
  const identity = useIdentity();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [selected, setSelected] = useState<CustomerContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [partyChoice, setPartyChoice] = useState<PartyChoice>(null);
  const [draft, setDraft] = useState<CreateDraft>(emptyDraft);
  const [justCreated, setJustCreated] = useState(false);
  const [createdFromLabel, setCreatedFromLabel] = useState<string | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const newCustomerRef = useRef<HTMLButtonElement>(null);
  const nextActionRef = useRef<HTMLAnchorElement>(null);
  const caps = identity.permissions.capabilities;
  const canWrite = caps.includes("customers.write");

  const enrichSummaries = useEffectEvent(
    async (summaries: CustomerSummary[], q: string): Promise<SearchHit[]> => {
      const slice = summaries.slice(0, 20);
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
            const ctx = result.context;
            const phone = ctx.profile?.phones?.[0]?.e164?.trim() || null;
            const area =
              ctx.profile?.addresses
                ?.map((a) => a.city || a.line1)
                .find((v) => v?.trim())
                ?.trim() || null;
            const companyLabel =
              companyCodeFromTags(summary) ||
              (ctx.companyAccountId && summary.partyKind === "individual"
                ? "Empresa vinculada"
                : summary.partyKind === "company_account"
                  ? summary.displayName
                  : null);
            return { summary, phone, area, companyLabel };
          } catch {
            return base;
          }
        }),
      );
      return rankSearchHits(enriched, q);
    },
  );

  const loadList = useEffectEvent(async (q: string, kind: Segment) => {
    if (!customer.isReady) return;
    setLoading(true);
    try {
      const partyKind = kind === "all" ? "all" : kind;
      const result = q.trim()
        ? await customer.searchCustomers(
            searchCustomersQuery({
              query: q.trim(),
              limit: 40,
              partyKind,
            }),
          )
        : await customer.listRecentCustomers(
            listRecentCustomersQuery({ limit: 20, partyKind }),
          );
      if (!result.ok) {
        toast.error(result.errors[0]?.message ?? "Search failed");
        setHits([]);
        return;
      }
      const ranked = await enrichSummaries(result.summaries, q);
      setHits(ranked);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadList(query, segment);
    }, 160);
    return () => window.clearTimeout(handle);
  }, [query, segment, customer.isReady]);

  useEffect(() => {
    if (!creating) {
      searchRef.current?.focus();
    }
  }, [creating, customer.isReady]);

  useEffect(() => {
    if (creating && partyChoice) {
      nameRef.current?.focus();
    }
  }, [creating, partyChoice]);

  const openParty = useCallback(
    async (partyRef: PartyRef) => {
      setBusy(true);
      try {
        const result = await customer.getCustomer(
          getCustomerQuery({ partyRef }),
        );
        if (!result.ok || !result.context) {
          toast.error(result.errors[0]?.message ?? "Not found");
          setSelected(null);
          return;
        }
        setSelected(applyOperationalCorrection(result.context));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [customer],
  );

  function startCreate() {
    setCreating(true);
    setOrganizing(false);
    setPartyChoice(null);
    setDraft(emptyDraft());
    setSelected(null);
    setJustCreated(false);
    setCreatedFromLabel(null);
  }

  function startOrganization() {
    setOrganizing(true);
    setCreating(false);
    setPartyChoice(null);
    setDraft(emptyDraft());
    setSelected(null);
    setJustCreated(false);
    setCreatedFromLabel(null);
  }

  function cancelCreate() {
    setCreating(false);
    setPartyChoice(null);
    setDraft(emptyDraft());
  }

  function cancelOrganization() {
    setOrganizing(false);
  }

  function finishCreateSuccess(input: {
    partyRef: PartyRef;
    segment: Segment;
    toastMessage: string;
  }) {
    const event = recordCustomerCreationOrigin({
      origin: CREATE_ORIGIN,
      partyKind: input.partyRef.kind,
      partyId: input.partyRef.id,
    });
    setCreatedFromLabel(CUSTOMER_CREATION_ORIGIN_LABEL[event.origin]);
    cancelCreate();
    setJustCreated(true);
    setSegment(input.segment);
    toast.success(input.toastMessage);
    window.setTimeout(() => nextActionRef.current?.focus(), 0);
  }

  async function onSaveCreate() {
    if (!customer.isReady || !canWrite || !partyChoice) return;
    if (!draft.name.trim()) {
      toast.error("Nombre es imprescindible para seguir trabajando");
      nameRef.current?.focus();
      return;
    }
    setBusy(true);
    const started = performance.now();
    try {
      if (partyChoice === "individual" || partyChoice === "company_employee") {
        const result = await customer.createCustomer(
          createCustomerCommand({
            partyKind: "individual",
            mode: "staff_create",
            displayName: draft.name.trim(),
            phone: draft.phone.trim() || null,
            street: draft.address.trim() || null,
            city: draft.city.trim() || null,
          }),
        );
        if (!result.ok) {
          toast.error(result.errors[0]?.message ?? "No se pudo crear");
          return;
        }
        if (!result.partyRef) {
          toast.error("Cliente creado sin referencia");
          return;
        }
        const ms = Math.round(performance.now() - started);
        finishCreateSuccess({
          partyRef: result.partyRef,
          segment: "individual",
          toastMessage:
            partyChoice === "company_employee"
              ? `Trabajador creado · ${ms} ms · vinculación a organización: Progressive Completion`
              : `Cliente creado · ${ms} ms (objetivo TTC < 30s)`,
        });
        await openParty(result.partyRef);
        await loadList(query, "individual");
        return;
      }

      // Organización — mínimo + email requerido por substrate (Progressive)
      const email =
        draft.contactEmail.trim() ||
        `pending+${Date.now()}@customer.local`;
      const result = await customer.createCustomer(
        createCustomerCommand({
          partyKind: "company_account",
          mode: "provision",
          name: draft.name.trim(),
          contactName: draft.name.trim(),
          contactEmail: email,
          contactPhone: draft.phone.trim() || null,
          fiscalAddress: draft.address.trim() || "Por completar",
          deliveryAddress: draft.address.trim() || null,
        }),
      );
      if (!result.ok) {
        toast.error(result.errors[0]?.message ?? "No se pudo crear");
        return;
      }
      if (!result.partyRef) {
        toast.error("Organización creada sin referencia");
        return;
      }
      const ms = Math.round(performance.now() - started);
      finishCreateSuccess({
        partyRef: result.partyRef,
        segment: "company_account",
        toastMessage: `Organización creada · ${ms} ms · preferir Nueva organización (CX004)`,
      });
      await openParty(result.partyRef);
      await loadList(query, "company_account");
    } finally {
      setBusy(false);
    }
  }

  function goBackFromCreated() {
    setJustCreated(false);
    setCreatedFromLabel(null);
    setSelected(null);
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }

  async function onArchive() {
    if (!selected || selected.summary.partyKind !== "individual") return;
    await onArchiveParty({
      kind: "individual",
      id: selected.summary.id,
    });
  }

  async function onArchiveParty(partyRef: PartyRef) {
    if (partyRef.kind !== "individual") return;
    if (!canWrite) {
      toast.error("Missing customers.write");
      return;
    }
    if (!window.confirm("¿Archivar este cliente individual?")) return;
    setBusy(true);
    try {
      const result = await customer.archiveCustomer(
        archiveCustomerCommand({ partyRef }),
      );
      if (!result.ok) {
        toast.error(result.errors[0]?.message ?? "Archive failed");
        return;
      }
      toast.success("Cliente archivado");
      if (selected?.summary.id === partyRef.id) {
        setSelected(null);
      }
      setJustCreated(false);
      setCreatedFromLabel(null);
      await loadList(query, segment);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-5xl">
      <SectionTitle
        overline="CUSTOMER EXPERIENCE 005 · Phase 005 Growth"
        title="Zero Friction Customer Growth"
        subtitle="El perfil crece con la relación — nunca antes"
      />

      <div className="mb-4 grid gap-2 rounded-md border border-foreground/15 bg-foreground/[0.03] px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Enrich profile" value="< 30 s" primary />
        <Kpi label="Resume operation" value="< 5 s" />
        <Kpi label="TTO · Organization" value="< 45 s" />
        <Kpi label="TTE · Edit" value="< 20 s" />
      </div>

      <AdminHeader
        goal="Enriquecer cuando aporte valor — nunca bloquear por incompleto"
        capability="customers.read / customers.write"
        object="Living Profile · Preferencias · Alergias · Facturación · Tags"
      />

      {!creating && !organizing ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canWrite || busy}
            onClick={startOrganization}
            className="min-h-11 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-40"
          >
            Nueva organización
          </button>
          <button
            ref={newCustomerRef}
            type="button"
            disabled={!canWrite || busy}
            onClick={startCreate}
            className="min-h-11 rounded-md border border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            Nuevo cliente
          </button>
        </div>
      ) : null}

      {creating ? (
        <CreateWizard
          partyChoice={partyChoice}
          draft={draft}
          busy={busy}
          nameRef={nameRef}
          onChoose={setPartyChoice}
          onDraft={setDraft}
          onCancel={cancelCreate}
          onSave={() => void onSaveCreate()}
        />
      ) : null}

      {organizing ? (
        <OrganizationPanel
          canWrite={canWrite}
          busy={busy}
          onBusy={setBusy}
          onOpenParty={openParty}
          onCreatedOrganization={(ctx) => {
            setSelected(ctx);
            setSegment("company_account");
            void loadList(query, "company_account");
          }}
          onCancel={cancelOrganization}
          viewing={null}
        />
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Segmento">
        {(
          [
            ["all", "Todos"],
            ["individual", "Particular"],
            ["company_account", "Organizaciones"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={segment === value}
            onClick={() => setSegment(value)}
            className={cn(
              "min-h-10 rounded-md border px-3 py-2 text-sm font-semibold",
              segment === value
                ? "border-foreground bg-foreground text-background"
                : "border-border",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <label
            htmlFor="cx-search"
            className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
          >
            Buscar · escribe y encuentra · sin botón
          </label>
          <input
            id="cx-search"
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, teléfono, empresa…"
            className="mb-3 min-h-12 w-full rounded-md border border-foreground/25 bg-background px-3 py-3 text-base font-medium sm:text-sm"
            autoComplete="off"
            enterKeyHint="search"
            aria-label="Buscar cliente"
          />
          <p className="mb-3 text-[11px] text-muted-foreground">
            {query.trim()
              ? "Resultados al escribir · coincidencia parcial"
              : "Recientes · escribe para buscar"}
          </p>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Buscando…
            </p>
          ) : hits.length === 0 ? (
            <SearchEmptyState
              hasQuery={Boolean(query.trim())}
              canWrite={canWrite}
              onCreate={() => {
                startCreate();
                window.setTimeout(() => newCustomerRef.current?.focus(), 0);
              }}
            />
          ) : (
            <ul className="space-y-2">
              {hits.map((hit) => (
                <li key={hitKey(hit.summary)}>
                  <SearchResultCard
                    hit={hit}
                    selected={
                      selected?.summary.id === hit.summary.id &&
                      selected.summary.partyKind === hit.summary.partyKind
                    }
                    canWrite={canWrite}
                    busy={busy}
                    onOpen={() => {
                      setJustCreated(false);
                      void openParty({
                        kind: hit.summary.partyKind,
                        id: hit.summary.id,
                      });
                    }}
                    onArchive={
                      hit.summary.partyKind === "individual" && canWrite
                        ? () =>
                            void onArchiveParty({
                              kind: "individual",
                              id: hit.summary.id,
                            })
                        : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {selected?.summary.partyKind === "company_account"
              ? "Organización · TTO < 45s"
              : "Cliente · editar sin interrumpir · TTE < 20s"}
          </p>
          {!selected ? (
            <p className="rounded-md border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
              Busca · abre · corrige · o crea una organización
            </p>
          ) : selected.summary.partyKind === "company_account" ? (
            <OrganizationPanel
              canWrite={canWrite && selected.permissions.canWrite}
              busy={busy}
              onBusy={setBusy}
              onOpenParty={async (ref) => {
                setOrganizing(false);
                setJustCreated(false);
                await openParty(ref);
              }}
              onCreatedOrganization={(ctx) => {
                setSelected(ctx);
                setSegment("company_account");
                void loadList(query, "company_account");
              }}
              onCancel={() => {
                setOrganizing(false);
              }}
              viewing={selected}
            />
          ) : (
            <CustomerEditPanel
              context={selected}
              busy={busy}
              canWrite={canWrite && selected.permissions.canWrite}
              justCreated={justCreated}
              createdFromLabel={createdFromLabel}
              onContext={setSelected}
              onBusy={setBusy}
              onArchive={() => void onArchive()}
              nextBestAction={
                justCreated ? (
                  <NextBestAction
                    primaryRef={nextActionRef}
                    createdFromLabel={createdFromLabel}
                    onCreateOrder={() => {}}
                    onOpenCustomer={() => {
                      setJustCreated(false);
                    }}
                    onCreateAnother={() => {
                      startCreate();
                    }}
                    onBack={goBackFromCreated}
                  />
                ) : null
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}

function CreateWizard(props: {
  partyChoice: PartyChoice;
  draft: CreateDraft;
  busy: boolean;
  nameRef: React.RefObject<HTMLInputElement | null>;
  onChoose: (p: PartyChoice) => void;
  onDraft: (fn: (d: CreateDraft) => CreateDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { partyChoice, draft, busy, nameRef, onChoose, onDraft, onCancel, onSave } =
    props;

  return (
    <div className="mb-6 rounded-md border border-border p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Nuevo cliente · alta mínima</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground underline underline-offset-2"
        >
          Cancelar
        </button>
      </div>

      {!partyChoice ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            ¿Qué tipo de cliente vas a crear?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChoose("individual")}
              className="min-h-11 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
            >
              Particular
            </button>
            <button
              type="button"
              onClick={() => onChoose("company_account")}
              className="min-h-11 rounded-md border border-border px-4 py-2.5 text-sm font-semibold"
            >
              Organización
            </button>
            <button
              type="button"
              onClick={() => onChoose("company_employee")}
              className="min-h-11 rounded-md border border-border px-4 py-2.5 text-sm font-semibold"
            >
              Trabajador
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Una pregunta. El formulario solo muestra lo relevante (Manifesto ·
            carga cognitiva mínima).
          </p>
        </div>
      ) : (
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <p className="sm:col-span-2 text-xs text-muted-foreground">
            {partyChoice === "individual"
              ? "Particular"
              : partyChoice === "company_account"
                ? "Organización"
                : "Trabajador"}{" "}
            · solo lo imprescindible (EXPERIENCE LAW 001)
            {partyChoice === "company_employee"
              ? " · Empleado de empresa / trabajador · vinculación a organización después (Progressive Completion)"
              : ""}
          </p>
          <label className="sm:col-span-2 block text-xs">
            <span className="mb-1 block text-muted-foreground">Nombre *</span>
            <input
              ref={nameRef}
              value={draft.name}
              onChange={(e) =>
                onDraft((d) => ({ ...d, name: e.target.value }))
              }
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
              autoComplete="name"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-muted-foreground">Teléfono</span>
            <input
              value={draft.phone}
              onChange={(e) =>
                onDraft((d) => ({ ...d, phone: e.target.value }))
              }
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
              autoComplete="tel"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-muted-foreground">Ciudad</span>
            <input
              value={draft.city}
              onChange={(e) =>
                onDraft((d) => ({ ...d, city: e.target.value }))
              }
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
            />
          </label>
          <label className="sm:col-span-2 block text-xs">
            <span className="mb-1 block text-muted-foreground">Dirección</span>
            <input
              value={draft.address}
              onChange={(e) =>
                onDraft((d) => ({ ...d, address: e.target.value }))
              }
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
              autoComplete="street-address"
            />
          </label>
          {partyChoice === "company_account" ? (
            <label className="sm:col-span-2 block text-xs">
              <span className="mb-1 block text-muted-foreground">
                Email contacto (opcional ahora · Progressive)
              </span>
              <input
                value={draft.contactEmail}
                onChange={(e) =>
                  onDraft((d) => ({ ...d, contactEmail: e.target.value }))
                }
                className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
                autoComplete="email"
                type="email"
              />
            </label>
          ) : null}
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-40"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => onChoose(null)}
              className="min-h-11 rounded-md border border-border px-3 py-2.5 text-sm font-semibold"
            >
              Cambiar tipo
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function SearchEmptyState(props: {
  hasQuery: boolean;
  canWrite: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-md border border-dashed border-border px-4 py-10 text-center space-y-4">
      <div>
        <p className="text-sm font-semibold">
          {props.hasQuery ? "No se encontró el cliente" : "Sin recientes todavía"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {props.hasQuery
            ? "Ningún callejón sin salida — créalo y sigue trabajando."
            : "Escribe para buscar · o crea el primero."}
        </p>
      </div>
      {props.canWrite ? (
        <button
          type="button"
          onClick={props.onCreate}
          className="min-h-11 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
        >
          Crear cliente
        </button>
      ) : null}
    </div>
  );
}

function SearchResultCard(props: {
  hit: SearchHit;
  selected: boolean;
  canWrite: boolean;
  busy: boolean;
  onOpen: () => void;
  onArchive?: () => void;
}) {
  const { hit } = props;
  const typeLabel = customerTypeLabel(hit.summary);
  const phoneHref = hit.phone
    ? `tel:${hit.phone.replace(/[^\d+]/g, "")}`
    : null;
  const waHref = hit.phone
    ? `https://wa.me/${hit.phone.replace(/\D/g, "")}`
    : null;
  const mapsHref = hit.area
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${hit.summary.displayName} ${hit.area}`,
      )}`
    : null;

  return (
    <article
      className={cn(
        "rounded-md border border-border px-3 py-3 space-y-2",
        props.selected && "border-foreground/40 bg-muted/40",
      )}
    >
      <button
        type="button"
        onClick={props.onOpen}
        className="flex w-full min-h-11 items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {hit.summary.displayName}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {typeLabel}
            {hit.companyLabel ? ` · ${hit.companyLabel}` : ""}
            {hit.phone ? ` · ${hit.phone}` : ""}
            {hit.area ? ` · ${hit.area}` : ""}
          </p>
        </div>
        <StatusChip
          tone={
            hit.summary.status === "inactive" ||
            hit.summary.status === "archived"
              ? "danger"
              : "positive"
          }
          label={hit.summary.status}
        />
      </button>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={props.busy}
          onClick={props.onOpen}
          className="min-h-10 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold"
        >
          Abrir
        </button>
        <Link
          to="/admin/order-workspace"
          className="inline-flex min-h-10 items-center rounded-md bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background"
        >
          Crear pedido
        </Link>
        {phoneHref ? (
          <a
            href={phoneHref}
            className="inline-flex min-h-10 items-center rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold"
          >
            Llamar
          </a>
        ) : (
          <span className="inline-flex min-h-10 items-center rounded-md border border-dashed border-border px-2.5 py-1.5 text-[11px] text-muted-foreground">
            Llamar · —
          </span>
        )}
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center rounded-md border border-dashed border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground"
          >
            WhatsApp · pronto
          </a>
        ) : null}
        {mapsHref ? (
          <a
            href={mapsHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center rounded-md border border-dashed border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground"
          >
            Cómo llegar · pronto
          </a>
        ) : null}
        {props.onArchive ? (
          <button
            type="button"
            disabled={props.busy || !props.canWrite}
            onClick={props.onArchive}
            className="min-h-10 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            Archivar
          </button>
        ) : null}
      </div>
    </article>
  );
}

function NextBestAction(props: {
  primaryRef: React.RefObject<HTMLAnchorElement | null>;
  createdFromLabel: string | null;
  onCreateOrder: () => void;
  onOpenCustomer: () => void;
  onCreateAnother: () => void;
  onBack: () => void;
}) {
  return (
    <div
      className="rounded-md border border-foreground/20 bg-foreground/[0.04] px-3 py-3 space-y-3"
      role="region"
      aria-label="Siguiente mejor acción"
    >
      <div>
        <p className="text-sm font-semibold">Cliente creado</p>
        <p className="text-xs text-muted-foreground">
          ¿Qué quieres hacer ahora?
          {props.createdFromLabel
            ? ` · alta desde ${props.createdFromLabel}`
            : ""}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          ref={props.primaryRef}
          to="/admin/order-workspace"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
          onClick={props.onCreateOrder}
        >
          Crear pedido
        </Link>
        <button
          type="button"
          onClick={props.onOpenCustomer}
          className="min-h-11 rounded-md border border-border px-4 py-2.5 text-sm font-semibold"
        >
          Abrir cliente
        </button>
        <button
          type="button"
          onClick={props.onCreateAnother}
          className="min-h-11 rounded-md border border-border px-4 py-2.5 text-sm font-semibold"
        >
          Crear otro cliente
        </button>
        <button
          type="button"
          onClick={props.onBack}
          className="min-h-11 rounded-md border border-dashed border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground"
        >
          Volver
        </button>
      </div>
    </div>
  );
}

function Kpi(props: { label: string; value: string; primary?: boolean }) {
  return (
    <div className={props.primary ? "sm:col-span-1" : undefined}>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {props.label}
        {props.primary ? " · mission" : ""}
      </p>
      <p
        className={cn(
          "text-sm font-semibold",
          props.primary && "text-base",
        )}
      >
        {props.value}
      </p>
    </div>
  );
}
