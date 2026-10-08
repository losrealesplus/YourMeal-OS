import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
export const Route = createFileRoute("/_authenticated/app/settings/profile")({
  component: ProfilePage,
});
function ProfilePage() {
  const { user, roles } = useAuth();
  const state = useCustomerSelfProfile();
  const p = state.profile.data;
  const [editing, setEditing] = useState(false);
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
      toast.success("Operación confirmada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo completar el cambio.");
    }
  }
  return (
    <div className="flex-1 pb-6">
      <ScreenHeader backTo="/app/settings" overline="Configuración" title="Mis datos" />
      <div className="px-6 space-y-4">
        <p className="text-sm">Acceso: {user?.email ?? "—"}</p>
        {isApplePrivateRelay(user?.email) && (
          <p>Apple utiliza un correo privado de acceso. Puedes indicar otro correo de contacto.</p>
        )}
        {state.uncertain && (
          <div role="alert">
            <p>
              El resultado debe comprobarse antes de realizar otro cambio. Conserva esta pantalla.
              Solicitud: {state.pendingRequestId}
            </p>
            <Button disabled={state.busy} onClick={() => void action(() => state.reconcile())}>
              Comprobar resultado
            </Button>
            {state.mayRetrySame && (
              <Button disabled={state.busy} onClick={() => void action(() => state.retrySame())}>
                Reintentar la misma solicitud
              </Button>
            )}
          </div>
        )}
        {state.profile.isLoading || state.customer.isLoading ? (
          <p>Cargando datos…</p>
        ) : state.profile.error || state.customer.error ? (
          <p role="alert">No se pudieron consultar tus datos.</p>
        ) : p ? (
          <>
            {!editing ? (
              <>
                <p>Nombre: {p.displayName}</p>
                <p>Correo de contacto: {p.email || "—"}</p>
                <p>Teléfono: {p.phone || "—"}</p>
                <Button
                  disabled={state.busy || state.uncertain}
                  onClick={() => {
                    setName(p.displayName);
                    setEmail(p.email || "");
                    setPhone(p.phone || "");
                    setEditing(true);
                  }}
                >
                  Editar mis datos
                </Button>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(() =>
                    state.execute({
                      operation: "profile",
                      customerId: p.customerId,
                      expectedRevision: p.revision,
                      patch: { displayName: name, email: email || null, phone: phone || null },
                    }),
                  );
                }}
                className="space-y-3"
              >
                <label className="block">
                  Nombre
                  <Input
                    required
                    maxLength={200}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="block">
                  Correo de contacto
                  <Input
                    type="email"
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="block">
                  Teléfono
                  <Input
                    type="tel"
                    maxLength={64}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                <Button disabled={state.busy || state.uncertain} type="submit">
                  Guardar
                </Button>
              </form>
            )}
          </>
        ) : staff ? (
          <p>Tu acceso de personal no crea una ficha de cliente automáticamente.</p>
        ) : (
          <>
            <p>
              Vincula tu ficha comercial antes de editar tus datos. No se asociará por coincidencia
              de correo.
            </p>
            {state.links.data?.some((l) => l.state === "requested" || l.state === "approved") ? (
              state.links.data
                .filter((l) => l.state === "requested" || l.state === "approved")
                .map((l) => (
                  <div key={l.id}>
                    <p>
                      {l.state === "requested"
                        ? "Solicitud pendiente de verificación por EatClean."
                        : "EatClean verificó tu solicitud. Confirma la ficha seleccionada."}
                      {l.state === "approved" && (
                        <span className="block">
                          Ficha verificada: {l.displayName || l.customerId}
                        </span>
                      )}
                    </p>
                    {l.state === "approved" && l.customerId && l.revision && (
                      <Button
                        disabled={state.busy || state.uncertain}
                        onClick={() =>
                          void action(() =>
                            state.execute({
                              operation: "confirm_link",
                              linkRequestId: l.id,
                              customerId: l.customerId!,
                              expectedRevision: l.revision!,
                              confirmed: true,
                            }),
                          )
                        }
                      >
                        Confirmar vinculación verificada
                      </Button>
                    )}
                  </div>
                ))
            ) : (
              <>
                <label>
                  Nombre comercial
                  <Input value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
                </label>
                <label>
                  Teléfono de contacto (opcional)
                  <Input
                    type="tel"
                    maxLength={64}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
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
                >
                  Soy nuevo cliente: crear ficha
                </Button>
                <Button
                  variant="outline"
                  disabled={state.busy || state.uncertain}
                  onClick={() => void action(() => state.execute({ operation: "request_link" }))}
                >
                  Ya soy cliente: solicitar vinculación
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
