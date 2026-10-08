import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { customerProfileClient } from "@/modules/customer-directory/application/customer-profile-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createCustomerMutationSession } from "@/modules/customer-directory/application/customer-mutation-session";
export function CustomerIdentityLinkReview({
  customerId,
  revision,
  displayName,
}: {
  customerId: string;
  revision?: number;
  displayName: string;
}) {
  const { tenantId, roles } = useAuth();
  const allowed = roles.includes("company_admin") || roles.includes("operations_manager");
  const repo = customerProfileClient;
  const [selected, setSelected] = useState("");
  const [verified, setVerified] = useState(false);
  const [pending, setPending] = useState(false);
  const session = useRef(createCustomerMutationSession(repo)).current;
  const [uncertain, setUncertain] = useState(false);
  const [mayRetry, setMayRetry] = useState(false);
  const query = useQuery({
    queryKey: ["p34-link-review", tenantId],
    enabled: Boolean(allowed && tenantId),
    queryFn: () => repo.identityRequests(tenantId!),
  });
  if (!allowed) return null;
  async function approve() {
    if (pending || uncertain || !verified || !selected || !revision) return;
    setPending(true);
    try {
      await session.execute(tenantId!, {
        operation: "approve_link",
        customerId,
        expectedRevision: revision!,
        linkRequestId: selected,
        verified: true,
      });
      setSelected("");
      setVerified(false);
      await query.refetch();
      toast.success("Verificación registrada. Falta la confirmación del cliente.");
    } catch (e) {
      setUncertain(Boolean(session.pending));
      toast.error(e instanceof Error ? e.message : "Resultado pendiente.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="border rounded-xl p-4 space-y-3">
      <h3>Vincular identidad verificada</h3>
      <p>
        Ficha seleccionada: {displayName}. Verifica personalmente la identidad antes de aprobar. No
        uses solo coincidencia de correo.
      </p>
      {query.error ? (
        <p role="alert">No se pudieron consultar solicitudes.</p>
      ) : (
        <select
          aria-label="Solicitud de identidad del cliente"
          className="w-full border p-2"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setVerified(false);
          }}
          disabled={pending || Boolean(uncertain)}
        >
          <option value="">Seleccionar solicitud de cliente</option>
          {query.data
            ?.filter((r) => r.state === "requested")
            .map((r) => (
              <option key={r.id} value={r.id}>
                Identidad {r.userId} · Solicitud {r.id}
              </option>
            ))}
        </select>
      )}
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={verified}
          disabled={pending || Boolean(uncertain)}
          onChange={(e) => setVerified(e.target.checked)}
        />
        He verificado que esta identidad corresponde a esta ficha.
      </label>
      <Button
        disabled={!verified || !selected || !revision || pending || Boolean(uncertain)}
        onClick={() => void approve()}
      >
        Aprobar vinculación para confirmación del cliente
      </Button>
      {uncertain && (
        <div role="alert">
          <p>Comprueba la solicitud antes de volver a aprobar.</p>
          <Button
            disabled={pending}
            onClick={() =>
              void session
                .reconcile()
                .then((r) => {
                  if (r) {
                    setUncertain(false);
                    void query.refetch();
                    toast.success("Verificación registrada.");
                  } else {
                    setMayRetry(session.mayRetrySame);
                    toast.info("No hay resultado registrado. Puedes reenviar la misma solicitud.");
                  }
                })
                .catch((e) => toast.error(String(e)))
            }
          >
            Comprobar resultado
          </Button>
          {mayRetry && (
            <Button
              disabled={pending}
              onClick={async () => {
                setPending(true);
                try {
                  await session.retrySame();
                  setUncertain(false);
                  setMayRetry(false);
                  await query.refetch();
                  toast.success("Verificación registrada.");
                } catch (e) {
                  setUncertain(Boolean(session.pending));
                  setMayRetry(false);
                  toast.error(e instanceof Error ? e.message : "Resultado pendiente.");
                } finally {
                  setPending(false);
                }
              }}
            >
              Reenviar la misma solicitud verificada
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
