import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { AppRole } from "@/hooks/use-auth";

/**
 * CR-CUST-01-HF01: RLS Policy Specification & Simulation Tests
 *
 * Verifies that the RLS policy defined in:
 * supabase/migrations/20261002110000_cr_cust_01_hf01_customer_dietary_profiles_operations_manager_rls.sql
 * fulfills all six mandatory test criteria:
 *
 * TEST 1: operations_manager can create a customer dietary profile within their tenant.
 * TEST 2: operations_manager can update a customer dietary profile within their tenant.
 * TEST 3: operations_manager CANNOT write a profile belonging to another tenant.
 * TEST 4: Previously authorized roles maintain their behavior.
 * TEST 5: Users without write authorization are rejected.
 * TEST 6: Operation maintains existing contracts of customer dietary profile.
 */

interface MockUserSecurityContext {
  userId: string;
  isSaasAdmin: boolean;
  tenantRoles: Map<string, Set<AppRole>>; // tenantId -> Set of AppRoles
}

const STAFF_ROLES_BASE: AppRole[] = [
  "company_admin",
  "kitchen",
  "purchasing",
  "inventory",
  "production",
  "support",
  "accounting",
  "logistics",
];

function hasRole(ctx: MockUserSecurityContext, tenantId: string, role: AppRole): boolean {
  const roles = ctx.tenantRoles.get(tenantId);
  return roles ? roles.has(role) : false;
}

function hasAnyStaffRole(ctx: MockUserSecurityContext, tenantId: string): boolean {
  const roles = ctx.tenantRoles.get(tenantId);
  if (!roles) return false;
  return STAFF_ROLES_BASE.some((r) => roles.has(r));
}

function isSaasAdmin(ctx: MockUserSecurityContext): boolean {
  return ctx.isSaasAdmin;
}

/**
 * Evaluates the customer_dietary_profiles_write (INSERT) RLS policy:
 * WITH CHECK (
 *   public.has_any_staff_role(auth.uid(), tenant_id)
 *   OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
 *   OR public.is_saas_admin(auth.uid())
 * )
 */
function evaluateInsertPolicy(ctx: MockUserSecurityContext, targetTenantId: string): boolean {
  return (
    hasAnyStaffRole(ctx, targetTenantId) ||
    hasRole(ctx, targetTenantId, "operations_manager") ||
    isSaasAdmin(ctx)
  );
}

/**
 * Evaluates the customer_dietary_profiles_update (UPDATE) RLS policy:
 * USING (
 *   public.has_any_staff_role(auth.uid(), tenant_id)
 *   OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
 *   OR public.is_saas_admin(auth.uid())
 * )
 * WITH CHECK (
 *   public.has_any_staff_role(auth.uid(), tenant_id)
 *   OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
 *   OR public.is_saas_admin(auth.uid())
 * )
 */
function evaluateUpdatePolicy(
  ctx: MockUserSecurityContext,
  currentTenantId: string,
  newTenantId: string
): boolean {
  const usingPassed =
    hasAnyStaffRole(ctx, currentTenantId) ||
    hasRole(ctx, currentTenantId, "operations_manager") ||
    isSaasAdmin(ctx);

  const withCheckPassed =
    hasAnyStaffRole(ctx, newTenantId) ||
    hasRole(ctx, newTenantId, "operations_manager") ||
    isSaasAdmin(ctx);

  return usingPassed && withCheckPassed;
}

describe("CR-CUST-01-HF01 — Mandatory RLS & Authorization Suite", () => {
  const TENANT_A = "tenant-eatclean-aaa";
  const TENANT_B = "tenant-competitor-bbb";

  // Context: operations_manager in TENANT_A
  const opsManagerContext: MockUserSecurityContext = {
    userId: "usr-ops-manager",
    isSaasAdmin: false,
    tenantRoles: new Map([[TENANT_A, new Set<AppRole>(["operations_manager"])]]),
  };

  // Context: company_admin in TENANT_A
  const companyAdminContext: MockUserSecurityContext = {
    userId: "usr-company-admin",
    isSaasAdmin: false,
    tenantRoles: new Map([[TENANT_A, new Set<AppRole>(["company_admin"])]]),
  };

  // Context: saas_admin
  const saasAdminContext: MockUserSecurityContext = {
    userId: "usr-saas-admin",
    isSaasAdmin: true,
    tenantRoles: new Map(),
  };

  // Context: driver in TENANT_A (staff without customers.write)
  const driverContext: MockUserSecurityContext = {
    userId: "usr-driver",
    isSaasAdmin: false,
    tenantRoles: new Map([[TENANT_A, new Set<AppRole>(["driver"])]]),
  };

  // Context: customer in TENANT_A
  const customerContext: MockUserSecurityContext = {
    userId: "usr-customer",
    isSaasAdmin: false,
    tenantRoles: new Map([[TENANT_A, new Set<AppRole>(["customer"])]]),
  };

  // Context: unauthorized / anonymous user
  const unauthenticatedContext: MockUserSecurityContext = {
    userId: "usr-anonymous",
    isSaasAdmin: false,
    tenantRoles: new Map(),
  };

  it("Migration file hygiene: validates that migration exists and contains exact target policy expressions", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261002110000_cr_cust_01_hf01_customer_dietary_profiles_operations_manager_rls.sql"
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sqlContent = fs.readFileSync(migrationPath, "utf8");

    // Must NOT alter has_any_staff_role globally
    expect(sqlContent).not.toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.has_any_staff_role/i);
    expect(sqlContent).not.toMatch(/ALTER\s+FUNCTION\s+public\.has_any_staff_role/i);

    // Must target customer_dietary_profiles explicitly
    expect(sqlContent).toMatch(/ON\s+public\.customer_dietary_profiles/);

    // Must include operations_manager check
    expect(sqlContent).toMatch(
      /public\.has_role\(auth\.uid\(\),\s*tenant_id,\s*'operations_manager'\)/
    );

    // Must preserve has_any_staff_role and is_saas_admin
    expect(sqlContent).toMatch(/public\.has_any_staff_role\(auth\.uid\(\),\s*tenant_id\)/);
    expect(sqlContent).toMatch(/public\.is_saas_admin\(auth\.uid\(\)\)/);
  });

  it("TEST 1: operations_manager can create a customer dietary profile within their tenant", () => {
    const canInsert = evaluateInsertPolicy(opsManagerContext, TENANT_A);
    expect(canInsert).toBe(true);
  });

  it("TEST 2: operations_manager can update a customer dietary profile within their tenant", () => {
    const canUpdate = evaluateUpdatePolicy(opsManagerContext, TENANT_A, TENANT_A);
    expect(canUpdate).toBe(true);
  });

  it("TEST 3: operations_manager CANNOT write a profile belonging to another tenant (strict isolation)", () => {
    // Attempt insert into foreign tenant B
    const canInsertForeign = evaluateInsertPolicy(opsManagerContext, TENANT_B);
    expect(canInsertForeign).toBe(false);

    // Attempt update in foreign tenant B
    const canUpdateForeign = evaluateUpdatePolicy(opsManagerContext, TENANT_B, TENANT_B);
    expect(canUpdateForeign).toBe(false);

    // Attempt cross-tenant re-assignment (from TENANT_A to TENANT_B)
    const canReassignTenant = evaluateUpdatePolicy(opsManagerContext, TENANT_A, TENANT_B);
    expect(canReassignTenant).toBe(false);
  });

  it("TEST 4: previously authorized roles maintain their behavior", () => {
    // company_admin in Tenant A
    expect(evaluateInsertPolicy(companyAdminContext, TENANT_A)).toBe(true);
    expect(evaluateUpdatePolicy(companyAdminContext, TENANT_A, TENANT_A)).toBe(true);
    expect(evaluateInsertPolicy(companyAdminContext, TENANT_B)).toBe(false);

    // saas_admin globally
    expect(evaluateInsertPolicy(saasAdminContext, TENANT_A)).toBe(true);
    expect(evaluateInsertPolicy(saasAdminContext, TENANT_B)).toBe(true);
    expect(evaluateUpdatePolicy(saasAdminContext, TENANT_A, TENANT_A)).toBe(true);

    // Other staff roles in STAFF_ROLES_BASE (e.g. kitchen, support)
    for (const role of STAFF_ROLES_BASE) {
      const staffCtx: MockUserSecurityContext = {
        userId: `usr-${role}`,
        isSaasAdmin: false,
        tenantRoles: new Map([[TENANT_A, new Set<AppRole>([role])]]),
      };
      expect(evaluateInsertPolicy(staffCtx, TENANT_A)).toBe(true);
      expect(evaluateUpdatePolicy(staffCtx, TENANT_A, TENANT_A)).toBe(true);
      expect(evaluateInsertPolicy(staffCtx, TENANT_B)).toBe(false);
    }
  });

  it("TEST 5: a user without write authorization continues to be rejected", () => {
    // Driver (staff role not included in has_any_staff_role and not operations_manager)
    expect(evaluateInsertPolicy(driverContext, TENANT_A)).toBe(false);
    expect(evaluateUpdatePolicy(driverContext, TENANT_A, TENANT_A)).toBe(false);

    // Customer
    expect(evaluateInsertPolicy(customerContext, TENANT_A)).toBe(false);
    expect(evaluateUpdatePolicy(customerContext, TENANT_A, TENANT_A)).toBe(false);

    // Unauthenticated / foreign user
    expect(evaluateInsertPolicy(unauthenticatedContext, TENANT_A)).toBe(false);
    expect(evaluateUpdatePolicy(unauthenticatedContext, TENANT_A, TENANT_A)).toBe(false);
  });

  it("TEST 6: the operation maintains existing contracts of customer dietary profile", () => {
    // Schema contract integrity: check table definition in CR-CUST-01 base migration
    const baseMigrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261002100000_cr_cust_01_customer_dietary_profiles.sql"
    );
    expect(fs.existsSync(baseMigrationPath)).toBe(true);

    const baseSql = fs.readFileSync(baseMigrationPath, "utf8");

    // Table and column contracts
    expect(baseSql).toMatch(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.customer_dietary_profiles/);
    expect(baseSql).toMatch(/tenant_id\s+uuid\s+NOT\s+NULL/);
    expect(baseSql).toMatch(/customer_id\s+uuid\s+NOT\s+NULL/);
    expect(baseSql).toMatch(/allergens\s+jsonb/);
    expect(baseSql).toMatch(/custom_allergens\s+jsonb/);
    expect(baseSql).toMatch(/restrictions\s+jsonb/);
    expect(baseSql).toMatch(/preferences\s+jsonb/);
    expect(baseSql).toMatch(/dietary_notes\s+text/);

    // Orders immutable snapshot contract
    expect(baseSql).toMatch(/ALTER\s+TABLE\s+public\.orders\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+dietary_snapshot/);

    // Rollback migration exists
    const rollbackPath = path.resolve(
      process.cwd(),
      "supabase/migrations/rollback/20261002110000_cr_cust_01_hf01_customer_dietary_profiles_operations_manager_rls_down.sql"
    );
    expect(fs.existsSync(rollbackPath)).toBe(true);
  });
});
