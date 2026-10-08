import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/consumer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useCustomerSelfProfile } from "@/hooks/use-customer-self-profile";
import type {
  CustomerAddress,
  CustomerCommand,
} from "@/modules/customer-directory/domain/customer-self-profile";
export const Route = createFileRoute("/_authenticated/app/addresses")({ component: AddressesPage });
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
  const [replacement, setReplacement] = useState("");
  const active = profile?.addresses.filter((a) => !a.archived) ?? [];
  async function command(command: CustomerCommand) {
    try {
      await state.execute(command);
      setEditing(null);
      setDraft(null);
      setConflict(false);
      setForm({ label: "", street: "", city: "", zip: "" });
      setReplacement("");
      toast.success("Direcciones actualizadas.");
    } catch (e) {
      if (e instanceof Error && e.message === "STALE_REVISION") setConflict(true);
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar.");
    }
  }
  const locked = state.busy || state.uncertain;
  return (
    <div className="flex-1 pb-6">
      <ScreenHeader backTo="/app/settings" overline="Configuración" title="Mis direcciones" />
      <div className="px-6 space-y-4">
        {state.uncertain && (
          <div role="alert">
            <p>Comprueba el resultado antes de realizar otro cambio. Conserva esta pantalla.</p>
            <Button
              onClick={() => void state.reconcile().catch((e) => toast.error(String(e)))}
              disabled={state.busy}
            >
              Comprobar resultado
            </Button>
            {state.mayRetrySame && (
              <Button
                disabled={state.busy}
                onClick={() => void state.retrySame().catch((e) => toast.error(String(e)))}
              >
                Reintentar la misma solicitud
              </Button>
            )}
          </div>
        )}
        {state.profile.error || state.customer.error ? (
          <p role="alert">No se pudieron cargar tus direcciones.</p>
        ) : state.profile.isLoading || state.customer.isLoading ? (
          <p>Cargando…</p>
        ) : !profile ? (
          <Link to="/app/settings/profile">Vincular mi ficha comercial</Link>
        ) : (
          <>
            {!active.length && (
              <p>
                Añade una dirección cuando necesites entrega. La primera será la predeterminada.
              </p>
            )}
            {profile.addresses.map((a) => (
              <div key={a.id} className="rounded-xl border p-4 space-y-2">
                <p>
                  {a.label || "Dirección"} {a.isDefault && !a.archived ? "· Predeterminada" : ""}{" "}
                  {a.archived ? "· Archivada" : ""}
                </p>
                <p>
                  {a.street}, {a.city} {a.zip}
                </p>
                {a.archived ? (
                  <Button
                    disabled={locked}
                    onClick={() =>
                      void command({
                        operation: "address_restore",
                        customerId: profile.customerId,
                        expectedRevision: profile.revision,
                        addressId: a.id,
                      })
                    }
                  >
                    Restaurar
                  </Button>
                ) : (
                  <>
                    <Button
                      disabled={locked}
                      onClick={() => {
                        setEditing(a);
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
                    >
                      Editar
                    </Button>
                    {!a.isDefault && (
                      <Button
                        disabled={locked}
                        variant="outline"
                        onClick={() =>
                          void command({
                            operation: "address_default",
                            customerId: profile.customerId,
                            expectedRevision: profile.revision,
                            addressId: a.id,
                          })
                        }
                      >
                        Usar como predeterminada
                      </Button>
                    )}
                    {a.isDefault && active.length > 1 && (
                      <label className="block">
                        Elegir sustituta antes de archivar
                        <select
                          disabled={locked}
                          value={replacement}
                          onChange={(e) => setReplacement(e.target.value)}
                          className="block border rounded p-2 w-full"
                        >
                          <option value="">Selecciona una dirección</option>
                          {active
                            .filter((x) => x.id !== a.id)
                            .map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.label || x.street}
                              </option>
                            ))}
                        </select>
                      </label>
                    )}
                    <Button
                      variant="outline"
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
                    >
                      Archivar
                    </Button>
                  </>
                )}
              </div>
            ))}
            <form
              className="space-y-3"
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
              <h2>{editing ? "Editar dirección" : "Añadir dirección"}</h2>
              {(["label", "street", "city", "zip"] as const).map((k) => (
                <label className="block" key={k}>
                  {
                    {
                      label: "Nombre de la dirección",
                      street: "Calle y número",
                      city: "Ciudad",
                      zip: "Código postal",
                    }[k]
                  }
                  <Input
                    required={k === "street"}
                    disabled={locked}
                    maxLength={{ label: 100, street: 500, city: 200, zip: 32 }[k]}
                    value={form[k]}
                    onFocus={() => {
                      if (!draft)
                        setDraft({
                          customerId: profile.customerId,
                          revision: profile.revision,
                          owner,
                        });
                    }}
                    onChange={(e) => {
                      if (!draft)
                        setDraft({
                          customerId: profile.customerId,
                          revision: profile.revision,
                          owner,
                        });
                      setForm({ ...form, [k]: e.target.value });
                    }}
                  />
                </label>
              ))}
              {conflict && (
                <p role="alert">
                  El CRM cambió. Conservamos tu borrador. Descártalo y recarga los datos actuales
                  antes de volver a editar.
                </p>
              )}
              <Button
                type="submit"
                disabled={
                  locked ||
                  conflict ||
                  !draft ||
                  draft.owner !== owner ||
                  draft.customerId !== profile.customerId
                }
              >
                Guardar dirección
              </Button>
              {(editing || draft) && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={locked}
                  onClick={() => {
                    setEditing(null);
                    setDraft(null);
                    setConflict(false);
                    setForm({ label: "", street: "", city: "", zip: "" });
                  }}
                >
                  Descartar borrador y recargar datos actuales
                </Button>
              )}
            </form>
            <p className="text-sm">
              Estos cambios no modifican las direcciones registradas en pedidos anteriores.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
