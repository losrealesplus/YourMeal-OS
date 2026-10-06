import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createCustomCaptureSession,
  customCaptureTransport,
  type CaptureReview,
} from "@/modules/orders/application/custom-order-capture-service";
import type { CanonicalOrderCommand } from "@/modules/orders/domain/canonical-order-write";
import type { CanonicalOrderWriteResult } from "@/modules/orders/infrastructure/canonical-order-write-repository";

/** Keeps the exact reviewed request across failed commits. No automatic publication. */
export function CanonicalOrderSubmit({
  tenantId,
  enabled,
  buildCommand,
  onSuccess,
  onLock,
  dishLabel,
}: {
  tenantId: string;
  enabled: boolean;
  buildCommand: (autoConfirm: boolean) => CanonicalOrderCommand;
  onSuccess: (result: CanonicalOrderWriteResult) => void;
  onLock: (locked: boolean) => void;
  dishLabel?: (dishId: string) => string;
}) {
  const session = useRef<ReturnType<typeof createCustomCaptureSession> | undefined>(undefined);
  const [review, setReview] = useState<CaptureReview>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reviewRegion = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (review) reviewRegion.current?.focus();
  }, [review]);
  useEffect(() => {
    if (!review?.attempted) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [review?.attempted]);
  const prepare = async (autoConfirm: boolean) => {
    if (!enabled || busy) return;
    setBusy(true);
    setError("");
    onLock(true);
    try {
      const command = buildCommand(autoConfirm);
      session.current ??= createCustomCaptureSession(await customCaptureTransport());
      setReview(await session.current.prepare(tenantId, command));
    } catch (err) {
      setError(
        err instanceof Error && err.message === "OFFER_PRICING_OVERRIDE_UNSUPPORTED"
          ? "Retira los precios manuales de platos antes de confirmar un pedido mixto."
          : "No se pudo preparar el pedido. Revisa fechas, cantidades, precios, confirmaciones y permisos.",
      );
      onLock(false);
    } finally {
      setBusy(false);
    }
  };
  const commit = async () => {
    if (!enabled || busy || !session.current) return;
    setBusy(true);
    setError("");
    try {
      onSuccess(await session.current.commit());
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setError(
        /^[A-Z_]+$/.test(code)
          ? `${code}. Reintenta esta misma solicitud; no crees otro pedido.`
          : "No se confirmó el resultado. Reintenta esta misma solicitud; no crees otro pedido.",
      );
      setReview({ ...session.current.review! });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="w-full min-w-0 space-y-3">
      {error && (
        <p role="alert" className="text-sm text-destructive break-words">
          {error}
        </p>
      )}
      {review ? (
        <>
          <div
            role="region"
            ref={reviewRegion}
            tabIndex={-1}
            aria-label="Resumen del pedido a confirmar"
            className="rounded border p-3 space-y-2 text-sm max-h-60 overflow-y-auto"
          >
            {review.request.command.lines.map((line, index) => (
              <p key={index} className="break-words">
                {line.kind === "custom"
                  ? `Personalizado: ${line.name} · ${line.unitPrice} €/unidad · UNKNOWN · NOT_AVAILABLE`
                  : `${dishLabel?.(line.dishId) ?? `Plato ${line.dishId.slice(0, 8)}`} · ${review.quoteLines?.find((price) => price.dishId === line.dishId && price.dayDate === line.dayDate && price.qty === line.qty)?.unitPrice ?? "—"} €/unidad (servidor)`}{" "}
                · {line.qty} unidades · {line.dayDate}
              </p>
            ))}
            {review.total ? (
              <p className="font-semibold">Total cotizado: {review.total} €</p>
            ) : (
              <p>Confirma los precios explícitos de cada personalizado.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!review.attempted && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  session.current?.discard();
                  setReview(undefined);
                  onLock(false);
                }}
              >
                Volver a editar
              </Button>
            )}
            <Button type="button" disabled={!enabled || busy} onClick={() => void commit()}>
              {busy
                ? "Procesando…"
                : review.attempted
                  ? "Reintentar misma solicitud"
                  : "Confirmar envío del pedido"}
            </Button>
          </div>
          {!enabled && (
            <p role="alert">La captura personalizada está cerrada. No se puede publicar.</p>
          )}
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={!enabled || busy} onClick={() => void prepare(true)}>
            Revisar pedido
          </Button>
        </div>
      )}
    </div>
  );
}
