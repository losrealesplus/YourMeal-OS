/**
 * OPERATIONAL-002.5 · Customer Workspace Demo
 *
 * Capability Demo — not the definitive CRM UI.
 * Proves FOUNDATION LAW 003: screen orchestrates interaction; Facade owns behaviour.
 *
 * Allowed imports: useCustomer · useIdentity · admin chrome · React.
 * Forbidden in imports: supabase · repositories · Directory/Company services · ServiceContext builder.
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
  PartyRef,
} from "@/customer/CustomerContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute(
  "/_authenticated/admin/customer-workspace",
)({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "customers.read");
  },
  component: CustomerWorkspaceDemoPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Customer Workspace (Demo)" },
      {
        name: "description",
        content:
          "Capability Demo: Demand Party via CustomerFacade only (LAW 003).",
      },
    ],
  }),
});

function CustomerWorkspaceDemoPage() {
  const customer = useCustomer();
  const identity = useIdentity();
  const [query, setQuery] = useState("");
  const [summaries, setSummaries] = useState<CustomerSummary[]>([]);
  const [selected, setSelected] = useState<CustomerContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const caps = identity.permissions.capabilities;
  const canWrite = caps.includes("customers.write");

  const loadList = useEffectEvent(async (q: string) => {
    if (!customer.isReady) return;
    setLoading(true);
    try {
      const result = q.trim()
        ? await customer.searchCustomers(
            searchCustomersQuery({ query: q.trim(), limit: 40 }),
          )
        : await customer.listRecentCustomers(
            listRecentCustomersQuery({ limit: 20 }),
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
      void loadList(query);
    }, 200);
    return () => window.clearTimeout(handle);
  }, [query, customer.isReady]);

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
    if (!window.confirm("¿Archivar este Individual Customer? (soft delete)")) {
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
      toast.success("Archivado vía ArchiveCustomerCommand");
      setSelected(null);
      await loadList(query);
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
      toast.success("CreateCustomerCommand · ensure_for_session");
      if (result.partyRef) await openParty(result.partyRef);
      await loadList(query);
    } finally {
      setBusy(false);
    }
  }

  async function onProbeUnimplemented(
    kind: "update" | "restore",
  ) {
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
      toast.message(`${kind === "update" ? "Update" : "Restore"}Customer`, {
        description: `Expected honesty: ${code}`,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-5xl">
      <SectionTitle
        overline="Operational Experience · Capability Demo"
        title="Customer Workspace"
        subtitle="Demuestra LAW 003: la pantalla orquesta; CustomerFacade posee el comportamiento. No es el CRM definitivo."
      />

      <AdminHeader
        goal="Probar Demand Party vía Facade (sin Supabase en UI)"
        capability="customers.read / customers.write"
        object="CustomerSummary · CustomerContext"
      />

      <div className="mb-6 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm">
        <p className="font-semibold text-foreground">
          Screen → useCustomer() → CustomerFacade → Services → Repos
        </p>
        <p className="mt-1 text-muted-foreground">
          Tenant: {identity.tenant?.slug ?? "—"} · Operator:{" "}
          {identity.currentUser?.fullName ?? identity.session.userId ?? "—"} ·
          Ready: {customer.isReady ? "yes" : "no"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Legacy CRUD:{" "}
          <Link
            to="/admin/customers"
            className="underline underline-offset-2 hover:text-foreground"
          >
            /admin/customers
          </Link>{" "}
          (aún no migrado a Facade — esta demo es el camino canónico).
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!customer.isReady || busy || !canWrite}
          onClick={() => void onEnsureSession()}
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
        >
          CreateCustomer · ensure session
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void loadList(query)}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold"
        >
          Refresh list
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section>
          <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            SearchCustomersQuery
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar demand party…"
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
                        {s.partyKind} · {s.demandChannelDefault}
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
            GetCustomer · CustomerContext
          </p>
          {!selected ? (
            <p className="rounded-md border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
              Selecciona un demand party
            </p>
          ) : (
            <div className="rounded-md border border-border p-4 space-y-3">
              <div>
                <h3 className="text-lg font-semibold">
                  {selected.summary.displayName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selected.summary.partyKind} · {selected.summary.id}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-semibold">{selected.summary.status}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Channel</dt>
                  <dd className="font-semibold">
                    {selected.summary.demandChannelDefault}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">canWrite</dt>
                  <dd className="font-semibold">
                    {selected.permissions.canWrite ? "yes" : "no"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Company</dt>
                  <dd className="font-semibold truncate">
                    {selected.companyAccountId ?? "—"}
                  </dd>
                </div>
                {selected.profile?.email ? (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-semibold">{selected.profile.email}</dd>
                  </div>
                ) : null}
              </dl>

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
                  ArchiveCustomer
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onProbeUnimplemented("update")}
                  className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground"
                >
                  UpdateCustomer (expect UNIMPLEMENTED)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onProbeUnimplemented("restore")}
                  className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground"
                >
                  RestoreCustomer (expect UNIMPLEMENTED)
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
