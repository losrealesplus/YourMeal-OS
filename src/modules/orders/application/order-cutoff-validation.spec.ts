import { describe, expect, it, vi, beforeEach } from "vitest";
import { DomainError } from "@/domain/errors";
import { OrderService } from "./order-service";
import { OrderIntakeService } from "@/modules/order-intake";
import type { ServiceContext } from "@/services/types";

vi.mock("@/services/feature-flag-service", () => ({
  FeatureFlagService: {
    isEnabled: vi.fn(async () => true),
  },
}));

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn(async () => undefined),
  },
}));

const mockFindByIdWithItems = vi.fn();
const mockFindCustomerIdForUser = vi.fn();
const mockConfirmDraft = vi.fn();

vi.mock("../infrastructure/order-repository", () => ({
  createOrderRepository: (_client: unknown, tenantId: string) => ({
    findByIdWithItems: mockFindByIdWithItems,
    findCustomerIdForUser: mockFindCustomerIdForUser,
    confirmDraft: mockConfirmDraft,
  }),
}));

describe("Order Cutoff Validation Suite (TypeScript Application Service Layer)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseCustomerCtx: ServiceContext = {
    supabase: {} as ServiceContext["supabase"],
    userId: "user-cust-1",
    tenantId: "509a67ba-5d66-4298-9a3f-b7e7214974dc",
    tenantSlug: "eatclean",
    roles: ["customer"],
    capabilities: new Set(["orders.write", "orders.read"]),
    localization: null,
    ip: "127.0.0.1",
  };

  const staffCtx: ServiceContext = {
    ...baseCustomerCtx,
    roles: ["company_admin"],
  };

  describe("OrderIntakeService.intakeDraft cutoff enforcement", () => {
    it("rejects non-staff customer draft intake when weekly cutoff has passed (EatClean Friday 14:00)", async () => {
      // 2026-10-12 is strictly past cutoff on Sunday Oct 18
      await expect(
        OrderIntakeService.intakeDraft(
          baseCustomerCtx,
          {
            channel: "app",
            weekStart: "2026-10-12",
            items: [{ dishId: "dish-1", dayDate: "2026-10-12", qty: 1 }],
          },
          { validateCutoff: true },
        ),
      ).rejects.toMatchObject({
        code: "WEEKLY_ORDER_CUTOFF_PASSED",
      });
    });

    it("allows non-staff customer draft intake for upcoming open week (2026-10-19)", async () => {
      // Spying on programDraftItems to return draft order
      const spy = vi.spyOn(OrderService, "programDraftItems").mockResolvedValueOnce({
        order: {
          id: "ord-new-1",
          tenant_id: baseCustomerCtx.tenantId,
          customer_id: "cust-1",
          status: "draft",
          week_start: "2026-10-19",
          total: 15.0,
          created_at: new Date().toISOString(),
        } as any,
        items: [] as any,
      });

      const res = await OrderIntakeService.intakeDraft(
        baseCustomerCtx,
        {
          channel: "app",
          weekStart: "2026-10-19",
          items: [{ dishId: "dish-1", dayDate: "2026-10-19", qty: 1 }],
        },
        { validateCutoff: true },
      );

      expect(res.order.id).toBe("ord-new-1");
      expect(spy).toHaveBeenCalledOnce();
    });

    it("allows staff override for past-cutoff draft intake", async () => {
      const spy = vi.spyOn(OrderService, "programDraftItems").mockResolvedValueOnce({
        order: {
          id: "ord-staff-1",
          tenant_id: staffCtx.tenantId,
          customer_id: "cust-1",
          status: "draft",
          week_start: "2026-10-12",
          total: 15.0,
          created_at: new Date().toISOString(),
        } as any,
        items: [] as any,
      });

      const res = await OrderIntakeService.intakeDraft(
        staffCtx,
        {
          channel: "app",
          weekStart: "2026-10-12",
          items: [{ dishId: "dish-1", dayDate: "2026-10-12", qty: 1 }],
        },
        { validateCutoff: true },
      );

      expect(res.order.id).toBe("ord-staff-1");
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe("OrderService.confirm cutoff enforcement", () => {
    it("rejects non-staff customer confirming draft order after cutoff has passed", async () => {
      mockFindCustomerIdForUser.mockResolvedValue("cust-1");
      mockFindByIdWithItems.mockResolvedValue({
        order: {
          id: "ord-draft-expired",
          tenant_id: baseCustomerCtx.tenantId,
          customer_id: "cust-1",
          status: "draft",
          week_start: "2026-10-12",
          total: 25.0,
          write_contract_version: 1,
        },
        items: [],
      });

      await expect(
        OrderService.confirm(baseCustomerCtx, "ord-draft-expired", { validateCutoff: true }),
      ).rejects.toMatchObject({
        code: "WEEKLY_ORDER_CUTOFF_PASSED",
      });

      expect(mockConfirmDraft).not.toHaveBeenCalled();
    });

    it("allows staff override to confirm past-cutoff draft order", async () => {
      mockFindByIdWithItems.mockResolvedValue({
        order: {
          id: "ord-draft-staff",
          tenant_id: staffCtx.tenantId,
          customer_id: "cust-1",
          status: "draft",
          week_start: "2026-10-12",
          total: 25.0,
          write_contract_version: 1,
        },
        items: [],
      });
      mockConfirmDraft.mockResolvedValue({
        order: {
          id: "ord-draft-staff",
          tenant_id: staffCtx.tenantId,
          customer_id: "cust-1",
          status: "confirmed",
          week_start: "2026-10-12",
          total: 25.0,
        },
        old: {
          status: "draft",
        },
      });

      const result = await OrderService.confirm(staffCtx, "ord-draft-staff", { validateCutoff: true });

      expect(result.status).toBe("confirmed");
      expect(mockConfirmDraft).toHaveBeenCalledOnce();
    });

    it("allows unconfigured tenant to confirm without EatClean Friday cutoff", async () => {
      const otherTenantCtx: ServiceContext = {
        ...baseCustomerCtx,
        tenantId: "other-tenant-id",
        tenantSlug: "peninsula-bistro",
      };

      mockFindCustomerIdForUser.mockResolvedValue("cust-other");
      mockFindByIdWithItems.mockResolvedValue({
        order: {
          id: "ord-other-1",
          tenant_id: "other-tenant-id",
          customer_id: "cust-other",
          status: "draft",
          week_start: "2026-10-19",
          total: 30.0,
          write_contract_version: 1,
        },
        items: [],
      });
      mockConfirmDraft.mockResolvedValue({
        order: {
          id: "ord-other-1",
          tenant_id: "other-tenant-id",
          customer_id: "cust-other",
          status: "confirmed",
          week_start: "2026-10-19",
          total: 30.0,
        },
        old: {
          status: "draft",
        },
      });

      const result = await OrderService.confirm(otherTenantCtx, "ord-other-1", { validateCutoff: true });

      expect(result.status).toBe("confirmed");
      expect(mockConfirmDraft).toHaveBeenCalledOnce();
    });
  });
});
