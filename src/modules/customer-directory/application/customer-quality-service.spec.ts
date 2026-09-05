import { describe, it, expect, vi } from "vitest";
import {
  evaluateCustomerQuality,
  normalizePhone,
  normalizeEmail,
  isVariableLocationText,
  allowedActionsForAlert,
  ALLOWED_ACTIONS_BY_ALERT,
  type CustomerEvaluationInput,
  type CustomerQualityDismissalRecord,
  type QualityAlertCode,
  type ImprovementActionKind,
} from "../domain/customer-quality";
import { CustomerQualityService } from "./customer-quality-service";
import type { ServiceContext } from "@/services/types";

describe("Customer Quality & Improvement Alerts Domain Engine", () => {
  describe("normalizers & helpers", () => {
    it("normalizes Spanish and international phone formats correctly", () => {
      expect(normalizePhone("+34 683 43 67 17")).toBe("683436717");
      expect(normalizePhone("0034683436717")).toBe("683436717");
      expect(normalizePhone("683 436 717")).toBe("683436717");
      expect(normalizePhone("683436717")).toBe("683436717");
      expect(normalizePhone("+34 639 24 34")).toBe("6392434"); // 7 digits accepted as partial
      expect(normalizePhone("123")).toBeNull(); // < 7 digits is invalid
      expect(normalizePhone(null)).toBeNull();
      expect(normalizePhone("")).toBeNull();
    });

    it("normalizes email addresses to trimmed lowercase", () => {
      expect(normalizeEmail("  Test.User@Example.Com  ")).toBe("test.user@example.com");
      expect(normalizeEmail("invalid-email")).toBeNull();
      expect(normalizeEmail(null)).toBeNull();
    });

    it("detects variable location keywords", () => {
      expect(isVariableLocationText("Ubicación variable")).toBe(true);
      expect(isVariableLocationText("Cliente con direccion variable")).toBe(true);
      expect(isVariableLocationText("Se mueve entre sedes")).toBe(true);
      expect(isVariableLocationText("Calle Mayor 10, Madrid")).toBe(false);
      expect(isVariableLocationText(null)).toBe(false);
    });
  });

  describe("allowedActionsForAlert & improvement action contracts", () => {
    const allExpectedAlertCodes: QualityAlertCode[] = [
      "missing_phone",
      "missing_address",
      "missing_delivery_instructions",
      "variable_location_without_instruction",
      "incomplete_profile",
      "duplicate_phone",
      "duplicate_email",
      "duplicate_maps",
      "duplicate_address",
      "possible_duplicate",
    ];

    it("maps EVERY QualityAlertCode to a non-empty list of allowed actions without fallback", () => {
      for (const alertCode of allExpectedAlertCodes) {
        const actions = allowedActionsForAlert(alertCode);
        expect(actions).toBeDefined();
        expect(Array.isArray(actions)).toBe(true);
        expect(actions.length).toBeGreaterThan(0);
        expect(ALLOWED_ACTIONS_BY_ALERT[alertCode]).toEqual(actions);
      }
    });

    it("verifies incomplete_profile rationale: critical severity only allows defer_review (NO dismiss_irrelevant)", () => {
      const actions = allowedActionsForAlert("incomplete_profile");
      expect(actions).toEqual(["defer_review"]);
      expect(actions).not.toContain("dismiss_irrelevant");
    });

    it("verifies missing data alerts allow resolution, deferral, and dismissal as irrelevant", () => {
      expect(allowedActionsForAlert("missing_phone")).toEqual([
        "add_phone",
        "defer_review",
        "dismiss_irrelevant",
      ]);
      expect(allowedActionsForAlert("missing_address")).toEqual([
        "add_address",
        "defer_review",
        "dismiss_irrelevant",
      ]);
      expect(allowedActionsForAlert("missing_delivery_instructions")).toEqual([
        "add_delivery_instructions",
        "defer_review",
        "dismiss_irrelevant",
      ]);
      expect(allowedActionsForAlert("variable_location_without_instruction")).toEqual([
        "add_delivery_instructions",
        "defer_review",
        "dismiss_irrelevant",
      ]);
    });

    it("verifies duplicate alerts allow confirming distinct customer and deferring review (NO dismiss_irrelevant)", () => {
      const duplicateAlerts: QualityAlertCode[] = [
        "duplicate_phone",
        "duplicate_email",
        "duplicate_maps",
        "duplicate_address",
        "possible_duplicate",
      ];

      for (const dupAlert of duplicateAlerts) {
        expect(allowedActionsForAlert(dupAlert)).toEqual([
          "confirm_distinct_customer",
          "defer_review",
        ]);
      }
    });

    it("returns a new mutable array copy to avoid accidental mutation of the constant dictionary", () => {
      const actions1 = allowedActionsForAlert("missing_phone");
      const actions2 = allowedActionsForAlert("missing_phone");
      expect(actions1).toEqual(actions2);
      expect(actions1).not.toBe(actions2); // different references
      actions1.push("dismiss_irrelevant" as ImprovementActionKind);
      expect(allowedActionsForAlert("missing_phone")).toHaveLength(3);
    });
  });

  describe("evaluateCustomerQuality — pure detection", () => {
    it("detects complete customer profile with 0 active alerts", () => {
      const customer: CustomerEvaluationInput = {
        id: "cust-1",
        displayName: "Julio Fernandez",
        email: "julio@example.com",
        phones: [{ phone: "+34 600 11 22 33", isPrimary: true }],
        addresses: [{ street: "Calle Castillo 12", city: "Santa Cruz" }],
      };

      const evalResult = evaluateCustomerQuality(customer);

      expect(evalResult.status).toBe("complete");
      expect(evalResult.activeAlertCount).toBe(0);
      expect(evalResult.hasCriticalAlerts).toBe(false);
      expect(evalResult.completenessPercentage).toBeGreaterThanOrEqual(90);
    });

    it("detects missing phone and missing address alerts", () => {
      const customer: CustomerEvaluationInput = {
        id: "cust-2",
        displayName: "Sin Contacto",
        email: "sincontacto@example.com",
        phones: [],
        addresses: [],
      };

      const evalResult = evaluateCustomerQuality(customer);

      expect(evalResult.status).toBe("improver");
      expect(evalResult.activeAlertCount).toBe(2);
      expect(evalResult.alerts.map((a) => a.alertType)).toEqual(
        expect.arrayContaining(["missing_phone", "missing_address"]),
      );

      const phoneAlert = evalResult.alerts.find((a) => a.alertType === "missing_phone");
      expect(phoneAlert?.allowedActions).toEqual(
        expect.arrayContaining(["add_phone", "defer_review", "dismiss_irrelevant"]),
      );

      const addrAlert = evalResult.alerts.find((a) => a.alertType === "missing_address");
      expect(addrAlert?.allowedActions).toEqual(
        expect.arrayContaining(["add_address", "defer_review", "dismiss_irrelevant"]),
      );
    });

    it("detects missing all contact info and marks needs_attention", () => {
      const customer: CustomerEvaluationInput = {
        id: "cust-3",
        displayName: "Solo Nombre",
        email: null,
        phones: [],
        addresses: [{ street: "Calle Central 1" }],
      };

      const evalResult = evaluateCustomerQuality(customer);

      expect(evalResult.status).toBe("needs_attention");
      expect(evalResult.activeAlertCount).toBe(1); // missing_phone
    });

    it("detects incomplete profile (missing displayName) with critical severity", () => {
      const customer: CustomerEvaluationInput = {
        id: "cust-4",
        displayName: "",
        phones: ["611223344"],
        addresses: ["Calle Norte 5"],
      };

      const evalResult = evaluateCustomerQuality(customer);

      expect(evalResult.status).toBe("needs_attention");
      expect(evalResult.hasCriticalAlerts).toBe(true);
      const criticalAlert = evalResult.alerts.find((a) => a.alertType === "incomplete_profile");
      expect(criticalAlert).toBeDefined();
      expect(criticalAlert?.severity).toBe("critical");
    });

    it("detects variable location without instructions", () => {
      const customer: CustomerEvaluationInput = {
        id: "cust-5",
        displayName: "Itaiza Variable",
        email: "itaiza@example.com",
        phones: ["655443322"],
        addresses: [{ street: "Ubicación variable" }],
        notes: "variable",
      };

      const evalResult = evaluateCustomerQuality(customer);

      expect(evalResult.status).toBe("needs_attention");
      const alert = evalResult.alerts.find(
        (a) => a.alertType === "variable_location_without_instruction",
      );
      expect(alert).toBeDefined();
      expect(alert?.severity).toBe("warning");
    });

    it("evaluates duplicate phone hypothesis deterministically against directory", () => {
      const customerA: CustomerEvaluationInput = {
        id: "cust-a",
        displayName: "Alberto Oficina",
        email: "alberto.oficina@example.com",
        phones: ["+34 688 123 456"],
        addresses: ["Av. Anaga 10"],
      };

      const customerB: CustomerEvaluationInput = {
        id: "cust-b",
        displayName: "Alberto Casa",
        email: "alberto.casa@example.com",
        phones: ["688 123 456"],
        addresses: ["Calle del Pilar 4"],
      };

      const evalResultA = evaluateCustomerQuality(customerA, {
        allCustomers: [customerA, customerB],
      });

      const dupAlert = evalResultA.alerts.find((a) => a.alertType === "duplicate_phone");
      expect(dupAlert).toBeDefined();
      expect(dupAlert?.targetCustomerId).toBe("cust-b");
      expect(dupAlert?.evidence.conflictingCustomerName).toBe("Alberto Casa");
      expect(dupAlert?.evidence.detectedValue).toBe("688123456");
    });

    it("evaluates duplicate maps hypothesis deterministically when canonical maps URL or coords match", () => {
      const customer1: CustomerEvaluationInput = {
        id: "cust-m1",
        displayName: "Pedro Madroñal",
        email: "pedro.m@example.com",
        phones: ["+34 611 111 222"],
        addresses: [
          {
            street: "Calle Madroñal 10",
            notes: "https://maps.google.com/?q=28.12345,-16.65432",
          },
        ],
      };

      const customer2: CustomerEvaluationInput = {
        id: "cust-m2",
        displayName: "Pedro Adeje",
        email: "pedro.a@example.com",
        phones: ["+34 622 222 333"],
        addresses: [
          {
            street: "Calle Adeje 20",
            notes: "https://maps.google.com/?q=28.12345,-16.65432",
          },
        ],
      };

      const evalResult1 = evaluateCustomerQuality(customer1, {
        allCustomers: [customer1, customer2],
      });

      const mapsAlert = evalResult1.alerts.find((a) => a.alertType === "duplicate_maps");
      expect(mapsAlert).toBeDefined();
      expect(mapsAlert?.targetCustomerId).toBe("cust-m2");
      expect(mapsAlert?.evidence.conflictingCustomerName).toBe("Pedro Adeje");
    });

    it("evaluates duplicate address hypothesis deterministically on exact structured address", () => {
      const customer1: CustomerEvaluationInput = {
        id: "cust-addr1",
        displayName: "Cliente A",
        phones: ["+34 600 000 001"],
        addresses: [
          {
            street: "Calle Castillo 15, 2B",
            city: "Santa Cruz",
            zip: "38002",
          },
        ],
      };

      const customer2: CustomerEvaluationInput = {
        id: "cust-addr2",
        displayName: "Cliente B",
        phones: ["+34 600 000 002"],
        addresses: [
          {
            street: "c/ castillo 15, 2b",
            city: "santa cruz",
            zip: "38002",
          },
        ],
      };

      const evalResult1 = evaluateCustomerQuality(customer1, {
        allCustomers: [customer1, customer2],
      });

      const addrAlert = evalResult1.alerts.find((a) => a.alertType === "duplicate_address");
      expect(addrAlert).toBeDefined();
      expect(addrAlert?.targetCustomerId).toBe("cust-addr2");
      expect(addrAlert?.allowedActions).toEqual(
        expect.arrayContaining(["confirm_distinct_customer", "defer_review"]),
      );
    });

    it("emits possible_duplicate when >= 2 deterministic signals coincide (e.g. phone + address)", () => {
      const customer1: CustomerEvaluationInput = {
        id: "cust-multi1",
        displayName: "Pedro Uno",
        email: "pedro@test.com",
        phones: ["+34 699 112 233"],
        addresses: [
          {
            street: "Calle Castillo 10",
            city: "Santa Cruz",
          },
        ],
      };

      const customer2: CustomerEvaluationInput = {
        id: "cust-multi2",
        displayName: "Pedro Dos",
        email: "pedro.otro@test.com",
        phones: ["699 112 233"],
        addresses: [
          {
            street: "c/ castillo 10",
            city: "santa cruz",
          },
        ],
      };

      const evalResult1 = evaluateCustomerQuality(customer1, {
        allCustomers: [customer1, customer2],
      });

      const possibleDupAlert = evalResult1.alerts.find((a) => a.alertType === "possible_duplicate");
      expect(possibleDupAlert).toBeDefined();
      expect(possibleDupAlert?.severity).toBe("warning");
      expect(possibleDupAlert?.evidence.rationale).toContain("Matched 2 deterministic signals");
      expect(possibleDupAlert?.allowedActions).toEqual(
        expect.arrayContaining(["confirm_distinct_customer", "defer_review"]),
      );
    });

    it("NEGATIVE TEST: IDENTICAL names without shared phone/email/maps/address NEVER trigger duplicate alerts", () => {
      const customer1: CustomerEvaluationInput = {
        id: "cust-id1",
        displayName: "Carlos Santana",
        email: "carlos1@music.com",
        phones: ["+34 611 111 111"],
        addresses: ["Calle Norte 1"],
      };

      const customer2: CustomerEvaluationInput = {
        id: "cust-id2",
        displayName: "Carlos Santana",
        email: "carlos2@music.com",
        phones: ["+34 622 222 222"],
        addresses: ["Calle Sur 2"],
      };

      const evalResult1 = evaluateCustomerQuality(customer1, {
        allCustomers: [customer1, customer2],
      });

      const dupPhone = evalResult1.alerts.find((a) => a.alertType === "duplicate_phone");
      const dupEmail = evalResult1.alerts.find((a) => a.alertType === "duplicate_email");
      const dupMaps = evalResult1.alerts.find((a) => a.alertType === "duplicate_maps");
      const dupAddr = evalResult1.alerts.find((a) => a.alertType === "duplicate_address");
      const possDup = evalResult1.alerts.find((a) => a.alertType === "possible_duplicate");

      expect(dupPhone).toBeUndefined();
      expect(dupEmail).toBeUndefined();
      expect(dupMaps).toBeUndefined();
      expect(dupAddr).toBeUndefined();
      expect(possDup).toBeUndefined();
    });

    it("NEGATIVE TEST: similar names WITHOUT shared phone/email/maps/address NEVER trigger duplicate alerts", () => {
      const customer1: CustomerEvaluationInput = {
        id: "cust-p1",
        displayName: "Pedro Madroñal",
        email: "pedro.madronal@example.com",
        phones: ["+34 611 000 111"],
        addresses: ["Calle Madroñal 1"],
      };

      const customer2: CustomerEvaluationInput = {
        id: "cust-p2",
        displayName: "Pedro Adeje",
        email: "pedro.adeje@example.com",
        phones: ["+34 622 000 222"],
        addresses: ["Calle Adeje 5"],
      };

      const evalResult1 = evaluateCustomerQuality(customer1, {
        allCustomers: [customer1, customer2],
      });

      const dupPhone = evalResult1.alerts.find((a) => a.alertType === "duplicate_phone");
      const dupEmail = evalResult1.alerts.find((a) => a.alertType === "duplicate_email");
      const possDup = evalResult1.alerts.find((a) => a.alertType === "possible_duplicate");

      expect(dupPhone).toBeUndefined();
      expect(dupEmail).toBeUndefined();
      expect(possDup).toBeUndefined();
      expect(evalResult1.status).toBe("complete");
    });

    it("applies dismissals and respects dismiss reason semantics (not_now vs not_same_customer)", () => {
      const customerA: CustomerEvaluationInput = {
        id: "cust-a",
        displayName: "Cliente A",
        phones: ["699887766"],
        addresses: [],
      };

      const dismissal: CustomerQualityDismissalRecord = {
        id: "d-1",
        tenantId: "tenant-1",
        customerId: "cust-a",
        alertType: "missing_address",
        dismissReason: "not_now",
        dismissedBy: "user-staff",
        dismissedAt: "2026-09-05T12:00:00Z",
        notes: "Cliente recogerá en local temporalmente",
      };

      const evalResult = evaluateCustomerQuality(customerA, {
        dismissals: [dismissal],
      });

      const alert = evalResult.alerts.find((a) => a.alertType === "missing_address");
      expect(alert).toBeDefined();
      expect(alert?.status).toBe("dismissed");
      expect(alert?.dismissReason).toBe("not_now");
      expect(alert?.dismissedBy).toBe("user-staff");
      expect(evalResult.activeAlertCount).toBe(0);
    });

    it("INVARIANT GUARANTEE: DETECCIÓN ≠ DECISIÓN — zero input mutation", () => {
      const inputCustomer: CustomerEvaluationInput = {
        id: "cust-safe",
        displayName: "Cliente Intacto",
        email: "test@domain.com",
        phones: ["600112233"],
        addresses: ["Calle Real 1"],
      };

      const snapshotBefore = JSON.stringify(inputCustomer);
      evaluateCustomerQuality(inputCustomer);
      const snapshotAfter = JSON.stringify(inputCustomer);

      expect(snapshotAfter).toBe(snapshotBefore);
    });
  });

  describe("CustomerQualityService application operations", () => {
    const mockTenantId = "00000000-0000-0000-0000-000000000001";
    const mockUserId = "00000000-0000-0000-0000-000000000002";

    function createMockCtx(capabilities: string[]): ServiceContext {
      const mockDb: any = {
        from: vi.fn((table: string) => {
          if (table === "customers") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({
                    data: [
                      { id: "c1", display_name: "Cliente 1", email: "c1@test.com", kind: "individual", deleted_at: null },
                      { id: "c2", display_name: "Cliente 2", email: "c2@test.com", kind: "individual", deleted_at: null },
                    ],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "customer_phones") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({
                    data: [{ id: "p1", customer_id: "c1", phone: "611223344", is_primary: true, deleted_at: null }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "customer_addresses") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({
                    data: [{ id: "a1", customer_id: "c1", street: "Calle Uno", city: "S/C", zip: "38001", label: "Casa", is_default: true, deleted_at: null }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "customer_quality_dismissals") {
            const queryObj: any = {
              data: [],
              error: null,
              eq: vi.fn().mockImplementation(() => queryObj),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "d1", tenant_id: mockTenantId, customer_id: "c2", alert_type: "missing_phone", dismiss_reason: "not_now" },
                error: null,
              }),
            };

            return {
              select: vi.fn().mockReturnValue(queryObj),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "d-new",
                      tenant_id: mockTenantId,
                      customer_id: "c2",
                      alert_type: "missing_phone",
                      dismiss_reason: "not_now",
                      target_customer_id: null,
                      dismissed_by: mockUserId,
                      dismissed_at: "2026-09-05T12:00:00Z",
                      notes: "No tiene telefono",
                    },
                    error: null,
                  }),
                }),
              }),
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              }),
            };
          }
          if (table === "audit_log") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      };

      return {
        supabase: mockDb as any,
        userId: mockUserId,
        tenantId: mockTenantId,
        roles: ["operations_manager"],
        capabilities: new Set(capabilities as any),
      };
    }

    it("evaluates a customer via evaluateCustomer() with RBAC capability check", async () => {
      const ctx = createMockCtx(["customers.read"]);
      const evaluation = await CustomerQualityService.evaluateCustomer(ctx, "c1");

      expect(evaluation.customerId).toBe("c1");
      expect(evaluation.status).toBe("complete");
      expect(evaluation.activeAlertCount).toBe(0);
    });

    it("denies read when lacking customers.read / support.read capabilities", async () => {
      const ctx = createMockCtx(["orders.read"]);
      await expect(CustomerQualityService.evaluateCustomer(ctx, "c1")).rejects.toThrow(
        /Missing capability/i,
      );
    });

    it("evaluates tenant directory and lists active alerts", async () => {
      const ctx = createMockCtx(["customers.read"]);
      const alerts = await CustomerQualityService.listAlerts(ctx);

      expect(Array.isArray(alerts)).toBe(true);
      // c2 has missing_phone and missing_address
      const c2Alerts = alerts.filter((a) => a.customerId === "c2");
      expect(c2Alerts.length).toBeGreaterThan(0);
    });

    it("dismisses an alert with dismissAlert() and records audit log", async () => {
      const ctx = createMockCtx(["customers.read", "customers.write"]);
      const dismissal = await CustomerQualityService.dismissAlert(ctx, {
        customerId: "c2",
        alertType: "missing_phone",
        dismissReason: "not_now",
        notes: "No tiene telefono",
      });

      expect(dismissal.id).toBe("d-new");
      expect(dismissal.customerId).toBe("c2");
      expect(dismissal.alertType).toBe("missing_phone");
      expect(dismissal.dismissReason).toBe("not_now");
    });

    it("reopens a dismissed alert with reopenAlert()", async () => {
      const ctx = createMockCtx(["customers.read", "customers.write"]);
      await expect(CustomerQualityService.reopenAlert(ctx, "d1")).resolves.not.toThrow();
    });
  });
});
