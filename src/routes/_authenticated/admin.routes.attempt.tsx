/**
 * ADMIN · Delivery · Intento de entrega
 * Capability: logistics.operate  ·  Core Object: DeliveryAttempt
 * Writes: DeliveryService.recordAttempt (transiciona estado + marca parada + audit)
 */
import { createFileRoute } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { DeliveryService } from "@/modules/delivery";
import {
  operationalStatusLabel,
  type OperationalOrderListItem,
} from "@/modules/operations";
import { cn } from "@/lib/utils";

const ROLES_ALLOWED = ["saas_admin", "company_admin", "operations_manager", "logistics", "delivery"];

export const Route = createFileRoute("/_authenticated/admin/routes/attempt")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "logistics.operate");
  },
  component: AttemptPage,
  head: () => ({ meta: [{ title: "YourMeal OS — Intento de entrega" }] }),
});

function todayISO() { return new Date().toISOString().slice(0, 10); }

function AttemptPage() {
  const { user, tenantId, roles } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [orders, setOrders] = useState<OperationalOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [target, setTarget] = useState<OperationalOrderListItem | null>(null);
  const [outcome, setOutcome] = useState<"delivered" | "issue">("delivered");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      const all = await DeliveryService.listDayDeliveries(ctx, date);
      setOrders(all.filter((o) =>
        o.status === "ready_for_delivery" || o.status === "out_for_delivery"
      ));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar los pedidos");
      setOrders([]);
    } finally { setLoading(false); }
  }, [user, tenantId, roles, date]);

  useEffect(() => { void load(); }, [load]);

  function openAttempt(o: OperationalOrderListItem, out: "delivered" | "issue") {
    setTarget(o); setOutcome(out); setNote("");
  }

  async function submit() {
    if (!user || !tenantId || !target) return;
    setBusy(target.id);
    try {
      const ctx = await createServiceContext({ supabase, userId: user.id, tenantId, roles });
      await DeliveryService.recordAttempt(ctx, {
        orderId: target.id,
        outcome,
        note: note.trim() || null,
      });
      toast.success(outcome === "delivered" ? "Entrega registrada" : "Incidencia registrada");
      setTarget(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar el intento");
    } finally { setBusy(null); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="attempt-date">Fecha</Label>
          <Input id="attempt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No hay pedidos listos o en reparto para registrar intento.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Intento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">#{o.id.slice(0, 8)}</TableCell>
                  <TableCell>{o.customerName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {o.siteName ?? "—"}
                    {o.siteAddress ? <div>{o.siteAddress}</div> : null}
                  </TableCell>
                  <TableCell><Badge variant="outline">{operationalStatusLabel(o.status)}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" disabled={busy === o.id}
                        onClick={() => openAttempt(o, "issue")}>
                        <AlertTriangle className="mr-1 h-4 w-4" />Incidencia
                      </Button>
                      <Button size="sm" disabled={busy === o.id}
                        onClick={() => openAttempt(o, "delivered")}>
                        <CheckCircle2 className="mr-1 h-4 w-4" />Entregado
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={target != null} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {outcome === "delivered" ? "Registrar entrega" : "Registrar incidencia"}
            </DialogTitle>
          </DialogHeader>
          {target ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Pedido <span className="font-mono">#{target.id.slice(0, 8)}</span> · {target.customerName ?? "Cliente"}
                {" "}· {operationalStatusLabel(target.status)}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="attempt-note">
                  Nota {outcome === "issue" ? "(motivo)" : "(opcional)"}
                </Label>
                <Textarea id="attempt-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                  placeholder={outcome === "issue" ? "Cliente ausente, dirección incorrecta…" : "Ej. entregado a portero"} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setTarget(null)}>Cancelar</Button>
                <Button onClick={() => void submit()}
                  disabled={busy === target.id || (outcome === "issue" && note.trim().length === 0)}>
                  Confirmar
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
