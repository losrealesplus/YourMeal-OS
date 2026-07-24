/**
 * ADMIN · Producción · Kitchen
 * Redirección al workspace real de Cocina (fuente única, datos reales).
 * Capability: kitchen.operate  ·  Core Object: OperationalOrder (kitchen queue)
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/production/kitchen")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/kitchen" });
  },
  head: () => ({ meta: [{ title: "YourMeal OS — Cocina" }] }),
});
