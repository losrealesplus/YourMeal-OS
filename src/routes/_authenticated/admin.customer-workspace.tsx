/**
 * Sprint 001 · Epic 1 · Customer Experience (parallel track)
 *
 * Experience layer on CustomerFacade only (FOUNDATION LAW 003).
 * Not Architecture · not a new Capability.
 *
 * Honest gaps: UpdateCustomer / RestoreCustomer / some facets remain UNIMPLEMENTED.
 * Observation evidence still required (TENANT SUCCESS LAW 001) — this track is hybrid.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useState, useEffectEvent } from "react";
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
  restoreCustomerCommand,
  updateCustomerCommand,
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
      { title: "YourMeal OS — Customer Experience" },
      {
        name: "description",
        content:
          "Customer Experience: Demand Party via CustomerFacade (LAW 003).",
      },
    ],
  }),
});

type Segment = "all" | PartyKind;

type CompanyForm = {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  fiscalAddress: string;
  deliveryAddress: string;
};

const emptyCompanyForm = (): CompanyForm => ({
  name: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  fiscalAddress: "",
  deliveryAddress: "",
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
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [companyForm, setCompanyForm] = useState<CompanyForm>(emptyCompanyForm);
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

  async function onArchive() {
    if (!selected || selected.summary.partyKind !== "individual") return;
    if (!selected.permissions.canWrite) {
      toast.error("Missing customers.write");
      return;
    }
    if (!window.confirm("¿Archivar este cliente individual?")) {
      return;
    }
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
      await loadList(query, segment);
    } finally {
      setBusy(false);
    }
  }

  async function onEnsureSession() {
    if (!customer.isReady || !canWrite) return;
    setBusy(true);
    try {
      const result = await customer.createCustomer(
        createCustomerCommand({
          partyKind: "individual",
          mode: "ensure_for_session",
        }),
      );
      if (!result.ok) {
        toast.error(result.errors[0]?.message ?? "Create failed");
        return;
      }
      toast.success("Cliente individual listo para esta sesión");
      if (result.partyRef) await openParty(result.partyRef);
      await loadList(query, segment);
    } finally {
      setBusy(false);
    }
  }

  async function onProvisionCompany() {
    if (!customer.isReady || !canWrite) return;
    if (
      !companyForm.name.trim() ||
      !companyForm.contactName.trim() ||
      !companyForm.contactEmail.trim() ||
      !companyForm.fiscalAddress.trim()
    ) {
      toast.error("Nombre, contacto, email y dirección fiscal son obligatorios");
      return;
    }
    setBusy(true);
    try {
      const result = await customer.createCustomer(
        createCustomerCommand({
          partyKind: "company_account",
          mode: "provision",
          name: companyForm.name.trim(),
          contactName: companyForm.contactName.trim(),
          contactEmail: companyForm.contactEmail.trim(),
          contactPhone: companyForm.contactPhone.trim() || null,
          fiscalAddress: companyForm.fiscalAddress.trim(),
          deliveryAddress: companyForm.deliveryAddress.trim() || null,
        }),
      );
      if (!result.ok) {
        toast.error(result.errors[0]?.message ?? "Provision failed");
        return;
      }
      toast.success("Empresa creada");
      setCompanyForm(emptyCompanyForm());
      setShowCompanyForm(false);
      if (result.partyRef) await openParty(result.partyRef);
      await loadList(query, "company_account");
      setSegment("company_account");
    } finally {
      setBusy(false);
    }
  }

  async function onProbeUnimplemented(kind: "update" | "restore") {
    if (!selected) return;
    const partyRef: PartyRef = {
      kind: selected.summary.partyKind,
      id: selected.summary.id,
    };
    setBusy(true);
    try {
      const result =
        kind === "update"
          ? await customer.updateCustomer(
              updateCustomerCommand({
                partyRef,
                patch: { displayName: "probe" },
              }),
            )
          : await customer.restoreCustomer(
              restoreCustomerCommand({ partyRef }),
            );
      const code = result.errors[0]?.code ?? "UNKNOWN";
      toast.message(
        kind === "update" ? "Edición aún no disponible" : "Restaurar aún no disponible",
        { description: `Honestidad Facade: ${code}` },
      );
    } finally {
      setBusy(false);
    }
  }

  const profile = selected?.profile;
  const isEmployee = selected?.summary.tags.some((t) =>
    t.includes("company_employee"),
  );

  return (
    <div className="animate-fade-in max-w-5xl">
      <SectionTitle
        overline="Sprint 001 · Epic 1 · Customer Experience"
        title="Clientes"
        subtitle="Crear, buscar y segmentar sin pensar en la base de datos. Solo CustomerFacade."
      />

      <AdminHeader
        goal="Alta y mantenimiento de demand parties con menos fricción"
        capability="customers.read / customers.write"
        object="Individual · Company · Company Employee (tags)"
      />

      <div className="mb-6 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
        <p className="text-muted-foreground">
          Tenant: {identity.tenant?.slug ?? "—"} · Operator:{" "}
          {identity.currentUser?.fullName ?? identity.session.userId ?? "—"} ·
          Ready: {customer.isReady ? "yes" : "no"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Hybrid track: no sustituye la sesión de observación con Isabella.{" "}
          <Link
            to="/admin/customers"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Directorio legacy
          </Link>
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["all", "Todos"],
            ["individual", "Individual"],
            ["company_account", "Empresa"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setSegment(value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-semibold",
              segment === value
                ? "border-foreground bg-foreground text-background"
                : "border-border",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!customer.isReady || busy || !canWrite}
          onClick={() => void onEnsureSession()}
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
        >
          Asegurar cliente de sesión
        </button>
        <button
          type="button"
          disabled={!canWrite || busy}
          onClick={() => setShowCompanyForm((v) => !v)}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          {showCompanyForm ? "Cerrar alta empresa" : "Nueva empresa"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void loadList(query, segment)}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold"
        >
          Actualizar lista
        </button>
      </div>

      {showCompanyForm ? (
        <div className="mb-6 grid gap-3 rounded-md border border-border p-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Alta empresa · CreateCustomer · provision
          </p>
          {(
            [
              ["name", "Nombre empresa *"],
              ["contactName", "Contacto *"],
              ["contactEmail", "Email contacto *"],
              ["contactPhone", "Teléfono"],
              ["fiscalAddress", "Dirección fiscal *"],
              ["deliveryAddress", "Dirección entrega"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs">
              <span className="mb-1 block text-muted-foreground">{label}</span>
              <input
                value={companyForm[key]}
                onChange={(e) =>
                  setCompanyForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          ))}
          <div className="sm:col-span-2">
            <button
              type="button"
              disabled={busy || !canWrite}
              onClick={() => void onProvisionCompany()}
              className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
            >
              Crear empresa
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section>
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Buscar cliente
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, email, código…"
            className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Cargando…
            </p>
          ) : summaries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin resultados
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {summaries.map((s) => (
                <li key={`${s.partyKind}:${s.id}`}>
                  <button
                    type="button"
                    onClick={() =>
                      void openParty({ kind: s.partyKind, id: s.id })
                    }
                    className={cn(
                      "flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/40",
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
                            ? "Empleado empresa"
                            : "Individual"
                          : "Empresa"}
                        {s.tags.length > 0 ? ` · ${s.tags.slice(0, 2).join(" · ")}` : ""}
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
            Ficha
          </p>
          {!selected ? (
            <p className="rounded-md border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
              Selecciona un cliente
            </p>
          ) : (
            <div className="rounded-md border border-border p-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {selected.summary.displayName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selected.summary.partyKind === "individual"
                    ? isEmployee
                      ? "Empleado de empresa"
                      : "Individual"
                    : "Empresa"}
                  {selected.companyAccountId
                    ? ` · company ${selected.companyAccountId.slice(0, 8)}…`
                    : ""}
                </p>
              </div>

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
                {profile?.phones?.length ? (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Teléfonos</dt>
                    <dd className="font-semibold">
                      {profile.phones.map((p) => p.e164).join(" · ")}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <FacetBlock
                title="Direcciones / entrega"
                empty="Sin direcciones en ficha (individual delivery locations: pendiente)."
                items={
                  profile?.addresses?.map(
                    (a) =>
                      `${a.label ?? "Dir"}: ${a.line1}${a.city ? `, ${a.city}` : ""}`,
                  ) ?? []
                }
                extra={
                  selected.deliveryLocation
                    ? `Delivery ref: ${selected.deliveryLocation.kind}`
                    : null
                }
              />

              <FacetBlock
                title="Preferencias"
                empty="Sin preferencias cargadas en Facade aún."
                items={Object.keys(profile?.preferences ?? {}).map(
                  (k) => `${k}: ${String((profile?.preferences ?? {})[k])}`,
                )}
              />

              <FacetBlock
                title="Restricciones / alérgenos"
                empty="Sin alérgenos en ficha (CRUD admin pendiente — no inventar)."
                items={
                  profile?.allergens?.map(
                    (a) => `${a.code}${a.note ? ` — ${a.note}` : ""}`,
                  ) ?? []
                }
              />

              <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-border">
                <button
                  type="button"
                  disabled={
                    busy ||
                    !selected.permissions.canWrite ||
                    selected.summary.partyKind !== "individual"
                  }
                  onClick={() => void onArchive()}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Archivar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onProbeUnimplemented("update")}
                  className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground"
                >
                  Editar (aún no)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onProbeUnimplemented("restore")}
                  className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground"
                >
                  Restaurar (aún no)
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FacetBlock(props: {
  title: string;
  empty: string;
  items: string[];
  extra?: string | null;
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
      {props.extra ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{props.extra}</p>
      ) : null}
    </div>
  );
}
