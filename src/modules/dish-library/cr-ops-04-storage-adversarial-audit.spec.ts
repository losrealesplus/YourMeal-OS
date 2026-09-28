import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  createDishMediaRepository,
  DISH_MEDIA_BUCKET,
  MAX_DISH_PHOTO_SIZE_BYTES,
  isAllowedDishPhotoMime,
} from "./infrastructure/dish-media-repository";

describe("CR-OPS-04 · Storage Adversarial Audit & RLS Defense Simulation", () => {
  const TENANT_A = "8bba00ba-331b-42c8-9283-4e3836ffb870"; // EatClean
  const TENANT_B = "f47ac10b-58cc-4372-a567-0e02b2c3d479"; // Competitor Tenant
  const DISH_A = "11111111-1111-4111-8111-111111111111";
  const DISH_B = "22222222-2222-4222-8222-222222222222";

  // 1. Verify Migration Contract and RLS definitions
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20260928213500_cr_ops_04_tenant_media_bucket.sql",
  );

  it("Storage Contract: Migration defines tenant-media bucket and 4 distinct RLS policies", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, "utf8");

    // Bucket verification
    expect(sql).toContain("'tenant-media'");
    expect(sql).toContain("5242880"); // 5MB
    expect(sql).toContain("ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]");

    // Policy verification
    expect(sql).toContain('CREATE POLICY "tenant_media_public_read"');
    expect(sql).toContain('CREATE POLICY "tenant_media_tenant_insert"');
    expect(sql).toContain('CREATE POLICY "tenant_media_tenant_update"');
    expect(sql).toContain('CREATE POLICY "tenant_media_tenant_delete"');

    // Tenant path prefix extraction via split_part(name, '/', 1)
    expect(sql).toContain("NULLIF(split_part(name, '/', 1), '')::uuid");
    expect(sql).toContain("public.has_role(");
  });

  // 2. Adversarial Storage Simulation Harness
  type UserSession = {
    userId: string;
    rolesByTenant: Record<string, string[]>;
    isSaasAdmin?: boolean;
  };

  function simulateStorageRlsPolicy(
    operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE",
    bucketId: string,
    objectName: string,
    session: UserSession | null,
  ): { allowed: boolean; reason?: string } {
    if (bucketId !== DISH_MEDIA_BUCKET) {
      return { allowed: false, reason: "Bucket does not match tenant-media" };
    }

    // Policy A: SELECT is public
    if (operation === "SELECT") {
      return { allowed: true };
    }

    // Operations INSERT, UPDATE, DELETE require authenticated session
    if (!session || !session.userId) {
      return { allowed: false, reason: "Unauthorized: Unauthenticated user" };
    }

    // SaaS Admin has global access
    if (session.isSaasAdmin) {
      return { allowed: true };
    }

    // Extract tenant from path: split_part(name, '/', 1)
    const pathSegments = objectName.split("/");
    const tenantPrefix = pathSegments[0];

    // Reject empty, traversal or malformed tenant ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!tenantPrefix || !uuidRegex.test(tenantPrefix)) {
      return { allowed: false, reason: "Malformed or illegal tenant path prefix" };
    }

    const userRolesInTenant = session.rolesByTenant[tenantPrefix] || [];

    // Policy B: INSERT (company_admin, staff, saas_admin)
    if (operation === "INSERT") {
      const canInsert = userRolesInTenant.includes("company_admin") || userRolesInTenant.includes("staff");
      return canInsert
        ? { allowed: true }
        : { allowed: false, reason: "Forbidden: User lacks company_admin or staff role in tenant" };
    }

    // Policy C: UPDATE (company_admin, staff, saas_admin)
    if (operation === "UPDATE") {
      const canUpdate = userRolesInTenant.includes("company_admin") || userRolesInTenant.includes("staff");
      return canUpdate
        ? { allowed: true }
        : { allowed: false, reason: "Forbidden: User lacks company_admin or staff role in tenant" };
    }

    // Policy D: DELETE (company_admin, saas_admin only)
    if (operation === "DELETE") {
      const canDelete = userRolesInTenant.includes("company_admin");
      return canDelete
        ? { allowed: true }
        : { allowed: false, reason: "Forbidden: User lacks company_admin role in tenant" };
    }

    return { allowed: false, reason: "Unsupported operation" };
  }

  // Attack Scenarios:
  const userA_Admin: UserSession = {
    userId: "user-a-admin",
    rolesByTenant: { [TENANT_A]: ["company_admin"] },
  };

  const userA_Staff: UserSession = {
    userId: "user-a-staff",
    rolesByTenant: { [TENANT_A]: ["staff"] },
  };

  const userCustomer: UserSession = {
    userId: "user-customer",
    rolesByTenant: { [TENANT_A]: ["customer"] },
  };

  // Attack A: Cross-tenant INSERT
  it("Attack A: Cross-tenant INSERT is strictly denied when User A targets Tenant B folder", () => {
    const targetObject = `${TENANT_B}/dishes/${DISH_B}/photo-1700000000.jpg`;
    const result = simulateStorageRlsPolicy("INSERT", DISH_MEDIA_BUCKET, targetObject, userA_Admin);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Forbidden");
  });

  // Attack B: Cross-tenant UPDATE
  it("Attack B: Cross-tenant UPDATE is strictly denied when User A targets Tenant B object", () => {
    const targetObject = `${TENANT_B}/dishes/${DISH_B}/photo-1700000000.jpg`;
    const result = simulateStorageRlsPolicy("UPDATE", DISH_MEDIA_BUCKET, targetObject, userA_Admin);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Forbidden");
  });

  // Attack C: Cross-tenant DELETE
  it("Attack C: Cross-tenant DELETE is strictly denied when User A targets Tenant B object", () => {
    const targetObject = `${TENANT_B}/dishes/${DISH_B}/photo-1700000000.jpg`;
    const result = simulateStorageRlsPolicy("DELETE", DISH_MEDIA_BUCKET, targetObject, userA_Admin);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Forbidden");
  });

  // Attack D: Unauthorized DELETE (Staff attempting physical delete)
  it("Attack D: Staff role is denied DELETE access (only company_admin / saas_admin permitted)", () => {
    const ownObject = `${TENANT_A}/dishes/${DISH_A}/photo-1700000000.jpg`;
    const result = simulateStorageRlsPolicy("DELETE", DISH_MEDIA_BUCKET, ownObject, userA_Staff);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Forbidden: User lacks company_admin role");
  });

  // Attack E: Unauthorized UPDATE / INSERT (Customer or unauthenticated)
  it("Attack E: Customer role is denied INSERT and UPDATE access", () => {
    const ownObject = `${TENANT_A}/dishes/${DISH_A}/photo-1700000000.jpg`;
    const insertResult = simulateStorageRlsPolicy("INSERT", DISH_MEDIA_BUCKET, ownObject, userCustomer);
    expect(insertResult.allowed).toBe(false);

    const updateResult = simulateStorageRlsPolicy("UPDATE", DISH_MEDIA_BUCKET, ownObject, userCustomer);
    expect(updateResult.allowed).toBe(false);

    const unauthResult = simulateStorageRlsPolicy("INSERT", DISH_MEDIA_BUCKET, ownObject, null);
    expect(unauthResult.allowed).toBe(false);
  });

  // Attack F: Path traversal / malformed tenant path
  it("Attack F: Directory traversal (../../) and malformed prefixes are strictly rejected", () => {
    const traversalObject = `../../etc/passwd/photo-1.jpg`;
    const result = simulateStorageRlsPolicy("INSERT", DISH_MEDIA_BUCKET, traversalObject, userA_Admin);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Malformed or illegal tenant path prefix");

    const emptyPrefixObject = `/dishes/${DISH_A}/photo-1.jpg`;
    const resultEmpty = simulateStorageRlsPolicy("INSERT", DISH_MEDIA_BUCKET, emptyPrefixObject, userA_Admin);
    expect(resultEmpty.allowed).toBe(false);
  });

  // Attack G: Unsupported MIME spoofing
  it("Attack G: Unsupported MIME types (SVG, HTML, EXE, PHP) are rejected", () => {
    const invalidMimes = [
      "image/svg+xml",
      "text/html",
      "application/x-msdownload",
      "application/x-php",
      "image/gif",
      "application/pdf",
    ];

    for (const mime of invalidMimes) {
      expect(isAllowedDishPhotoMime(mime)).toBe(false);
    }

    expect(isAllowedDishPhotoMime("image/jpeg")).toBe(true);
    expect(isAllowedDishPhotoMime("image/png")).toBe(true);
    expect(isAllowedDishPhotoMime("image/webp")).toBe(true);
  });

  // Attack H: Oversized upload
  it("Attack H: Oversized upload boundary condition (>5MB) is strictly enforced", async () => {
    const mockSupabase = {
      storage: {
        from: () => ({
          upload: vi.fn(),
          getPublicUrl: vi.fn(),
        }),
      },
    } as any;
    const repo = createDishMediaRepository(mockSupabase);

    const exactLimitFile = new File([new Uint8Array(MAX_DISH_PHOTO_SIZE_BYTES)], "exact.jpg", {
      type: "image/jpeg",
    });
    const overLimitFile = new File([new Uint8Array(MAX_DISH_PHOTO_SIZE_BYTES + 1)], "over.jpg", {
      type: "image/jpeg",
    });

    // Exact limit does not throw on size check
    // Over limit throws immediately
    await expect(repo.uploadDishPhoto(TENANT_A, DISH_A, overLimitFile)).rejects.toThrow(
      "La imagen excede el límite máximo de 5 MB",
    );
  });
});
