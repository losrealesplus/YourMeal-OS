/**
 * CX003 — Zero Friction Customer Edit panel (Experience only).
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { CustomerContext, PartyRef } from "@/customer/CustomerContext";
import { updateCustomerCommand } from "@/customer/CustomerCommands";
import { useCustomer } from "@/customer/useCustomer";
import {
  applyOperationalCorrection,
  saveOperationalCorrection,
  type OperationalCorrection,
} from "@/customer-experience/operational-corrections";
import { cn } from "@/lib/utils";

type SectionId = "basic" | "delivery" | "notes";

type BasicDraft = { name: string; phone: string; email: string };
type DeliveryDraft = { address: string; city: string };
type NotesDraft = { notes: string };

function partyRefOf(ctx: CustomerContext): PartyRef {
  return { kind: ctx.summary.partyKind, id: ctx.summary.id };
}

export function CustomerEditPanel(props: {
  context: CustomerContext;
  busy: boolean;
  canWrite: boolean;
  justCreated: boolean;
  createdFromLabel: string | null;
  onContext: (ctx: CustomerContext) => void;
  onBusy: (v: boolean) => void;
  onArchive: () => void;
  nextBestAction?: React.ReactNode;
}) {
  const customer = useCustomer();
  const { context } = props;
  const [editing, setEditing] = useState<SectionId | null>(null);
  const [dirty, setDirty] = useState(false);
  const nameFocusRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLAnchorElement>(null);

  const profile = context.profile;
  const isEmployee = context.summary.tags.some((t) =>
    t.includes("company_employee"),
  );
  const primaryPhone = profile?.phones?.[0]?.e164?.trim() || null;
  const primaryAddress = profile?.addresses?.[0];
  const notes =
    typeof profile?.preferences?.operationalNotes === "string"
      ? profile.preferences.operationalNotes
      : "";

  const [basic, setBasic] = useState<BasicDraft>({
    name: context.summary.displayName,
    phone: primaryPhone ?? "",
    email: profile?.email ?? "",
  });
  const [delivery, setDelivery] = useState<DeliveryDraft>({
    address: primaryAddress?.line1 ?? "",
    city: primaryAddress?.city ?? "",
  });
  const [notesDraft, setNotesDraft] = useState<NotesDraft>({ notes });

  useEffect(() => {
    setBasic({
      name: context.summary.displayName,
      phone: context.profile?.phones?.[0]?.e164?.trim() ?? "",
      email: context.profile?.email ?? "",
    });
    setDelivery({
      address: context.profile?.addresses?.[0]?.line1 ?? "",
      city: context.profile?.addresses?.[0]?.city ?? "",
    });
    const n =
      typeof context.profile?.preferences?.operationalNotes === "string"
        ? context.profile.preferences.operationalNotes
        : "";
    setNotesDraft({ notes: n });
    setEditing(null);
    setDirty(false);
  }, [context.summary.id, context.summary.partyKind, context.summary.displayName]);

  useEffect(() => {
    if (editing === "basic") nameFocusRef.current?.focus();
  }, [editing]);

  function askLeaveSection(): boolean {
    if (!dirty) return true;
    return window.confirm(
      "Hay cambios sin guardar. ¿Descartar y continuar?",
    );
  }

  function startSection(id: SectionId) {
    if (editing === id) return;
    if (!askLeaveSection()) return;
    setEditing(id);
    setDirty(false);
  }

  function cancelSection() {
    if (!askLeaveSection()) return;
    setBasic({
      name: context.summary.displayName,
      phone: primaryPhone ?? "",
      email: profile?.email ?? "",
    });
    setDelivery({
      address: primaryAddress?.line1 ?? "",
      city: primaryAddress?.city ?? "",
    });
    setNotesDraft({ notes });
    setEditing(null);
    setDirty(false);
  }

  async function persistCorrection(
    patch: Omit<OperationalCorrection, "updatedAt">,
    facadePatch: {
      displayName?: string | null;
      email?: string | null;
      contactPhone?: string | null;
      contactName?: string | null;
      contactEmail?: string | null;
    },
  ) {
    if (!props.canWrite) {
      toast.error("Missing customers.write");
      return;
    }
    props.onBusy(true);
    const started = performance.now();
    const ref = partyRefOf(context);
    try {
      const result = await customer.updateCustomer(
        updateCustomerCommand({ partyRef: ref, patch: facadePatch }),
      );
      saveOperationalCorrection(ref, patch);
      props.onContext(applyOperationalCorrection(context));
      const ms = Math.round(performance.now() - started);
      if (result.ok) {
        toast.success(`Guardado · ${ms} ms (TTE < 20s)`);
      } else if (result.errors[0]?.code === "UNIMPLEMENTED") {
        toast.success(
          `Corregido · listo para seguir · ${ms} ms (TTE < 20s)`,
        );
      } else {
        toast.error(result.errors[0]?.message ?? "No se pudo guardar");
        return;
      }
      setEditing(null);
      setDirty(false);
      window.setTimeout(() => resumeRef.current?.focus(), 0);
    } finally {
      props.onBusy(false);
    }
  }

  async function saveBasic() {
    if (!basic.name.trim()) {
      toast.error("Nombre es imprescindible para seguir trabajando");
      nameFocusRef.current?.focus();
      return;
    }
    await persistCorrection(
      {
        displayName: basic.name.trim(),
        phone: basic.phone.trim() || null,
        email: basic.email.trim() || null,
      },
      context.summary.partyKind === "company_account"
        ? {
            contactName: basic.name.trim(),
            contactPhone: basic.phone.trim() || null,
            contactEmail: basic.email.trim() || null,
          }
        : {
            displayName: basic.name.trim(),
            email: basic.email.trim() || null,
            contactPhone: basic.phone.trim() || null,
          },
    );
  }

  async function saveDelivery() {
    await persistCorrection(
      {
        addressLine: delivery.address.trim() || null,
        city: delivery.city.trim() || null,
      },
      {},
    );
  }

  async function saveNotes() {
    await persistCorrection({ notes: notesDraft.notes.trim() || null }, {});
  }

  const phoneHref = primaryPhone
    ? `tel:${primaryPhone.replace(/[^\d+]/g, "")}`
    : null;
  const waHref = primaryPhone
    ? `https://wa.me/${primaryPhone.replace(/\D/g, "")}`
    : null;

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      {props.nextBestAction}
      <div>
        <h3 className="text-lg font-semibold">{context.summary.displayName}</h3>
        <p className="text-xs text-muted-foreground">
          {context.summary.partyKind === "individual"
            ? isEmployee
              ? "Empleado de empresa"
              : "Particular"
            : "Empresa"}
          {props.createdFromLabel && props.justCreated
            ? ` · origen ${props.createdFromLabel}`
            : ""}
          {dirty ? " · cambios sin guardar" : ""}
        </p>
      </div>

      {!props.justCreated ? (
        <div className="flex flex-wrap gap-2">
          <Link
            ref={resumeRef}
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
              Llamar · —
            </span>
          )}
          {primaryPhone ? (
            <button
              type="button"
              className="min-h-11 rounded-md border border-border px-3 py-2 text-sm font-semibold"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(primaryPhone);
                  toast.success("Teléfono copiado");
                } catch {
                  toast.error("No se pudo copiar");
                }
              }}
            >
              Copiar teléfono
            </button>
          ) : null}
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
        </div>
      ) : null}

      <EditSection
        title="Información básica"
        editing={editing === "basic"}
        canWrite={props.canWrite}
        busy={props.busy}
        onEdit={() => startSection("basic")}
        onCancel={cancelSection}
        onSave={() => void saveBasic()}
      >
        {editing === "basic" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="sm:col-span-2 block text-xs">
              <span className="mb-1 block text-muted-foreground">Nombre *</span>
              <input
                ref={nameFocusRef}
                value={basic.name}
                onChange={(e) => {
                  setBasic((d) => ({ ...d, name: e.target.value }));
                  setDirty(true);
                }}
                className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
              />
            </label>
            <label className="block text-xs">
              <span className="mb-1 block text-muted-foreground">Teléfono</span>
              <input
                value={basic.phone}
                onChange={(e) => {
                  setBasic((d) => ({ ...d, phone: e.target.value }));
                  setDirty(true);
                }}
                className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
                autoComplete="tel"
              />
            </label>
            <label className="block text-xs">
              <span className="mb-1 block text-muted-foreground">Email</span>
              <input
                value={basic.email}
                onChange={(e) => {
                  setBasic((d) => ({ ...d, email: e.target.value }));
                  setDirty(true);
                }}
                className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
                type="email"
                autoComplete="email"
              />
            </label>
          </div>
        ) : (
          <ReadRows
            rows={[
              ["Nombre", context.summary.displayName],
              ["Teléfono", primaryPhone ?? "—"],
              ["Email", profile?.email ?? "—"],
            ]}
          />
        )}
      </EditSection>

      <EditSection
        title="Entrega"
        editing={editing === "delivery"}
        canWrite={props.canWrite}
        busy={props.busy}
        onEdit={() => startSection("delivery")}
        onCancel={cancelSection}
        onSave={() => void saveDelivery()}
      >
        {editing === "delivery" ? (
          <div className="grid gap-2">
            <label className="block text-xs">
              <span className="mb-1 block text-muted-foreground">
                Dirección principal
              </span>
              <input
                value={delivery.address}
                onChange={(e) => {
                  setDelivery((d) => ({ ...d, address: e.target.value }));
                  setDirty(true);
                }}
                className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
              />
            </label>
            <label className="block text-xs">
              <span className="mb-1 block text-muted-foreground">Zona / ciudad</span>
              <input
                value={delivery.city}
                onChange={(e) => {
                  setDelivery((d) => ({ ...d, city: e.target.value }));
                  setDirty(true);
                }}
                className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
              />
            </label>
          </div>
        ) : (
          <ReadRows
            rows={[
              [
                "Dirección",
                primaryAddress?.line1?.trim()
                  ? primaryAddress.line1
                  : "— · Progressive Completion",
              ],
              ["Zona", primaryAddress?.city?.trim() || "—"],
            ]}
          />
        )}
      </EditSection>

      <EditSection
        title="Notas operativas"
        editing={editing === "notes"}
        canWrite={props.canWrite}
        busy={props.busy}
        onEdit={() => startSection("notes")}
        onCancel={cancelSection}
        onSave={() => void saveNotes()}
      >
        {editing === "notes" ? (
          <label className="block text-xs">
            <span className="mb-1 block text-muted-foreground">Nota</span>
            <textarea
              value={notesDraft.notes}
              onChange={(e) => {
                setNotesDraft({ notes: e.target.value });
                setDirty(true);
              }}
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-base sm:text-sm"
            />
          </label>
        ) : (
          <p className="text-xs text-muted-foreground">
            {notes.trim() || "Sin notas · Progressive Completion"}
          </p>
        )}
      </EditSection>

      <div className="rounded-md border border-dashed border-border/80 px-3 py-2 space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Clasificación · empresa · preferencias
        </p>
        <p className="text-xs text-muted-foreground">
          CX004 Company · CX005 Progressive Completion — no interrumpen la
          operación ahora.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-dashed border-border pt-2">
        <button
          type="button"
          disabled={
            props.busy ||
            !props.canWrite ||
            context.summary.partyKind !== "individual"
          }
          onClick={props.onArchive}
          className="min-h-10 rounded-md border border-border px-3 py-2 text-xs font-semibold disabled:opacity-40"
        >
          Archivar
        </button>
      </div>
    </div>
  );
}

function EditSection(props: {
  title: string;
  editing: boolean;
  canWrite: boolean;
  busy: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-3 space-y-2",
        props.editing
          ? "border-foreground/30 bg-foreground/[0.03]"
          : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {props.title}
        </p>
        {props.editing ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={props.busy}
              onClick={props.onSave}
              className="min-h-9 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
            >
              Guardar
            </button>
            <button
              type="button"
              disabled={props.busy}
              onClick={props.onCancel}
              className="min-h-9 rounded-md border border-border px-3 py-1.5 text-xs font-semibold"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!props.canWrite || props.busy}
            onClick={props.onEdit}
            className="min-h-9 rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            Editar
          </button>
        )}
      </div>
      {props.children}
    </div>
  );
}

function ReadRows(props: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-1.5 text-xs">
      {props.rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-semibold text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
