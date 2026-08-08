/**
 * CX004 — Zero Friction Organization Management (Experience only).
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCustomer } from "@/customer/useCustomer";
import { createCustomerCommand } from "@/customer/CustomerCommands";
import { getCustomerQuery } from "@/customer/CustomerQueries";
import type { CustomerContext, PartyRef } from "@/customer/CustomerContext";
import {
  addWorkerToOrganization,
  ensureOrganizationRoster,
  getOrganizationRoster,
  type OrganizationRoster,
} from "@/customer-experience/organization-roster";
import { applyOperationalCorrection } from "@/customer-experience/operational-corrections";
import { cn } from "@/lib/utils";

type OrgDraft = {
  name: string;
  contactName: string;
  phone: string;
  address: string;
};

type WorkerDraft = {
  name: string;
  phone: string;
};

const emptyOrg = (): OrgDraft => ({
  name: "",
  contactName: "",
  phone: "",
  address: "",
});

const emptyWorker = (): WorkerDraft => ({ name: "", phone: "" });

export function OrganizationPanel(props: {
  canWrite: boolean;
  busy: boolean;
  onBusy: (v: boolean) => void;
  onOpenParty: (ref: PartyRef) => Promise<void>;
  onCreatedOrganization: (ctx: CustomerContext) => void;
  onCancel: () => void;
  /** When viewing an existing company from search/selection */
  viewing?: CustomerContext | null;
}) {
  const customer = useCustomer();
  const [mode, setMode] = useState<"create" | "view" | "add-worker">(
    props.viewing?.summary.partyKind === "company_account" ? "view" : "create",
  );
  const [draft, setDraft] = useState<OrgDraft>(emptyOrg);
  const [worker, setWorker] = useState<WorkerDraft>(emptyWorker);
  const [roster, setRoster] = useState<OrganizationRoster | null>(null);
  const [orgContext, setOrgContext] = useState<CustomerContext | null>(
    props.viewing?.summary.partyKind === "company_account"
      ? props.viewing
      : null,
  );
  const [justCreated, setJustCreated] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (props.viewing?.summary.partyKind === "company_account") {
      setOrgContext(props.viewing);
      setMode("view");
      setJustCreated(false);
      setRoster(
        ensureOrganizationRoster({
          organizationId: props.viewing.summary.id,
          organizationName: props.viewing.summary.displayName,
        }),
      );
    }
  }, [props.viewing?.summary.id, props.viewing?.summary.partyKind]);

  useEffect(() => {
    if (mode === "create") nameRef.current?.focus();
    if (mode === "add-worker") workerRef.current?.focus();
  }, [mode]);

  async function onSaveOrganization() {
    if (!props.canWrite || !customer.isReady) return;
    if (!draft.name.trim()) {
      toast.error("Nombre de la organización es imprescindible");
      nameRef.current?.focus();
      return;
    }
    props.onBusy(true);
    const started = performance.now();
    try {
      const contact = draft.contactName.trim() || draft.name.trim();
      const email = `pending+${Date.now()}@organization.local`;
      const result = await customer.createCustomer(
        createCustomerCommand({
          partyKind: "company_account",
          mode: "provision",
          name: draft.name.trim(),
          contactName: contact,
          contactEmail: email,
          contactPhone: draft.phone.trim() || null,
          fiscalAddress: draft.address.trim() || "Por completar",
          deliveryAddress: draft.address.trim() || null,
        }),
      );
      if (!result.ok || !result.partyRef) {
        toast.error(result.errors[0]?.message ?? "No se pudo crear");
        return;
      }
      const ms = Math.round(performance.now() - started);
      const got = await customer.getCustomer(
        getCustomerQuery({ partyRef: result.partyRef }),
      );
      const ctx =
        got.ok && got.context
          ? applyOperationalCorrection(got.context)
          : result.context
            ? applyOperationalCorrection(result.context)
            : null;
      if (!ctx) {
        toast.error("Organización creada sin contexto");
        return;
      }
      const r = ensureOrganizationRoster({
        organizationId: ctx.summary.id,
        organizationName: ctx.summary.displayName,
      });
      setRoster(r);
      setOrgContext(ctx);
      setJustCreated(true);
      setMode("view");
      setDraft(emptyOrg);
      props.onCreatedOrganization(ctx);
      toast.success(
        `Organización lista · ${ms} ms (objetivo TTO < 45s)`,
      );
      window.setTimeout(() => resumeRef.current?.focus(), 0);
    } finally {
      props.onBusy(false);
    }
  }

  async function onSaveWorker() {
    if (!props.canWrite || !customer.isReady || !orgContext) return;
    if (!worker.name.trim()) {
      toast.error("Nombre del trabajador es imprescindible");
      workerRef.current?.focus();
      return;
    }
    props.onBusy(true);
    const started = performance.now();
    try {
      const result = await customer.createCustomer(
        createCustomerCommand({
          partyKind: "individual",
          mode: "staff_create",
          displayName: worker.name.trim(),
          phone: worker.phone.trim() || null,
          street: null,
          city: null,
        }),
      );
      if (!result.ok || !result.partyRef) {
        toast.error(result.errors[0]?.message ?? "No se pudo crear");
        return;
      }
      const r = addWorkerToOrganization({
        organizationId: orgContext.summary.id,
        organizationName: orgContext.summary.displayName,
        partyId: result.partyRef.id,
        displayName: worker.name.trim(),
        phone: worker.phone.trim() || null,
      });
      setRoster(r);
      const ms = Math.round(performance.now() - started);
      toast.success(`Trabajador añadido · ${ms} ms (objetivo < 15s)`);
      setWorker(emptyWorker);
      setMode("view");
      setJustCreated(false);
    } finally {
      props.onBusy(false);
    }
  }

  if (mode === "create") {
    return (
      <div className="mb-6 rounded-md border border-border p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            Nueva organización · alta mínima
          </p>
          <button
            type="button"
            onClick={props.onCancel}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Cancelar
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Empresa · colegio · hotel · hospital… mismo flujo. CIF y facturación
          después (Progressive Completion).
        </p>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void onSaveOrganization();
          }}
        >
          <label className="sm:col-span-2 block text-xs">
            <span className="mb-1 block text-muted-foreground">
              Nombre de la organización *
            </span>
            <input
              ref={nameRef}
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-muted-foreground">
              Persona de contacto
            </span>
            <input
              value={draft.contactName}
              onChange={(e) =>
                setDraft((d) => ({ ...d, contactName: e.target.value }))
              }
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
              placeholder="Opcional · usa el nombre de la org"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-muted-foreground">Teléfono</span>
            <input
              value={draft.phone}
              onChange={(e) =>
                setDraft((d) => ({ ...d, phone: e.target.value }))
              }
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
              autoComplete="tel"
            />
          </label>
          <label className="sm:col-span-2 block text-xs">
            <span className="mb-1 block text-muted-foreground">Dirección</span>
            <input
              value={draft.address}
              onChange={(e) =>
                setDraft((d) => ({ ...d, address: e.target.value }))
              }
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
            />
          </label>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={props.busy}
              className="min-h-11 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-40"
            >
              Guardar organización
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (!orgContext) return null;

  const code =
    orgContext.summary.tags
      .find((t) => t.startsWith("code:"))
      ?.replace("code:", "") ?? null;

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      {justCreated ? (
        <div
          className="rounded-md border border-foreground/20 bg-foreground/[0.04] px-3 py-3 space-y-3"
          role="region"
          aria-label="Siguiente acción organización"
        >
          <div>
            <p className="text-sm font-semibold">Organización creada</p>
            <p className="text-xs text-muted-foreground">
              ¿Qué quieres hacer ahora?
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={!props.canWrite || props.busy}
              onClick={() => {
                setMode("add-worker");
                setJustCreated(false);
              }}
              className="min-h-11 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-40"
            >
              Añadir trabajador
            </button>
            <Link
              ref={resumeRef}
              to="/admin/order-workspace"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-semibold"
            >
              Crear pedido
            </Link>
            <button
              type="button"
              onClick={() => {
                setJustCreated(false);
                props.onCancel();
              }}
              className="min-h-11 rounded-md border border-dashed border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground"
            >
              Listo
            </button>
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="text-lg font-semibold">
          {orgContext.summary.displayName}
        </h3>
        <p className="text-xs text-muted-foreground">
          Organización
          {code ? ` · ${code}` : ""}
          {" · "}
          {roster?.workers.length ?? 0} trabajador
          {(roster?.workers.length ?? 0) === 1 ? "" : "es"}
        </p>
      </div>

      {!justCreated ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!props.canWrite || props.busy}
            onClick={() => setMode("add-worker")}
            className="min-h-11 rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background disabled:opacity-40"
          >
            Añadir trabajador
          </button>
          <Link
            to="/admin/order-workspace"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm font-semibold"
          >
            Crear pedido
          </Link>
        </div>
      ) : null}

      {mode === "add-worker" ? (
        <form
          className="rounded-md border border-foreground/20 bg-foreground/[0.03] px-3 py-3 grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void onSaveWorker();
          }}
        >
          <p className="sm:col-span-2 text-xs font-semibold">
            Nuevo trabajador · solo lo imprescindible
          </p>
          <label className="block text-xs">
            <span className="mb-1 block text-muted-foreground">Nombre *</span>
            <input
              ref={workerRef}
              value={worker.name}
              onChange={(e) =>
                setWorker((d) => ({ ...d, name: e.target.value }))
              }
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-muted-foreground">Teléfono</span>
            <input
              value={worker.phone}
              onChange={(e) =>
                setWorker((d) => ({ ...d, phone: e.target.value }))
              }
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
            />
          </label>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={props.busy}
              className="min-h-11 rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-40"
            >
              Guardar trabajador
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("view");
                setWorker(emptyWorker);
              }}
              className="min-h-11 rounded-md border border-border px-3 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-md border border-dashed border-border/80 px-3 py-2 space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Trabajadores
        </p>
        {(roster?.workers.length ?? 0) === 0 ? (
          <p className="text-xs text-muted-foreground">
            Todavía no hay trabajadores · añádelos cuando haga falta
          </p>
        ) : (
          <ul className="space-y-1">
            {roster!.workers.map((w) => (
              <li key={w.partyId}>
                <button
                  type="button"
                  onClick={() =>
                    void props.onOpenParty({
                      kind: "individual",
                      id: w.partyId,
                    })
                  }
                  className={cn(
                    "flex min-h-10 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-xs hover:bg-muted/40",
                  )}
                >
                  <span className="font-semibold">{w.displayName}</span>
                  <span className="text-muted-foreground">
                    {w.phone ?? "Abrir"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        CIF · facturación · plantillas de organización → Progressive Completion /
        Accelerators (reservado).
      </p>
    </div>
  );
}

/** Sync roster when opening a known company from outside. */
export function syncOrganizationView(organizationId: string, name: string) {
  return (
    getOrganizationRoster(organizationId) ??
    ensureOrganizationRoster({
      organizationId,
      organizationName: name,
    })
  );
}
