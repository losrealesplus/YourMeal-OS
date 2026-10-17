import { describe, expect, it, vi, beforeEach } from "vitest";
import { DomainError } from "@/domain/errors";
import {
  StaffOrderCaptureService,
  type UniversalOrderCaptureDTO,
} from "./staff-order-capture-service";
import type { ServiceContext } from "@/services/types";
import { assertLegacyOfferSlots } from "@/modules/weekly-menu/application/legacy-offer-write-guard";
import type { WeeklyMenuSlotWithDish } from "@/modules/weekly-menu/infrastructure/weekly-menu-repository";
import { parseOfferWriteRequest } from "@/modules/weekly-menu/application/offer-write-input";

vi.mock("@/services/audit-service", () => ({
  AuditService: {
    write: vi.fn(async () => undefined),
  },
}));

const mockCatalog: Record<string, { id: string; name: string; price: number; status: string }> = {
  "dish-in-menu": { id: "dish-in-menu", name: "Pollo Teriyaki (En Menú)", price: 11.9, status: "active" },
  "dish-off-menu": { id: "dish-off-menu", name: "Lentejas Pardinas (Fuera de Menú)", price: 8.5, status: "active" },
  "dish-inactive": { id: "dish-inactive", name: "Plato Inactivo", price: 10.0, status: "inactive" },
};

vi.mock("@/modules/dish-library/infrastructure/dish-repository", () => ({
  createDishRepository: () => ({
    listCatalogByIds: vi.fn(async (ids: string[]) => {
      return ids.map((id) => mockCatalog[id]).filter(Boolean);
    }),
  }),
}));

vi.mock("@/modules/weekly-menu/infrastructure/weekly-menu-repository", () => ({
  createWeeklyMenuRepository: (_client: unknown, tenantId: string) => ({
    findPublishedByWeekStart: async (weekStart: string) => ({
      id: "menu-week-1",
      tenant_id: tenantId,
      week_start: weekStart,
      status: "published",
      deleted_at: null,
    }),
    listSlotsWithDishes: async () => [
      {
        id: "slot-1",
        tenant_id: tenantId,
        weekly_menu_id: "menu-week-1",
        day_date: "2026-10-19",
        dish_id: "dish-in-menu",
        unit_price: null,
        dishes: { id: "dish-in-menu", tenant_id: tenantId, status: "active", deleted_at: null },
      },
    ],
  }),
}));

function createMockSupabase() {
  const store = {
    customers: [
      { id: "cust-1", tenant_id: "tenant-eatclean-test", display_name: "Cliente Test", deleted_at: null },
    ],
    customer_phones: [] as any[],
    customer_addresses: [] as any[],
    customer_preferences: [] as any[],
    orders: [] as any[],
    order_items: [] as any[],
  };

  const client = {
    from: (table: string) => {
      let currentTable = table;
      let filters: Array<(row: any) => boolean> = [];
      let insertedPayload: any = null;

      const queryBuilder = {
        select: () => queryBuilder,
        eq: (col: string, val: any) => {
          filters.push((row) => row[col] === val);
          return queryBuilder;
        },
        is: (col: string, val: any) => {
          filters.push((row) => (val === null ? row[col] == null : row[col] === val));
          return queryBuilder;
        },
        insert: (payload: any) => {
          insertedPayload = payload;
          return queryBuilder;
        },
        single: async () => {
          if (insertedPayload) {
            const row = { id: `id-${Date.now()}`, ...insertedPayload };
            (store as any)[currentTable]?.push(row);
            return { data: row, error: null };
          }
          const items = ((store as any)[currentTable] || []).filter((r: any) =>
            filters.every((f) => f(r)),
          );
          return { data: items[0] ?? null, error: null };
        },
        maybeSingle: async () => {
          const items = ((store as any)[currentTable] || []).filter((r: any) =>
            filters.every((f) => f(r)),
          );
          return { data: items[0] ?? null, error: null };
        },
        then: (resolve: (val: any) => any) => {
          if (insertedPayload) {
            const rows = Array.isArray(insertedPayload) ? insertedPayload : [insertedPayload];
            (store as any)[currentTable]?.push(...rows);
            return Promise.resolve({ data: rows, error: null }).then(resolve);
          }
          const items = ((store as any)[currentTable] || []).filter((r: any) =>
            filters.every((f) => f(r)),
          );
          return Promise.resolve({ data: items, error: null }).then(resolve);
        },
      };
      return queryBuilder;
    },
  };

  return { client, store };
}

function mockContext(overrides: Partial<ServiceContext> = {}): ServiceContext {
  return {
    supabase: createMockSupabase().client as any,
    userId: "staff-operator-1",
    tenantId: "tenant-eatclean-test",
    tenantSlug: "eatclean-test",
    roles: ["operations_manager"],
    capabilities: new Set(["orders.write"]),
    localization: null,
    ip: "127.0.0.1",
    ...overrides,
  };
}

describe("P1 — Off-Menu Orders Backend Support Audit (Escenario A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Real Service Tests: Off-Menu Dish Capture Verification", () => {
    it("ALLOWS capturing a dish that IS present in the published weekly menu slots", async () => {
      const ctx = mockContext();
      const inMenuDto: UniversalOrderCaptureDTO = {
        customer: { mode: "existing", customerId: "cust-1" },
        weekStart: "2026-10-19",
        autoConfirm: true,
        demandChannel: "company", // Test against the legacy / company path
        companyId: "company-1",
        lines: [{ dayDate: "2026-10-19", dishId: "dish-in-menu", qty: 1 }],
      };

      const result = await StaffOrderCaptureService.captureOrder(ctx, inMenuDto);
      expect(result.order.status).toBe("confirmed");
      expect(result.total).toBe(11.9);
    });

    it("STRICTLY REJECTS capturing an existing catalog dish when it is NOT offered in the weekly menu slots (OFFER_NOT_FOUND)", async () => {
      const ctx = mockContext();
      const offMenuDto: UniversalOrderCaptureDTO = {
        customer: { mode: "existing", customerId: "cust-1" },
        weekStart: "2026-10-19",
        autoConfirm: false,
        demandChannel: "company",
        companyId: "company-1",
        lines: [
          // dish-off-menu exists in catalog, but is NOT scheduled in menu-week-1 slots
          { dayDate: "2026-10-19", dishId: "dish-off-menu", qty: 2 },
        ],
      };

      // Proves that the service layer (assertLegacyOfferWrite) blocks off-menu dishes
      await expect(StaffOrderCaptureService.captureOrder(ctx, offMenuDto)).rejects.toMatchObject({
        code: "OFFER_NOT_FOUND",
        message: expect.stringContaining("No eligible published offer"),
      });
    });

    it("STRICTLY REJECTS at the slot validation boundary (assertLegacyOfferSlots)", () => {
      const slots: WeeklyMenuSlotWithDish[] = [
        {
          id: "slot-1",
          tenant_id: "tenant-eatclean-test",
          weekly_menu_id: "menu-1",
          day_date: "2026-10-19",
          dish_id: "dish-in-menu",
          unit_price: null,
          dishes: { id: "dish-in-menu", tenant_id: "tenant-eatclean-test", status: "active", deleted_at: null },
        } as unknown as WeeklyMenuSlotWithDish,
      ];

      expect(() =>
        assertLegacyOfferSlots(
          "tenant-eatclean-test",
          "menu-1",
          [{ dishId: "dish-off-menu", dayDate: "2026-10-19" }],
          slots,
          false,
        ),
      ).toThrowError(expect.objectContaining({ code: "OFFER_NOT_FOUND" }));
    });

    it("STRICTLY REJECTS off-menu dishes in EatClean Canonical V2 intake (RPC cr_order_offer_quote_issue fails with OFFER_NOT_FOUND)", async () => {
      const { EATCLEAN_TENANT_ID } = await import("@/config/eatclean-partial-launch");
      const ctx = mockContext({
        tenantId: EATCLEAN_TENANT_ID,
        tenantSlug: "eatclean",
      });

      // Transport simulating the PostgreSQL RPC response when dish is not in weekly_menu_slots
      const mockTransport = {
        quote: vi.fn(async () => {
          throw new Error("OFFER_NOT_FOUND");
        }),
        custom: vi.fn(),
        mixed: vi.fn(),
      };

      const offMenuDto: UniversalOrderCaptureDTO = {
        customer: { mode: "existing", customerId: "11111111-1111-4111-8111-111111111111" },
        weekStart: "2026-10-19",
        autoConfirm: true,
        demandChannel: "individual",
        lines: [{ dayDate: "2026-10-19", dishId: "22222222-2222-4222-8222-222222222222", qty: 1 }],
      };

      await expect(
        StaffOrderCaptureService.captureOrder(ctx, offMenuDto, { transport: mockTransport }),
      ).rejects.toThrow("OFFER_NOT_FOUND");
      expect(mockTransport.quote).toHaveBeenCalledTimes(1);
    });
  });

  describe("2. Negative Security & Business Rules", () => {
    it("rejects unauthorized caller without orders.write capability", async () => {
      const ctx = mockContext({ roles: ["kitchen"] });
      const dto: UniversalOrderCaptureDTO = {
        customer: { mode: "existing", customerId: "cust-1" },
        weekStart: "2026-10-19",
        lines: [{ dayDate: "2026-10-19", dishId: "dish-in-menu", qty: 1 }],
      };
      await expect(StaffOrderCaptureService.captureOrder(ctx, dto)).rejects.toMatchObject({
        code: "PERMISSION_DENIED",
      });
    });

    it("rejects non-existent dish ID not in catalog", async () => {
      const ctx = mockContext();
      const dto: UniversalOrderCaptureDTO = {
        customer: { mode: "existing", customerId: "cust-1" },
        weekStart: "2026-10-19",
        lines: [{ dayDate: "2026-10-19", dishId: "non-existent-dish-uuid", qty: 1 }],
      };
      await expect(StaffOrderCaptureService.captureOrder(ctx, dto)).rejects.toMatchObject({
        code: "OFFER_NOT_FOUND",
      });
    });

    it("rejects negative quantities and invalid dates", async () => {
      const ctx = mockContext();
      await expect(
        StaffOrderCaptureService.captureOrder(ctx, {
          customer: { mode: "existing", customerId: "cust-1" },
          weekStart: "2026-10-19",
          lines: [{ dayDate: "invalid-date", dishId: "dish-in-menu", qty: 1 }],
        }),
      ).rejects.toMatchObject({ code: "INVALID_STATE" });

      await expect(
        StaffOrderCaptureService.captureOrder(ctx, {
          customer: { mode: "existing", customerId: "cust-1" },
          weekStart: "2026-10-19",
          lines: [{ dayDate: "2026-10-19", dishId: "dish-in-menu", qty: -1 }],
        }),
      ).rejects.toMatchObject({ code: "INVALID_STATE" });
    });
  });

  describe("3. P1 Implementation: Controlled Admin Exception Verification", () => {
    it("ALLOWS staff with isOffMenu: true to capture catalog dishes not scheduled in weekly menu", async () => {
      const ctx = mockContext();
      const offMenuDto: UniversalOrderCaptureDTO = {
        customer: { mode: "existing", customerId: "cust-1" },
        weekStart: "2026-10-19",
        autoConfirm: true,
        demandChannel: "company",
        companyId: "company-1",
        lines: [
          { dayDate: "2026-10-19", dishId: "dish-off-menu", qty: 2, isOffMenu: true },
        ],
      };

      const result = await StaffOrderCaptureService.captureOrder(ctx, offMenuDto);
      expect(result.order.status).toBe("confirmed");
      // Authoritative pricing: 2 * 8.50 = 17.00 €
      expect(result.total).toBe(17.0);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].dish_id).toBe("dish-off-menu");
    });

    it("ALLOWS mixed orders containing both weekly menu dishes and off-menu catalog dishes", async () => {
      const ctx = mockContext();
      const mixedDto: UniversalOrderCaptureDTO = {
        customer: { mode: "existing", customerId: "cust-1" },
        weekStart: "2026-10-19",
        autoConfirm: true,
        demandChannel: "company",
        companyId: "company-1",
        lines: [
          // 1 x Pollo Teriyaki (in-menu): 11.90 €
          { dayDate: "2026-10-19", dishId: "dish-in-menu", qty: 1 },
          // 2 x Lentejas Pardinas (off-menu exception): 2 * 8.50 = 17.00 €
          { dayDate: "2026-10-19", dishId: "dish-off-menu", qty: 2, isOffMenu: true },
        ],
      };

      const result = await StaffOrderCaptureService.captureOrder(ctx, mixedDto);
      expect(result.order.status).toBe("confirmed");
      // Total: 11.90 + 17.00 = 28.90 €
      expect(result.total).toBe(28.9);
      expect(result.items).toHaveLength(2);
      expect(result.items.map((i) => i.dish_id)).toEqual(["dish-in-menu", "dish-off-menu"]);
    });

    it("enforces parseOfferWriteRequest schema rules on isOffMenu flag", () => {
      // 1. Off-menu flag on dish line is preserved
      const validParsed = parseOfferWriteRequest({
        tenantId: "10000000-0000-4000-8000-000000000001",
        requestId: "70000000-0000-4000-8000-000000000001",
        command: {
          operation: "capture",
          weekStart: "2026-10-19",
          customer: { kind: "existing", id: "30000000-0000-4000-8000-000000000001" },
          lines: [
            {
              kind: "dish",
              dishId: "40000000-0000-4000-8000-000000000001",
              dayDate: "2026-10-19",
              qty: 1,
              isOffMenu: true,
            },
          ],
        },
      });
      expect(validParsed.command.lines[0]).toMatchObject({
        isOffMenu: true,
      });

      // 2. Off-menu cannot have slotId
      expect(() =>
        parseOfferWriteRequest({
          tenantId: "10000000-0000-4000-8000-000000000001",
          requestId: "70000000-0000-4000-8000-000000000001",
          command: {
            operation: "capture",
            weekStart: "2026-10-19",
            customer: { kind: "existing", id: "30000000-0000-4000-8000-000000000001" },
            lines: [
              {
                kind: "dish",
                dishId: "40000000-0000-4000-8000-000000000001",
                slotId: "50000000-0000-4000-8000-000000000001",
                dayDate: "2026-10-19",
                qty: 1,
                isOffMenu: true,
              },
            ],
          },
        }),
      ).toThrow("Off-menu lines cannot claim an offer slot");

      // 3. Custom items cannot claim isOffMenu
      expect(() =>
        parseOfferWriteRequest({
          tenantId: "10000000-0000-4000-8000-000000000001",
          requestId: "70000000-0000-4000-8000-000000000001",
          command: {
            operation: "capture",
            weekStart: "2026-10-19",
            customer: { kind: "existing", id: "30000000-0000-4000-8000-000000000001" },
            lines: [
              {
                kind: "custom",
                name: "Custom plato",
                qty: 1,
                dayDate: "2026-10-19",
                unitPrice: "10.00",
                isOffMenu: true,
              },
            ],
          },
        }),
      ).toThrow("Custom lines cannot claim offMenu status");
    });
  });

  describe("4. Historical Price Suggestions, Level 2 Custom History & Mixed Order Intake", () => {
    it("HISTORICAL_PRICE_SUGGESTION: resolves prices in strict hierarchy (customer > tenant > catalog)", async () => {
      const { fetchDishHistoricalPrice } = await import("./order-historical-queries");

      const makeMockSupabase = (customerResults: any[], tenantResults: any[]) => {
        return {
          from: (_table: string) => {
            let isCustomerQuery = false;
            const builder: any = {
              select: (cols: string) => {
                if (cols.includes("orders!inner")) isCustomerQuery = true;
                return builder;
              },
              eq: (col: string) => {
                if (col === "orders.customer_id") isCustomerQuery = true;
                return builder;
              },
              neq: () => builder,
              is: () => builder,
              order: () => builder,
              limit: async () => {
                const res = isCustomerQuery ? customerResults : tenantResults;
                return { data: res, error: null };
              },
            };
            return builder;
          },
        } as any;
      };

      // 1. Customer history exists -> returns customer_history
      const customerPrice = await fetchDishHistoricalPrice(
        makeMockSupabase([{ unit_price: "9.75" }], []),
        "tenant-1",
        "dish-1",
        "cust-1",
        11.5,
      );
      expect(customerPrice.source).toBe("customer_history");
      expect(customerPrice.suggestedPrice).toBe(9.75);

      // 2. No customer history, but tenant general history exists -> returns tenant_history
      const tenantPrice = await fetchDishHistoricalPrice(
        makeMockSupabase([], [{ unit_price: "10.25" }]),
        "tenant-1",
        "dish-1",
        "cust-1",
        11.5,
      );
      expect(tenantPrice.source).toBe("tenant_history");
      expect(tenantPrice.suggestedPrice).toBe(10.25);

      // 3. No order history at all -> falls back to catalog master price
      const catalogPrice = await fetchDishHistoricalPrice(
        makeMockSupabase([], []),
        "tenant-1",
        "dish-1",
        "cust-1",
        11.5,
      );
      expect(catalogPrice.source).toBe("catalog");
      expect(catalogPrice.suggestedPrice).toBe(11.5);
    });

    it("CUSTOM_ITEM_HISTORY (Level 2 Reusable Items): enforces tenant isolation and name deduplication", async () => {
      const { fetchTenantReusableCustomItems } = await import("./order-historical-queries");

      const mockOrderItems = [
        { tenant_id: "tenant-eatclean", name_snapshot: "Ensalada Detox Personalizada", description_snapshot: "Sin aceite, extra nueces", created_at: "2026-10-15T12:00:00Z" },
        { tenant_id: "tenant-eatclean", name_snapshot: "Ensalada Detox Personalizada", description_snapshot: "Sin aceite, extra nueces", created_at: "2026-10-14T12:00:00Z" }, // Duplicate name
        { tenant_id: "tenant-eatclean", name_snapshot: "Sopa de Pollo Casera", description_snapshot: "Con verduras", created_at: "2026-10-13T12:00:00Z" },
        { tenant_id: "tenant-competitor", name_snapshot: "Pizza Prohibida", description_snapshot: "Otra empresa", created_at: "2026-10-12T12:00:00Z" }, // Different tenant!
      ];

      const mockClient = {
        from: (_table: string) => {
          let tenantFilter = "";
          let searchFilter = "";
          const builder: any = {
            select: () => builder,
            eq: (col: string, val: string) => {
              if (col === "tenant_id") tenantFilter = val;
              return builder;
            },
            is: () => builder,
            order: () => builder,
            limit: () => builder,
            ilike: (_col: string, val: string) => {
              searchFilter = val.replace(/%/g, "").toLowerCase();
              return builder;
            },
            then: (resolve: any) => {
              const filtered = mockOrderItems.filter((item) => {
                if (item.tenant_id !== tenantFilter) return false;
                if (searchFilter && !item.name_snapshot.toLowerCase().includes(searchFilter)) return false;
                return true;
              });
              return Promise.resolve({ data: filtered, error: null }).then(resolve);
            },
          };
          return builder;
        },
      } as any;

      // 1. EatClean tenant retrieves deduplicated items and excludes competitor tenant items
      const eatcleanItems = await fetchTenantReusableCustomItems(mockClient, "tenant-eatclean");
      expect(eatcleanItems).toHaveLength(2);
      expect(eatcleanItems.map((i) => i.name)).toEqual([
        "Ensalada Detox Personalizada",
        "Sopa de Pollo Casera",
      ]);
      expect(eatcleanItems.some((i) => i.name === "Pizza Prohibida")).toBe(false);

      // 2. Search filter works
      const searched = await fetchTenantReusableCustomItems(mockClient, "tenant-eatclean", "Sopa");
      expect(searched).toHaveLength(1);
      expect(searched[0].name).toBe("Sopa de Pollo Casera");
    });

    it("MANUAL_PRICE_OVERRIDE & CANONICAL WRITE: allows unitPriceOverride on off-menu dish lines and rejects on in-menu lines", () => {
      // 1. Allowed on off-menu dish line
      const offMenuWithOverride = parseOfferWriteRequest({
        tenantId: "10000000-0000-4000-8000-000000000001",
        requestId: "70000000-0000-4000-8000-000000000001",
        command: {
          operation: "capture",
          weekStart: "2026-10-19",
          customer: { kind: "existing", id: "30000000-0000-4000-8000-000000000001" },
          lines: [
            {
              kind: "dish",
              dishId: "40000000-0000-4000-8000-000000000001",
              dayDate: "2026-10-19",
              qty: 1,
              isOffMenu: true,
              unitPriceOverride: "13.50",
              unitPriceOverrideReason: "Excepción administrativa fuera de menú",
            },
          ],
        },
      });
      expect(offMenuWithOverride.command.lines[0]).toMatchObject({
        isOffMenu: true,
        unitPriceOverride: "13.50",
        unitPriceOverrideReason: "Excepción administrativa fuera de menú",
      });

      // 2. Strictly forbidden on standard weekly menu dish lines
      expect(() =>
        parseOfferWriteRequest({
          tenantId: "10000000-0000-4000-8000-000000000001",
          requestId: "70000000-0000-4000-8000-000000000001",
          command: {
            operation: "capture",
            weekStart: "2026-10-19",
            customer: { kind: "existing", id: "30000000-0000-4000-8000-000000000001" },
            lines: [
              {
                kind: "dish",
                dishId: "40000000-0000-4000-8000-000000000001",
                dayDate: "2026-10-19",
                qty: 1,
                unitPriceOverride: "13.50", // Not off-menu!
                unitPriceOverrideReason: "Intento inválido en menú",
              },
            ],
          },
        }),
      ).toThrow("Quoted offer capture does not accept manual price overrides on weekly menu dishes");
    });

    it("FREE_TEXT_CUSTOM_ITEM & MANUAL_CUSTOM_PRICE: validates mandatory manual price and zero catalog pollution", async () => {
      const { canonicalCustomLineSchema } = await import("../domain/canonical-order-write");

      // 1. Valid custom item with manual price
      const validCustom = canonicalCustomLineSchema.parse({
        kind: "custom",
        name: "Tortilla de Claras sin Sal",
        description: "6 claras, espinacas y cebolla",
        dayDate: "2026-10-19",
        qty: 1,
        unitPrice: "8.50",
        comment: "Sin aceite añadido",
      });
      expect(validCustom.name).toBe("Tortilla de Claras sin Sal");
      expect(validCustom.unitPrice).toBe("8.50");

      // 2. Missing or invalid manual price rejected by decimal schema
      expect(() =>
        canonicalCustomLineSchema.parse({
          kind: "custom",
          name: "Tortilla",
          dayDate: "2026-10-19",
          qty: 1,
          unitPrice: "", // Empty string
        }),
      ).toThrow();

      expect(() =>
        canonicalCustomLineSchema.parse({
          kind: "custom",
          name: "Tortilla",
          dayDate: "2026-10-19",
          qty: 1,
          unitPrice: "-5.00", // Negative
        }),
      ).toThrow();
    });

    it("MIXED_ORDER (Single Atomic Order): captures weekly menu + off-menu catalog + custom preparation in 1 order", async () => {
      const { EATCLEAN_TENANT_ID } = await import("@/config/eatclean-partial-launch");
      const ctx = mockContext({
        tenantId: EATCLEAN_TENANT_ID,
        tenantSlug: "eatclean",
      });

      let capturedCommand: any = null;

      const mixedDto: UniversalOrderCaptureDTO = {
        customer: { mode: "existing", customerId: "11111111-1111-4111-8111-111111111111" },
        weekStart: "2026-10-19",
        autoConfirm: true,
        demandChannel: "individual",
        lines: [
          // 1. Weekly menu dish
          { dayDate: "2026-10-19", dishId: "dish-in-menu", qty: 2 },
          // 2. Off-menu catalog dish with price override
          { dayDate: "2026-10-19", dishId: "dish-off-menu", qty: 1, isOffMenu: true, unitPriceOverride: 9.5 },
        ],
        customLines: [
          // 3. Fuera de carta custom preparation
          {
            dayDate: "2026-10-19",
            name: "Salmón Salvaje al Vapor con Espárragos",
            description: "Preparación personalizada sin sal",
            qty: 1,
            unitPrice: "15.00",
            comment: "Alergia marisco",
          },
        ],
      };

      // Mock session commits cleanly
      const mockSession = {
        review: { request: { requestId: "99000000-0000-4000-8000-000000000001" } },
        prepare: vi.fn(async (_tId: string, cmd: any) => {
          capturedCommand = cmd;
        }),
        commit: vi.fn(async () => ({
          order: { id: "order-mixed-atomic-1", customer_id: "11111111-1111-4111-8111-111111111111", status: "confirmed", total: "48.30" },
          items: [
            { id: "item-1", dish_id: "dish-in-menu", item_kind: "dish", unit_price: 11.90, quantity: 2 },
            { id: "item-2", dish_id: "dish-off-menu", item_kind: "dish", unit_price: 9.50, quantity: 1 },
            { id: "item-3", custom_order_item_id: "custom-item-1", item_kind: "custom", unit_price: 15.00, quantity: 1 },
          ],
        })),
      };

      const result = await StaffOrderCaptureService.captureOrder(ctx, mixedDto, {
        session: mockSession as any,
      });

      expect(mockSession.prepare).toHaveBeenCalledTimes(1);
      expect(capturedCommand.lines).toHaveLength(3);
      expect(capturedCommand.lines[0]).toMatchObject({ kind: "dish", dishId: "dish-in-menu", qty: 2 });
      expect(capturedCommand.lines[1]).toMatchObject({ kind: "dish", dishId: "dish-off-menu", qty: 1, isOffMenu: true, unitPriceOverride: "9.5000" });
      expect(capturedCommand.lines[2]).toMatchObject({ kind: "custom", name: "Salmón Salvaje al Vapor con Espárragos", qty: 1, unitPrice: "15.00" });

      expect(mockSession.commit).toHaveBeenCalledTimes(1);
      expect(result.order.id).toBe("order-mixed-atomic-1");
      expect(result.order.status).toBe("confirmed");
      expect(result.total).toBe(48.3);
      expect(result.items).toHaveLength(3);
    });
  });
});
