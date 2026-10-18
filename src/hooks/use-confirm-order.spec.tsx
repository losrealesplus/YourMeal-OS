/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useConfirmOrder } from "./use-confirm-order";
import { OrderService } from "@/modules/orders/application/order-service";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {},
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "user-123" },
    tenantId: "tenant-eatclean",
    tenant: { id: "tenant-eatclean", name: "EatClean", slug: "eatclean" },
    roles: ["customer"],
  }),
}));

vi.mock("@/modules/orders/application/order-service", () => ({
  OrderService: {
    confirm: vi.fn().mockResolvedValue({ id: "order-123", status: "confirmed" }),
  },
}));

describe("useConfirmOrder (P0 Cutoff Enforcement Hook)", () => {
  it("delegates to OrderService.confirm with validateCutoff: true", async () => {
    let capturedMutation: any = null;

    function Probe() {
      capturedMutation = useConfirmOrder();
      return <div>probe</div>;
    }

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    renderToString(
      <QueryClientProvider client={queryClient}>
        <Probe />
      </QueryClientProvider>,
    );

    expect(capturedMutation).toBeDefined();

    await capturedMutation.mutateAsync({
      orderId: "order-123",
      expectedTotal: 25.5,
    });

    expect(OrderService.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        tenantId: "tenant-eatclean",
        tenantSlug: "eatclean",
      }),
      "order-123",
      expect.objectContaining({
        expectedTotal: 25.5,
        validateCutoff: true,
      }),
    );
  });
});
