import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Archive,
  Check,
  CheckCircle2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { ScreenHeader } from "@/components/consumer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useCustomerSelfProfile } from "@/hooks/use-customer-self-profile";
import type {
  CustomerAddress,
  CustomerCommand,
} from "@/modules/customer-directory/domain/customer-self-profile";
import { cn } from "@/lib/utils";

/**
 * Screen: Customer · Addresses Management — CX-01B Warm Premium
 * Manages delivery addresses with default selection, replacement upon archive, and optimistic revision control.
 */
export const Route = createFileRoute("/_authenticated/app/addresses")({
  component: AddressesPage,
});

function AddressesPage() {
  const state = useCustomerSelfProfile();
  const { user } = useAuth();
  const owner = `${state.tenantId}/${user?.id}`;

  const [draft, setDraft] = useState<{
    customerId: string;
    revision: number;
    owner: string;
  } | null>(null);
  const [conflict, setConflict] = useState(false);
  const profile = state.profile.data;
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [form, setForm] = useState({ label: "", street: "", city: "", zip: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [replacement, setReplacement] = useState("");

  const active = profile?.addresses.filter((a) => !a.archived) ?? [];
  const archived = profile?.addresses.filter((a) => a.archived) ?? [];

  async function command(cmd: CustomerCommand) {
    try {
      await state.execute(cmd);
      setEditing(null);
      setIsAdding(false);
      setDraft(null);
      setConflict(false);
      setForm({ label: "", street: "", city: "", zip: "" });
      setReplacement("");
      toast.success("Direcciones actualizadas correctamente.");
    } catch (e) {
      if (e instanceof Error && e.message === "STALE_REVISION") setConflict(true);
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar la dirección.");
    }
  }

  const locked = state.busy || state.uncertain;
  const showForm = isAdding || editing !== null;

  return (
    <div className="flex-1 pb-10">
      <ScreenHeader
        backTo="/app/settings"
        overline="Mi cuenta"
        title="Direcciones de entrega"
      />

      <div className="px-6 space-y-6">
        {/* Recovery Alert for Uncertain State */}
        {state.uncertain && (
          <div
            role="alert"
            className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3 shadow-sm"
          >
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hay una comprobación pendiente. Comprueba el resultado antes de realizar otro cambio.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => void state.reconcile().catch((e) => toast.error(String(e)))}
                disabled={state.busy}
                className="h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
              >
                <RefreshCw className="size-3.5 mr-1.5" />
                Comprobar resultado
              </Button>
              {state.mayRetrySame && (
                <Button
                  disabled={state.busy}
                  variant="outline"
                  onClick={() => void state.retrySame().catch((e) => toast.error(String(e)))}
                  className="h-10 rounded-xl text-xs font-bold"
                >
                  Reintentar solicitud
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading / Error States */}
        {state.profile.error || state.customer.error ? (
          <div
            role="alert"
            className="surface-raised border border-destructive/30 bg-destructive/5 rounded-3xl p-6 text-center space-y-2"
          >
            <p className="text-sm font-bold text-destructive">No se pudieron cargar tus direcciones</p>
            <p className="text-xs text-muted-foreground">Comprueba tu conexión e inténtalo de nuevo.</p>
          </div>
        ) : state.profile.isLoading || state.customer.isLoading ? (
          <div className="surface-raised border border-border/60 rounded-3xl p-8 text-center space-y-2">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando direcciones…</p>
          </div>
        ) : !profile ? (
          <div className="surface-raised border border-border/60 rounded-3xl p-6 text-center space-y-3 shadow-sm">
            <p className="text-sm font-bold text-foreground">Ficha de cliente requerida</p>
            <p className="text-xs text-muted-foreground">
              Configura tu perfil comercial antes de registrar direcciones de entrega.
            </p>
            <Link
              to="/app/settings/profile"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xs font-bold px-5 shadow-sm"
            >
              Configurar mi perfil
            </Link>
          </div>
        ) : (
          <>
            {/* Active Addresses List */}
            {active.length === 0 && !showForm ? (
              <div className="surface-raised border border-border/60 rounded-3xl p-6 text-center space-y-3 shadow-sm">
                <div className="grid place-items-center size-12 rounded-2xl bg-primary/10 text-primary mx-auto">
                  <MapPin className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">Sin direcciones guardadas</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[28ch] mx-auto">
                    Añade tu dirección habitual para planificar las entregas de tu menú semanal.
                  </p>
                </div>
              </div>
            ) : null}

            {active.length > 0 && !showForm ? (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between px-1">
                  <p className="meta-label">{`Direcciones activas (${active.length})`}</p>
                </div>

                {active.map((a) => (
                  <div
                    key={a.id}
                    className="surface-raised border border-border/60 rounded-3xl p-5 space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="grid place-items-center size-8 rounded-lg bg-primary/10 text-primary shrink-0">
                          <MapPin className="size-4" />
                        </div>
                        <span className="font-extrabold text-sm text-foreground">
                          {a.label || "Dirección de entrega"}
                        </span>
                      </div>
                      {a.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/12 text-primary">
                          <CheckCircle2 className="size-3" /> Predeterminada
                        </span>
                      ) : null}
                    </div>

                    <div className="text-sm pl-10.5">
                      <p className="font-semibold text-foreground">{a.street}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[a.city, a.zip].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    {/* Actions row */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={locked}
                        onClick={() => {
                          setEditing(a);
                          setIsAdding(false);
                          setDraft({
                            customerId: profile.customerId,
                            revision: profile.revision,
                            owner,
                          });
                          setConflict(false);
                          setForm({
                            label: a.label || "",
                            street: a.street,
                            city: a.city || "",
                            zip: a.zip || "",
                          });
                        }}
                        className="h-8 rounded-xl text-xs font-bold"
                      >
                        <Pencil className="size-3 mr-1" />
                        Editar
                      </Button>

                      {!a.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={locked}
                          onClick={() =>
                            void command({
                              operation: "address_default",
                              customerId: profile.customerId,
                              expectedRevision: profile.revision,
                              addressId: a.id,
                            })
                          }
                          className="h-8 rounded-xl text-xs font-bold"
                        >
                          <Check className="size-3 mr-1 text-primary" />
                          Hacer predeterminada
                        </Button>
                      )}

                      {a.isDefault && active.length > 1 && (
                        <div className="w-full pt-2 space-y-1">
                          <label className="block text-[11px] font-bold text-muted-foreground">
                            Elegir sustituta antes de archivar:
                          </label>
                          <select
                            disabled={locked}
                            value={replacement}
                            onChange={(e) => setReplacement(e.target.value)}
                            className="block h-9 border border-border rounded-xl px-2.5 text-xs w-full bg-background font-medium"
                          >
                            <option value="">Selecciona dirección sustituta</option>
                            {active
                              .filter((x) => x.id !== a.id)
                              .map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.label || x.street}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={locked || (a.isDefault && active.length > 1 && !replacement)}
                        onClick={() =>
                          void command({
                            operation: "address_archive",
                            customerId: profile.customerId,
                            expectedRevision: profile.revision,
                            addressId: a.id,
                            ...(a.isDefault && active.length > 1
                              ? { replacementAddressId: replacement }
                              : {}),
                          })
                        }
                        className="h-8 rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive ml-auto"
                      >
                        <Archive className="size-3 mr-1" />
                        Archivar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Archived Addresses (if any) */}
            {archived.length > 0 && !showForm ? (
              <div className="space-y-3 pt-2">
                <p className="meta-label px-1">{`Direcciones archivadas (${archived.length})`}</p>
                {archived.map((a) => (
                  <div
                    key={a.id}
                    className="surface-raised border border-border/40 rounded-2xl p-4 flex items-center justify-between gap-3 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {a.label || a.street}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{a.street}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={locked}
                      onClick={() =>
                        void command({
                          operation: "address_restore",
                          customerId: profile.customerId,
                          expectedRevision: profile.revision,
                          addressId: a.id,
                        })
                      }
                      className="h-8 rounded-xl text-xs font-bold shrink-0"
                    >
                      <RotateCcw className="size-3 mr-1" />
                      Restaurar
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Add Address CTA button when form is closed */}
            {!showForm ? (
              <Button
                onClick={() => {
                  setIsAdding(true);
                  setEditing(null);
                  setForm({ label: "", street: "", city: "", zip: "" });
                  setDraft({
                    customerId: profile.customerId,
                    revision: profile.revision,
                    owner,
                  });
                }}
                disabled={locked}
                className="w-full h-13 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="size-4" />
                <span>Añadir nueva dirección</span>
              </Button>
            ) : null}

            {/* Add / Edit Form Card */}
            {showForm ? (
              <form
                className="surface-raised border border-border/60 rounded-3xl p-6 space-y-4 shadow-sm"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    !draft ||
                    conflict ||
                    draft.owner !== owner ||
                    draft.customerId !== profile.customerId
                  )
                    return;
                  void command({
                    operation: editing ? "address_edit" : "address_create",
                    customerId: draft.customerId,
                    expectedRevision: draft.revision,
                    ...(editing ? { addressId: editing.id } : {}),
                    patch: form,
                  } as CustomerCommand);
                }}
              >
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <h3 className="text-base font-extrabold text-foreground">
                    {editing ? "Editar dirección" : "Añadir dirección de entrega"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setIsAdding(false);
                      setDraft(null);
                      setConflict(false);
                    }}
                    className="size-7 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-3.5">
                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-foreground">Etiqueta de la dirección</span>
                    <Input
                      disabled={locked}
                      maxLength={100}
                      placeholder="Ej. Casa, Oficina, Gimnasio"
                      value={form.label}
                      className="h-11 rounded-xl bg-background"
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-foreground">Calle, número y piso *</span>
                    <Input
                      required
                      disabled={locked}
                      maxLength={500}
                      placeholder="Calle Gran Vía 12, 3º B"
                      value={form.street}
                      className="h-11 rounded-xl bg-background"
                      onChange={(e) => setForm({ ...form, street: e.target.value })}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-1">
                      <span className="text-xs font-bold text-foreground">Ciudad</span>
                      <Input
                        disabled={locked}
                        maxLength={200}
                        placeholder="Madrid"
                        value={form.city}
                        className="h-11 rounded-xl bg-background"
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs font-bold text-foreground">Código postal</span>
                      <Input
                        disabled={locked}
                        maxLength={32}
                        placeholder="28013"
                        value={form.zip}
                        className="h-11 rounded-xl bg-background"
                        onChange={(e) => setForm({ ...form, zip: e.target.value })}
                      />
                    </label>
                  </div>
                </div>

                {conflict && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive space-y-1"
                  >
                    <p className="font-bold">Direcciones actualizadas por otro proceso</p>
                    <p className="text-muted-foreground">
                      Tu borrador se conserva. Descarta y recarga los datos más recientes antes de volver a guardar.
                    </p>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <Button
                    type="submit"
                    disabled={
                      locked ||
                      conflict ||
                      !draft ||
                      draft.owner !== owner ||
                      draft.customerId !== profile.customerId ||
                      !form.street.trim()
                    }
                    className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Check className="size-4" />
                    <span>Guardar dirección</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={locked}
                    onClick={() => {
                      setEditing(null);
                      setIsAdding(false);
                      setDraft(null);
                      setConflict(false);
                      setForm({ label: "", street: "", city: "", zip: "" });
                    }}
                    className="w-full h-12 rounded-2xl border-border/80 font-semibold"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : null}

            <p className="text-xs text-muted-foreground text-center pt-2 leading-relaxed max-w-[34ch] mx-auto">
              Los cambios en tus direcciones no modifican pedidos anteriores ni aquellos que ya están en cocina o en reparto.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
