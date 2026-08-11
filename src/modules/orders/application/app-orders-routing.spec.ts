import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Route as OrdersLayoutRoute } from "@/routes/_authenticated/app.orders";

const root = resolve(import.meta.dirname, "../../..");

/**
 * P0 — `/app/orders` must be an Outlet layout so `/app/orders/$orderId` mounts.
 */
describe("customer orders routing layout", () => {
  it("orders layout component is the Outlet wrapper", () => {
    expect(OrdersLayoutRoute.options.component?.name).toBe("OrdersLayout");
    const layoutSrc = readFileSync(
      resolve(root, "routes/_authenticated/app.orders.tsx"),
      "utf8",
    );
    expect(layoutSrc).toContain("<Outlet />");
    expect(layoutSrc).not.toContain("useCustomerOrders");
  });

  it("generated route tree nests index + $orderId under orders layout", () => {
    const gen = readFileSync(resolve(root, "routeTree.gen.ts"), "utf8");
    expect(gen).toContain("AuthenticatedAppOrdersIndexRoute");
    expect(gen).toContain("fullPath: '/app/orders/'");
    expect(gen).toContain("fullPath: '/app/orders/$orderId'");
    expect(gen).toMatch(
      /AuthenticatedAppOrdersRouteChildren[\s\S]*AuthenticatedAppOrdersIndexRoute[\s\S]*AuthenticatedAppOrdersOrderIdRoute|AuthenticatedAppOrdersRouteChildren[\s\S]*AuthenticatedAppOrdersOrderIdRoute[\s\S]*AuthenticatedAppOrdersIndexRoute/,
    );
  });

  it("list screen lives on the index route file", () => {
    const indexSrc = readFileSync(
      resolve(root, "routes/_authenticated/app.orders.index.tsx"),
      "utf8",
    );
    expect(indexSrc).toContain('"/_authenticated/app/orders/"');
    expect(indexSrc).toContain("useCustomerOrders");
  });
});
