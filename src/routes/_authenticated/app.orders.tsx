import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout: Customer · Orders
 * Parent of `/app/orders/` (list) and `/app/orders/$orderId` (summary).
 * Must render <Outlet /> so the child route mounts.
 */
export const Route = createFileRoute("/_authenticated/app/orders")({
  component: OrdersLayout,
});

function OrdersLayout() {
  return <Outlet />;
}
