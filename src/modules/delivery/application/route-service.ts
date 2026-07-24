/**
 * RouteService — real. Reads/writes routes & route_stops.
 * Capability: logistics.operate  ·  Core Objects: Route · Stop
 * Audits every mutation via AuditService.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ServiceContext } from "@/services/types";
import { DomainError } from "@/domain/errors";
import { requireCapability } from "@/permissions";
import { AuditService } from "@/services/audit-service";
import {
  nextRouteStatuses,
  type RouteStatus,
} from "../domain/route-status";

export type RouteRow = {
  id: string;
  tenantId: string;
  deliveryDate: string;
  driverId: string | null;
  status: RouteStatus;
  createdAt: string;
  stopCount: number;
};

export type StopRow = {
  id: string;
  routeId: string;
  tenantId: string;
  orderId: string | null;
  sequence: number;
  eta: string | null;
  deliveredAt: string | null;
  lat: number | null;
  lng: number | null;
  order?: {
    id: string;
    status: string;
    customerName: string | null;
    siteName: string | null;
    siteAddress: string | null;
    notes: string | null;
  } | null;
};

function mapRoute(r: any, stopCount = 0): RouteRow {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    deliveryDate: r.delivery_date,
    driverId: r.driver_id ?? null,
    status: r.status,
    createdAt: r.created_at,
    stopCount,
  };
}

function mapStop(s: any): StopRow {
  const o = s.orders ?? null;
  const site = o?.company_locations ?? null;
  const cust = o?.customers ?? null;
  return {
    id: s.id,
    routeId: s.route_id,
    tenantId: s.tenant_id,
    orderId: s.order_id ?? null,
    sequence: s.sequence,
    eta: s.eta ?? null,
    deliveredAt: s.delivered_at ?? null,
    lat: s.lat ?? null,
    lng: s.lng ?? null,
    order: o
      ? {
          id: o.id,
          status: o.status,
          customerName: cust?.display_name ?? null,
          siteName: site?.name ?? null,
          siteAddress: site?.address ?? null,
          notes: o.notes ?? null,
        }
      : null,
  };
}

export const RouteService = {
  async listByDate(
    ctx: ServiceContext,
    deliveryDate: string,
  ): Promise<RouteRow[]> {
    requireCapability(ctx.roles, "logistics.operate");
    const db = ctx.supabase as any;
    const { data, error } = await db
      .from("routes")
      .select("id, tenant_id, delivery_date, driver_id, status, created_at")
      .eq("tenant_id", ctx.tenantId)
      .eq("delivery_date", deliveryDate)
      .order("created_at", { ascending: true });
    if (error) throw new DomainError("INVALID_STATE", error.message);
    const routes = (data ?? []) as any[];
    if (routes.length === 0) return [];

    const { data: stops, error: sErr } = await db
      .from("route_stops")
      .select("route_id")
      .eq("tenant_id", ctx.tenantId)
      .in("route_id", routes.map((r) => r.id));
    if (sErr) throw new DomainError("INVALID_STATE", sErr.message);
    const counts = new Map<string, number>();
    for (const s of (stops ?? []) as any[]) {
      counts.set(s.route_id, (counts.get(s.route_id) ?? 0) + 1);
    }
    return routes.map((r) => mapRoute(r, counts.get(r.id) ?? 0));
  },

  async getRoute(ctx: ServiceContext, routeId: string): Promise<RouteRow | null> {
    requireCapability(ctx.roles, "logistics.operate");
    const db = ctx.supabase as any;
    const { data, error } = await db
      .from("routes")
      .select("id, tenant_id, delivery_date, driver_id, status, created_at")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", routeId)
      .maybeSingle();
    if (error) throw new DomainError("INVALID_STATE", error.message);
    if (!data) return null;
    const { count } = await db
      .from("route_stops")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId)
      .eq("route_id", routeId);
    return mapRoute(data, count ?? 0);
  },

  async create(
    ctx: ServiceContext,
    input: { deliveryDate: string; driverId?: string | null },
  ): Promise<RouteRow> {
    requireCapability(ctx.roles, "logistics.operate");
    if (!input.deliveryDate) {
      throw new DomainError("INVALID_STATE", "deliveryDate required");
    }
    const db = ctx.supabase as any;
    const { data, error } = await db
      .from("routes")
      .insert({
        tenant_id: ctx.tenantId,
        delivery_date: input.deliveryDate,
        driver_id: input.driverId ?? null,
        status: "planned" as RouteStatus,
      })
      .select("id, tenant_id, delivery_date, driver_id, status, created_at")
      .single();
    if (error) throw new DomainError("INVALID_STATE", error.message);
    const row = mapRoute(data, 0);
    await AuditService.write(ctx, {
      entityType: "route",
      entityId: row.id,
      action: "create",
      newData: { deliveryDate: row.deliveryDate, driverId: row.driverId },
    });
    return row;
  },

  async setStatus(
    ctx: ServiceContext,
    routeId: string,
    toStatus: RouteStatus,
  ): Promise<RouteRow> {
    requireCapability(ctx.roles, "logistics.operate");
    const current = await this.getRoute(ctx, routeId);
    if (!current) throw new DomainError("NOT_FOUND", "Route not found");
    const allowed = nextRouteStatuses(current.status);
    if (!allowed.includes(toStatus)) {
      throw new DomainError(
        "INVALID_STATE",
        `Cannot transition ${current.status} → ${toStatus}`,
      );
    }
    const db = ctx.supabase as any;
    const { data, error } = await db
      .from("routes")
      .update({ status: toStatus })
      .eq("tenant_id", ctx.tenantId)
      .eq("id", routeId)
      .select("id, tenant_id, delivery_date, driver_id, status, created_at")
      .single();
    if (error) throw new DomainError("INVALID_STATE", error.message);
    await AuditService.write(ctx, {
      entityType: "route",
      entityId: routeId,
      action: "status_change",
      oldData: { status: current.status },
      newData: { status: toStatus },
    });
    return mapRoute(data, current.stopCount);
  },

  async setDriver(
    ctx: ServiceContext,
    routeId: string,
    driverId: string | null,
  ): Promise<void> {
    requireCapability(ctx.roles, "logistics.operate");
    const current = await this.getRoute(ctx, routeId);
    if (!current) throw new DomainError("NOT_FOUND", "Route not found");
    const db = ctx.supabase as any;
    const { error } = await db
      .from("routes")
      .update({ driver_id: driverId })
      .eq("tenant_id", ctx.tenantId)
      .eq("id", routeId);
    if (error) throw new DomainError("INVALID_STATE", error.message);
    await AuditService.write(ctx, {
      entityType: "route",
      entityId: routeId,
      action: "update",
      oldData: { driverId: current.driverId },
      newData: { driverId },
    });
  },

  async listStops(ctx: ServiceContext, routeId: string): Promise<StopRow[]> {
    requireCapability(ctx.roles, "logistics.operate");
    const db = ctx.supabase as any;
    const { data, error } = await db
      .from("route_stops")
      .select(
        `id, route_id, tenant_id, order_id, sequence, eta, delivered_at, lat, lng,
         orders (
           id, status, notes,
           customers ( display_name ),
           company_locations ( name, address )
         )`,
      )
      .eq("tenant_id", ctx.tenantId)
      .eq("route_id", routeId)
      .order("sequence", { ascending: true });
    if (error) throw new DomainError("INVALID_STATE", error.message);
    return ((data ?? []) as any[]).map(mapStop);
  },

  async listStopsByDate(
    ctx: ServiceContext,
    deliveryDate: string,
  ): Promise<StopRow[]> {
    requireCapability(ctx.roles, "logistics.operate");
    const routes = await this.listByDate(ctx, deliveryDate);
    if (routes.length === 0) return [];
    const db = ctx.supabase as any;
    const { data, error } = await db
      .from("route_stops")
      .select(
        `id, route_id, tenant_id, order_id, sequence, eta, delivered_at, lat, lng,
         orders (
           id, status, notes,
           customers ( display_name ),
           company_locations ( name, address )
         )`,
      )
      .eq("tenant_id", ctx.tenantId)
      .in("route_id", routes.map((r) => r.id))
      .order("sequence", { ascending: true });
    if (error) throw new DomainError("INVALID_STATE", error.message);
    return ((data ?? []) as any[]).map(mapStop);
  },

  async addStop(
    ctx: ServiceContext,
    routeId: string,
    input: { orderId: string },
  ): Promise<StopRow> {
    requireCapability(ctx.roles, "logistics.operate");
    if (!input.orderId) throw new DomainError("INVALID_STATE", "orderId required");
    const stops = await this.listStops(ctx, routeId);
    const nextSeq =
      stops.reduce((m, s) => Math.max(m, s.sequence), 0) + 1;

    const db = ctx.supabase as any;
    const { data, error } = await db
      .from("route_stops")
      .insert({
        tenant_id: ctx.tenantId,
        route_id: routeId,
        order_id: input.orderId,
        sequence: nextSeq,
      })
      .select("id, route_id, tenant_id, order_id, sequence, eta, delivered_at, lat, lng")
      .single();
    if (error) throw new DomainError("INVALID_STATE", error.message);
    await AuditService.write(ctx, {
      entityType: "route_stop",
      entityId: data.id,
      action: "create",
      newData: { routeId, orderId: input.orderId, sequence: nextSeq },
    });
    return mapStop(data);
  },

  async removeStop(ctx: ServiceContext, stopId: string): Promise<void> {
    requireCapability(ctx.roles, "logistics.operate");
    const db = ctx.supabase as any;
    const { data: existing, error: fErr } = await db
      .from("route_stops")
      .select("id, route_id, order_id, sequence")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", stopId)
      .maybeSingle();
    if (fErr) throw new DomainError("INVALID_STATE", fErr.message);
    if (!existing) throw new DomainError("NOT_FOUND", "Stop not found");
    const { error } = await db
      .from("route_stops")
      .delete()
      .eq("tenant_id", ctx.tenantId)
      .eq("id", stopId);
    if (error) throw new DomainError("INVALID_STATE", error.message);
    await AuditService.write(ctx, {
      entityType: "route_stop",
      entityId: stopId,
      action: "archive",
      oldData: existing,
    });
  },

  async markStopDelivered(
    ctx: ServiceContext,
    stopId: string,
    when: string = new Date().toISOString(),
  ): Promise<void> {
    requireCapability(ctx.roles, "logistics.operate");
    const db = ctx.supabase as any;
    const { error } = await db
      .from("route_stops")
      .update({ delivered_at: when })
      .eq("tenant_id", ctx.tenantId)
      .eq("id", stopId);
    if (error) throw new DomainError("INVALID_STATE", error.message);
    await AuditService.write(ctx, {
      entityType: "route_stop",
      entityId: stopId,
      action: "update",
      newData: { delivered_at: when },
    });
  },

  async markOrderStopsDelivered(
    ctx: ServiceContext,
    orderId: string,
    when: string = new Date().toISOString(),
  ): Promise<number> {
    requireCapability(ctx.roles, "logistics.operate");
    const db = ctx.supabase as any;
    const { data, error } = await db
      .from("route_stops")
      .update({ delivered_at: when })
      .eq("tenant_id", ctx.tenantId)
      .eq("order_id", orderId)
      .is("delivered_at", null)
      .select("id");
    if (error) throw new DomainError("INVALID_STATE", error.message);
    return (data ?? []).length;
  },
};
