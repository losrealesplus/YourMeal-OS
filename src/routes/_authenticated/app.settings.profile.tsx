import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Shield,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCustomerSelfProfile } from "@/hooks/use-customer-self-profile";
import { ScreenHeader } from "@/components/consumer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  customerOnboardingPrefill,
  isApplePrivateRelay,
} from "@/modules/customer-directory/application/customer-onboarding-service";

/**
 * Screen: Customer · Profile Edit — CX-01B Warm Premium
 * Manages personal customer data (name, contact email, phone) with optimistic revision control.
 */
export const Route = createFileRoute("/_authenticated/app/settings/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, roles } = useAuth();
  const state = useCustomerSelfProfile();
  const p = state.profile.data;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{
    customerId: string;
    revision: number;
    owner: string;
  } | null>(null);
  const [conflict, setConflict] = useState(false);
  const [conflictedLink, setConflictedLink] = useState<string | null>(null);
  const owner = `${state.tenantId}/${user?.id}`;

  const [name, setName] = useState(
    () => customerOnboardingPrefill(user?.user_metadata).displayName,
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const staff = roles.some((r) => r !== "customer");

  async function action(fn: () => Promise<unknown>) {
    try {
      const result = await fn();
      if (result === null) {
        toast.info(
          "No hay resultado registrado. Puedes reintentar exactamente la misma solicitud.",
        );
        return;
      }
      setEditing(false);
      setDraft(null);
      setConflict(false);
      setConflictedLink(null);
      toast.success("Datos actualizados correctamente.");
    } catch (e) {
      if (e instanceof Error && e.message === "STALE_REVISION" && editing) setConflict(true);
      toast.error(e instanceof Error ? e.message : "No se pudo completar el cambio.");
    }
  }

  return (
    <div className="flex-1 pb-10">
      <ScreenHeader
        backTo="/app/settings"
        overline="Mi cuenta"
        title="Datos personales"
      />

      <div className="px-6 space-y-5">
        {/* Account Authentication Banner */}
        <div className="surface-raised border border-border/60 rounded-3xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="grid place-items-center size-10 rounded-2xl bg-secondary text-primary shrink-0">
            <Shield className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Cuenta de acceso
            </p>
            <p className="text-sm font-bold text-foreground truncate">{user?.email ?? "—"}</p>
          </div>
        </div>

        {isApplePrivateRelay(user?.email) && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">Privacidad de Apple activa</p>
            Apple utiliza un correo privado de reenvío. Puedes indicar abajo un correo de contacto directo para tus recibos y avisos.
          </div>
        )}

        {/* Uncertain Concurrency State Notice */}
        {state.uncertain && (
          <div
            role="alert"
            className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3 shadow-sm"
          >
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-5 shrink-0" />
              <p className="text-sm font-bold">Comprobación requerida</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              El resultado de tu última solicitud debe comprobarse antes de realizar nuevos cambios. Conserva esta pantalla.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                disabled={state.busy}
                onClick={() => void action(() => state.reconcile())}
                className="h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
              >
                <RefreshCw className="size-3.5 mr-1.5" />
                Comprobar resultado
              </Button>
              {state.mayRetrySame && (
                <Button
                  variant="outline"
                  disabled={state.busy}
                  onClick={() => void action(() => state.retrySame())}
                  className="h-10 rounded-xl text-xs font-bold"
                >
                  Reintentar solicitud
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading / Error States */}
        {state.profile.isLoading || state.customer.isLoading ? (
          <div className="surface-raised border border-border/60 rounded-3xl p-8 text-center space-y-2">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando tus datos personales…</p>
          </div>
        ) : state.profile.error || state.customer.error ? (
          <div
            role="alert"
            className="surface-raised border border-destructive/30 bg-destructive/5 rounded-3xl p-6 text-center space-y-2"
          >
            <p className="text-sm font-bold text-destructive">No se pudieron consultar tus datos</p>
            <p className="text-xs text-muted-foreground">Comprueba tu conexión e inténtalo de nuevo.</p>
          </div>
        ) : p ? (
          /* Profile Exists */
          <div className="surface-raised border border-border/60 rounded-3xl p-6 shadow-sm">
            {!editing ? (
              /* VIEW MODE */
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                  <div className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary shrink-0">
                    <UserIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Ficha de cliente
                    </p>
                    <h2 className="text-base font-extrabold text-foreground">{p.displayName}</h2>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Nombre completo
                    </span>
                    <span className="font-semibold text-foreground">{p.displayName}</span>
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Correo de contacto
                    </span>
                    <span className="font-semibold text-foreground">{p.email || "—"}</span>
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Teléfono de contacto
                    </span>
                    <span className="font-semibold text-foreground">{p.phone || "—"}</span>
                  </div>
                </div>

                <Button
                  disabled={state.busy || state.uncertain}
                  onClick={() => {
                    setName(p.displayName);
                    setEmail(p.email || "");
                    setPhone(p.phone || "");
                    setDraft({ customerId: p.customerId, revision: p.revision, owner });
                    setConflict(false);
                    setEditing(true);
                  }}
                  className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Pencil className="size-4" />
                  <span>Editar mis datos</span>
                </Button>
              </div>
            ) : (
              /* EDIT MODE */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    !draft ||
                    conflict ||
                    draft.owner !== owner ||
                    draft.customerId !== p.customerId
                  )
                    return;
                  void action(() =>
                    state.execute({
                      operation: "profile",
                      customerId: draft.customerId,
                      expectedRevision: draft.revision,
                      patch: { displayName: name, email: email || null, phone: phone || null },
                    }),
                  );
                }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <h2 className="text-base font-extrabold text-foreground">Editar datos</h2>
                  <span className="text-[11px] font-semibold text-muted-foreground">Revisión {p.revision}</span>
                </div>

                <div className="space-y-3.5">
                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-foreground">Nombre completo *</span>
                    <Input
                      required
                      maxLength={200}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 rounded-xl bg-background"
                      placeholder="Tu nombre y apellidos"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-foreground">Correo de contacto</span>
                    <Input
                      type="email"
                      maxLength={254}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-xl bg-background"
                      placeholder="ejemplo@correo.com"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-foreground">Teléfono</span>
                    <Input
                      type="tel"
                      maxLength={64}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 rounded-xl bg-background"
                      placeholder="+34 600 000 000"
                    />
                  </label>
                </div>

                {conflict && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive space-y-1"
                  >
                    <p className="font-bold">Ficha actualizada por otro proceso</p>
                    <p className="text-muted-foreground">
                      Tu borrador se conserva. Descarta para recargar los datos más recientes antes de volver a editar.
                    </p>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <Button
                    type="submit"
                    disabled={
                      state.busy ||
                      state.uncertain ||
                      conflict ||
                      draft?.owner !== owner ||
                      draft?.customerId !== p.customerId ||
                      !name.trim()
                    }
                    className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Check className="size-4" />
                    <span>Guardar cambios</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={state.busy || state.uncertain}
                    onClick={() => {
                      setEditing(false);
                      setDraft(null);
                      setConflict(false);
                    }}
                    className="w-full h-12 rounded-2xl border-border/80 font-semibold flex items-center justify-center gap-2"
                  >
                    <X className="size-4" />
                    <span>Descartar borrador</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : staff ? (
          /* Staff without customer profile */
          <div className="surface-raised border border-border/60 rounded-3xl p-6 text-center space-y-2">
            <p className="text-sm font-semibold text-foreground">Acceso de personal activo</p>
            <p className="text-xs text-muted-foreground">
              Tu rol de staff no genera automáticamente una ficha de cliente comercial.
            </p>
          </div>
        ) : (
          /* New Customer Onboarding */
          <div className="surface-raised border border-border/60 rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-foreground">Crea tu ficha de cliente</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vincula tu perfil para personalizar tus pedidos y entregas semanales con EatClean.
              </p>
            </div>

            {state.links.data?.some((l) => l.state === "requested" || l.state === "approved") ? (
              <div className="space-y-3">
                {state.links.data
                  .filter((l) => l.state === "requested" || l.state === "approved")
                  .map((l) => (
                    <div key={l.id} className="rounded-2xl border border-border/60 bg-secondary/40 p-4 space-y-3">
                      <p className="text-xs font-medium text-foreground">
                        {l.state === "requested"
                          ? "Solicitud pendiente de verificación por EatClean."
                          : "EatClean verificó tu solicitud. Confirma la ficha seleccionada:"}
                        {l.state === "approved" && (
                          <span className="block font-bold text-primary mt-1">
                            Ficha: {l.displayName || l.customerId}
                          </span>
                        )}
                      </p>
                      {l.state === "approved" && l.customerId && l.revision && (
                        <Button
                          disabled={state.busy || state.uncertain}
                          onClick={() =>
                            void action(async () => {
                              try {
                                return await state.execute({
                                  operation: "confirm_link",
                                  linkRequestId: l.id,
                                  customerId: l.customerId!,
                                  expectedRevision: l.revision!,
                                  confirmed: true,
                                });
                              } catch (error) {
                                if (error instanceof Error && error.message === "STALE_REVISION")
                                  setConflictedLink(l.id);
                                throw error;
                              }
                            })
                          }
                          className="h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                        >
                          Confirmar vinculación
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-foreground">Nombre *</span>
                  <Input
                    value={name}
                    maxLength={200}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-xl bg-background"
                    placeholder="Tu nombre completo"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-bold text-foreground">Teléfono (opcional)</span>
                  <Input
                    type="tel"
                    maxLength={64}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 rounded-xl bg-background"
                    placeholder="+34 600 000 000"
                  />
                </label>

                <div className="pt-2 space-y-2">
                  <Button
                    disabled={!name.trim() || state.busy || state.uncertain}
                    onClick={() =>
                      void action(() =>
                        state.execute({
                          operation: "onboard",
                          declaration: "new",
                          displayName: name,
                          phone: phone || null,
                        }),
                      )
                    }
                    className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
                  >
                    Soy nuevo cliente: crear ficha
                  </Button>

                  <Button
                    variant="outline"
                    disabled={state.busy || state.uncertain}
                    onClick={() => void action(() => state.execute({ operation: "request_link" }))}
                    className="w-full h-12 rounded-2xl font-semibold border-border/80"
                  >
                    Ya soy cliente: solicitar vinculación
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
