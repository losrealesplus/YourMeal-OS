/**
 * CUSTOMER EXPERIENCE 001 · Phase 1 · Zero Friction Customer Management
 *
 * Experience above existing useCustomer() only — no Capability / Facade edits here.
 * Mission: TTC < 30s · EXPERIENCE MANIFESTO 001
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
import { cn } from "@/lib/utils";

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
        title: "YourMeal OS — Zero Friction Customer Management",
      },
      {
        name: "description",
        content: "TTC < 30s · EXPERIENCE LAW 001 · useCustomer only",
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
  /** Company-only progressive: contact email when needed by substrate */
  contactEmail: string;
};

const emptyDraft = (): CreateDraft => ({
  name: "",
  phone: "",
  address: "",
  city: "",
  contactEmail: "",
});

function CustomerExperiencePage() {
  const customer = useCustomer();
  const identity = useIdentity();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [summaries, setSummaries] = useState<CustomerSummary[]>([]);
  const [selected, setSelected] = useState<CustomerContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [partyChoice, setPartyChoice] = useState<PartyChoice>(null);
  const [draft, setDraft] = useState<CreateDraft>(emptyDraft);
  const [justCreated, setJustCreated] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const newCustomerRef = useRef<HTMLButtonElement>(null);
  const caps = identity.permissions.capabilities;
  const canWrite = caps.includes("customers.write");

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
        setSummaries([]);
        return;
      }
      setSummaries(result.summaries);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadList(query, segment);
    }, 200);
    return () => window.clearTimeout(handle);
  }, [query, segment, customer.isReady]);

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
        setSelected(result.context);
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
    setPartyChoice(null);
    setDraft(emptyDraft());
    setSelected(null);
    setJustCreated(false);
  }

  function cancelCreate() {
    setCreating(false);
    setPartyChoice(null);
    setDraft(emptyDraft());
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
        const ms = Math.round(performance.now() - started);
        toast.success(
          partyChoice === "company_employee"
            ? `Empleado creado · ${ms} ms · vinculación a empresa: Progressive Completion`
            : `Cliente creado · ${ms} ms (objetivo TTC < 30s)`,
        );
        cancelCreate();
        setJustCreated(true);
        setSegment("individual");
        if (result.partyRef) await openParty(result.partyRef);
        await loadList(query, "individual");
        return;
      }

      // Empresa — mínimo + email requerido por substrate (Progressive: default contact = name)
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
      const ms = Math.round(performance.now() - started);
      toast.success(`Empresa creada · ${ms} ms (objetivo TTC < 30s)`);
      cancelCreate();
      setJustCreated(true);
      setSegment("company_account");
      if (result.partyRef) await openParty(result.partyRef);
      await loadList(query, "company_account");
    } finally {
      setBusy(false);
    }
  }

  async function onArchive() {
    if (!selected || selected.summary.partyKind !== "individual") return;
    if (!selected.permissions.canWrite) {
      toast.error("Missing customers.write");
      return;
    }
    if (!window.confirm("¿Archivar este cliente individual?")) return;
    setBusy(true);
    try {
      const result = await customer.archiveCustomer(
        archiveCustomerCommand({
          partyRef: { kind: "individual", id: selected.summary.id },
        }),
      );
      if (!result.ok) {
        toast.error(result.errors[0]?.message ?? "Archive failed");
        return;
      }
      toast.success("Cliente archivado");
      setSelected(null);
      setJustCreated(false);
      await loadList(query, segment);
    } finally {
      setBusy(false);
    }
  }

  const profile = selected?.profile;
  const isEmployee = selected?.summary.tags.some((t) =>
    t.includes("company_employee"),
  );
  const primaryPhone =
    profile?.phones?.[0]?.e164?.trim() ||
    null;

  return (
    <div className="animate-fade-in max-w-5xl">
      <SectionTitle
        overline="CUSTOMER EXPERIENCE 001 · Phase 1"
        title="Zero Friction Customer Management"
        subtitle="Experience above Facade · TTC < 30s · el software desaparece"
      />

      <div className="mb-4 grid gap-2 rounded-md border border-foreground/15 bg-foreground/[0.03] px-4 py-3 sm:grid-cols-3">
        <Kpi label="TTC · Create" value="< 30 s" />
        <Kpi label="TTF · Find" value="< 10 s" />
        <Kpi label="Clicks to Create" value="≤ 6" />
      </div>

      <AdminHeader
        goal="Que Isabella no piense en el software — solo en el cliente"
        capability="customers.read / customers.write"
        object="Particular · Empresa · Empleado · Progressive Completion"
      />

      {!creating ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            ref={newCustomerRef}
            type="button"
            disabled={!canWrite || busy}
            onClick={startCreate}
            className="min-h-11 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-40"
          >
            Nuevo cliente
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              searchRef.current?.focus();
              void loadList(query, segment);
            }}
            className="min-h-11 rounded-md border border-border px-3 py-2.5 text-sm font-semibold"
          >
            Actualizar
          </button>
        </div>
      ) : (
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
      )}

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Segmento">
        {(
          [
            ["all", "Todos"],
            ["individual", "Particular"],
            ["company_account", "Empresa"],
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

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section>
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Buscar · nombre · teléfono · empresa · recientes
          </label>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ahora…"
            className="mb-3 min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
            autoComplete="off"
            enterKeyHint="search"
          />
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Cargando…
            </p>
          ) : summaries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {query.trim()
                ? "Sin resultados"
                : "Recientes · escribe para buscar"}
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {summaries.map((s) => (
                <li key={`${s.partyKind}:${s.id}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setJustCreated(false);
                      void openParty({ kind: s.partyKind, id: s.id });
                    }}
                    className={cn(
                      "flex min-h-12 w-full items-start justify-between gap-3 px-3 py-3 text-left hover:bg-muted/40",
                      selected?.summary.id === s.id && "bg-muted/50",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {s.displayName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.partyKind === "individual"
                          ? s.tags.some((t) => t.includes("company_employee"))
                            ? "Empleado"
                            : "Particular"
                          : "Empresa"}
                        {s.tags
                          .filter((t) => t.startsWith("code:"))
                          .slice(0, 1)
                          .map((t) => ` · ${t.replace("code:", "")}`)
                          .join("")}
                      </p>
                    </div>
                    <StatusChip
                      tone={
                        s.status === "inactive" || s.status === "archived"
                          ? "danger"
                          : "positive"
                      }
                      label={s.status}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Cliente · sin callejón sin salida
          </p>
          {!selected ? (
            <p className="rounded-md border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
              Selecciona o crea un cliente · Progressive Completion para el resto
            </p>
          ) : (
            <div className="space-y-4 rounded-md border border-border p-4">
              {justCreated ? (
                <p className="rounded-md bg-foreground/[0.06] px-3 py-2 text-xs font-medium">
                  Listo · cliente creado. Siguiente acción operativa ↓
                </p>
              ) : null}
              <div>
                <h3 className="text-lg font-semibold">
                  {selected.summary.displayName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selected.summary.partyKind === "individual"
                    ? isEmployee
                      ? "Empleado de empresa"
                      : "Particular"
                    : "Empresa"}
                </p>
              </div>

              <OperationalActions
                phone={primaryPhone}
                displayName={selected.summary.displayName}
              />

              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Estado</dt>
                  <dd className="font-semibold">{selected.summary.status}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Canal</dt>
                  <dd className="font-semibold">
                    {selected.summary.demandChannelDefault}
                  </dd>
                </div>
                {profile?.email ? (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-semibold">{profile.email}</dd>
                  </div>
                ) : null}
                {primaryPhone ? (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Teléfono</dt>
                    <dd className="font-semibold">{primaryPhone}</dd>
                  </div>
                ) : null}
              </dl>
              <FacetBlock
                title="Dirección"
                empty="Sin dirección · se puede completar después"
                items={
                  profile?.addresses?.map(
                    (a) =>
                      `${a.line1}${a.city ? `, ${a.city}` : ""}`,
                  ) ?? []
                }
              />
              <FacetBlock
                title="Preferencias / alergias"
                empty="Más adelante · Progressive Completion"
                items={profile?.allergens?.map((a) => a.code) ?? []}
              />
              <div className="flex flex-wrap gap-2 border-t border-dashed border-border pt-2">
                <button
                  type="button"
                  disabled={
                    busy ||
                    !selected.permissions.canWrite ||
                    selected.summary.partyKind !== "individual"
                  }
                  onClick={() => void onArchive()}
                  className="min-h-10 rounded-md border border-border px-3 py-2 text-xs font-semibold disabled:opacity-40"
                >
                  Archivar
                </button>
              </div>
            </div>
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
              Empresa
            </button>
            <button
              type="button"
              onClick={() => onChoose("company_employee")}
              className="min-h-11 rounded-md border border-border px-4 py-2.5 text-sm font-semibold"
            >
              Empleado de empresa
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
                ? "Empresa"
                : "Empleado de empresa"}{" "}
            · solo lo imprescindible (EXPERIENCE LAW 001)
            {partyChoice === "company_employee"
              ? " · vinculación a empresa después (Progressive Completion)"
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

function OperationalActions(props: {
  phone: string | null;
  displayName: string;
}) {
  const phoneHref = props.phone
    ? `tel:${props.phone.replace(/[^\d+]/g, "")}`
    : null;
  const waHref = props.phone
    ? `https://wa.me/${props.phone.replace(/\D/g, "")}`
    : null;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.displayName)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        to="/admin/order-workspace"
        className="inline-flex min-h-11 items-center rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background"
      >
        Crear pedido
      </Link>
      {phoneHref ? (
        <a
          href={phoneHref}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm font-semibold"
        >
          Llamar
        </a>
      ) : (
        <span className="inline-flex min-h-11 items-center rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          Llamar · sin teléfono
        </span>
      )}
      {waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-md border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground"
        >
          WhatsApp · pronto
        </a>
      ) : null}
      <a
        href={mapsHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center rounded-md border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground"
      >
        Mapas · pronto
      </a>
    </div>
  );
}

function Kpi(props: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {props.label}
      </p>
      <p className="text-sm font-semibold">{props.value}</p>
    </div>
  );
}

function FacetBlock(props: {
  title: string;
  empty: string;
  items: string[];
}) {
  return (
    <div className="rounded-md border border-dashed border-border/80 px-3 py-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {props.title}
      </p>
      {props.items.length === 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">{props.empty}</p>
      ) : (
        <ul className="mt-1 space-y-0.5 text-xs font-medium">
          {props.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
