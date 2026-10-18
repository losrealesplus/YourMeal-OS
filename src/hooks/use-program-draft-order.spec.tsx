/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useProgramDraftOrder } from "./use-program-draft-order";
import { OrderIntakeService } from "@/modules/order-intake";

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

vi.mock("@/modules/order-intake", () => ({
  OrderIntakeService: {
    intakeDraft: vi.fn().mockResolvedValue({ order: { id: "ord-new", status: "draft" } }),
    intakeDraftDay: vi.fn().mockResolvedValue({ order: { id: "ord-new", status: "draft" } }),
  },
}));

describe("useProgramDraftOrder (P0 Cutoff Enforcement Hook)", () => {
  it("delegates to OrderIntakeService.intakeDraft with validateCutoff: true", async () => {
    let capturedMutation: any = null;

    function Probe() {
      capturedMutation = useProgramDraftOrder();
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
      weekStart: "2026-10-19",
      items: [{ dishId: "dish-1", dayDate: "2026-10-19", qty: 2 }],
    });

    expect(OrderIntakeService.intakeDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        tenantId: "tenant-eatclean",
        tenantSlug: "eatclean",
      }),
      expect.objectContaining({
        channel: "app",
        weekStart: "2026-10-19",
      }),
      expect.objectContaining({
        validateCutoff: true,
      }),
    );
  });
});
