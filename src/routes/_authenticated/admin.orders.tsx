/**
 * Pedidos — lista operativa mínima (lectura + timeline).
 * PR-034
 */
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { SectionTitle } from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OperationalTimeline } from "@/components/operations/operational-timeline";
import {
  createOperationsRepository,
  type OperationalOrderListItem,
} from "@/modules/operations/infrastructure/operations-repository";
import {
  operationalStatusLabel,
  type OperationalOrderStatus,
} from "@/modules/operations";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrdersPage,
  head: () => ({
    meta: [{ title: "YourMeal OS — Pedidos" }],
  }),
});

function AdminOrdersPage() {
  const { user, tenantId, roles } = useAuth();
  const [orders, setOrders] = useState<OperationalOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OperationalOrderListItem | null>(null);

  const load = useCallback(async () => {
    if (!user || !tenantId) return;
    setLoading(true);
    try {
      const ctx = await createServiceContext({
        supabase,
        userId: user.id,
        tenantId,
        roles,
      });
      const repo = createOperationsRepository(ctx.supabase, ctx.tenantId);
      const statuses: OperationalOrderStatus[] = [
        "confirmed",
        "in_production",
        "prepared",
        "ready_for_delivery",
        "out_for_delivery",
        "delivered",
        "delivery_issue",
      ];
      setOrders(await repo.listOrders({ statuses }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al cargar pedidos");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user, tenantId, roles]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle
        overline="Operaciones"
        title="Pedidos"
        subtitle="Vista de pedidos operativos con timeline."
      />

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">
                    {o.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{o.customerName ?? "—"}</TableCell>
                  <TableCell>{o.companyName ?? "—"}</TableCell>
                  <TableCell>
                    {o.demandChannel === "company" ? "B2B" : "B2C"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {operationalStatusLabel(o.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setDetail(o)}>
                      Detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Sin pedidos operativos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent>
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Pedido {detail.id.slice(0, 8)}</DialogTitle>
              </DialogHeader>
              <OperationalTimeline status={detail.status} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
