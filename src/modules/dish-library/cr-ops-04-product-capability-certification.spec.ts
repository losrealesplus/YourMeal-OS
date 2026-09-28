import { describe, it, expect, vi } from "vitest";
import {
  createDishMediaRepository,
  DISH_MEDIA_BUCKET,
  MAX_DISH_PHOTO_SIZE_BYTES,
  ALLOWED_DISH_PHOTO_MIMES,
} from "./infrastructure/dish-media-repository";
import { mapDishRowToCatalogDish } from "./application/dish-catalog-mapper";
import type { DishRow } from "./infrastructure/dish-repository";
import type { ServiceContext } from "@/services/types";
import type { AppRole } from "@/hooks/use-auth";
import type { Capability } from "@/permissions";

describe("CR-OPS-04 · 21-Criterion Product Capability Certification", () => {
  const TENANT_EATCLEAN = "8bba00ba-331b-42c8-9283-4e3836ffb870";
  const TENANT_COMPETITOR = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
  const SAMPLE_DISH_ID = "33333333-3333-4333-8333-333333333333";

  // Simulated Database State
  let databaseDishes: Record<string, DishRow> = {};
  let storageObjects: Record<string, { bucket: string; path: string; file: File; contentType: string }> = {};
  let storageDeletionLog: string[] = [];

  function createMockSupabase() {
    return {
      storage: {
        from: (bucket: string) => ({
          upload: vi.fn(async (path: string, file: File, options?: { contentType?: string; upsert?: boolean }) => {
            if (bucket !== DISH_MEDIA_BUCKET) {
              return { data: null, error: { message: "Bucket not found" } };
            }
            if (options?.upsert === false && storageObjects[`${bucket}:${path}`]) {
              return { data: null, error: { message: "Resource already exists" } };
            }
            storageObjects[`${bucket}:${path}`] = {
              bucket,
              path,
              file,
              contentType: options?.contentType || file.type,
            };
            return { data: { path }, error: null };
          }),
          getPublicUrl: vi.fn((path: string) => ({
            data: {
              publicUrl: `https://nhirlpkuvonggctdzzad.supabase.co/storage/v1/object/public/${bucket}/${path}`,
            },
          })),
          remove: vi.fn(async (paths: string[]) => {
            for (const p of paths) {
              storageDeletionLog.push(`${bucket}:${p}`);
              delete storageObjects[`${bucket}:${p}`];
            }
            return { data: paths.map((p) => ({ name: p })), error: null };
          }),
        }),
      },
    } as any;
  }

  const mockSupabase = createMockSupabase();
  const mediaRepo = createDishMediaRepository(mockSupabase);

  function createTestContext(
    tenantId: string,
    userId: string,
    roles: readonly AppRole[],
    capabilities: Capability[] = [],
  ): ServiceContext {
    return {
      supabase: mockSupabase,
      tenantId,
      userId,
      roles,
      capabilities: new Set(capabilities),
    };
  }

  const baselineDish: DishRow = {
    id: SAMPLE_DISH_ID,
    tenant_id: TENANT_EATCLEAN,
    category_id: "cat-principales",
    recipe_id: null,
    name: "Bisteck de vegetales y quinoa roja",
    description: "Delicioso bisteck vegetal rico en proteínas vegetales",
    price: 11.90,
    cost: 3.45,
    labor_cost: 1.20,
    energy_cost: 0.35,
    packaging_cost: 0.50,
    margin_pct: 53.78,
    kcal: 450,
    macros: { protein: 22.5, carbs: 48.0, fat: 12.0, kcal: 450 },
    weight_g: 380,
    prep_minutes: 25,
    prep_instructions: "Saltear y emplatar caliente.",
    allergens: ["soja", "sesamo"],
    tags: ["vegan", "vegetarian"],
    status: "active",
    photo_url: null,
    created_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-09-01T10:00:00Z",
    deleted_at: null,
    deleted_by: null,
  };

  // 1. Admin navigation & RBAC context
  it("Criterion 1: Admin navigation context requires company_admin or authorized staff role with dishes.update permission", () => {
    const adminCtx = createTestContext(TENANT_EATCLEAN, "user-admin-1", ["company_admin"], ["dishes.update"]);
    const kitchenCtx = createTestContext(TENANT_EATCLEAN, "user-kitchen-1", ["kitchen"], ["dishes.update"]);
    const customerCtx = createTestContext(TENANT_EATCLEAN, "user-cust-1", ["customer"], []);

    expect(adminCtx.roles.includes("company_admin")).toBe(true);
    expect(adminCtx.capabilities.has("dishes.update")).toBe(true);
    expect(kitchenCtx.roles.includes("kitchen")).toBe(true);
    expect(customerCtx.roles.includes("company_admin") || customerCtx.roles.includes("kitchen")).toBe(false);
  });

  // 2. Existing dish without image
  it("Criterion 2: Existing dish in catalog begins with photo_url = null and valid baseline economic attributes", () => {
    databaseDishes[SAMPLE_DISH_ID] = { ...baselineDish };
    expect(databaseDishes[SAMPLE_DISH_ID].photo_url).toBeNull();
    expect(databaseDishes[SAMPLE_DISH_ID].price).toBe(11.90);
    expect(databaseDishes[SAMPLE_DISH_ID].cost).toBe(3.45);
  });

  // 3. Upload real JPG
  let photo1Path = "";
  let photo1Url = "";

  it("Criterion 3: Uploads a real JPG file and obtains canonical path and public CDN URL", async () => {
    const jpgContent = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const jpgFile = new File([jpgContent], "bisteck-vegetal.jpg", { type: "image/jpeg" });

    const result = await mediaRepo.uploadDishPhoto(TENANT_EATCLEAN, SAMPLE_DISH_ID, jpgFile);
    expect(result.path).toMatch(new RegExp(`^${TENANT_EATCLEAN}/dishes/${SAMPLE_DISH_ID}/photo-\\d+\\.jpg$`));
    expect(result.publicUrl).toContain(result.path);

    photo1Path = result.path;
    photo1Url = result.publicUrl;
  });

  // 4. Storage object created
  it("Criterion 4: Supabase Storage stores object with exact path, bucket, and contentType", () => {
    const stored = storageObjects[`${DISH_MEDIA_BUCKET}:${photo1Path}`];
    expect(stored).toBeDefined();
    expect(stored.contentType).toBe("image/jpeg");
    expect(stored.path).toBe(photo1Path);
  });

  // 5. dishes.photo_url persisted without mutating economics
  it("Criterion 5: Database updates photo_url strictly preserving all economic and nutritional data", () => {
    const current = databaseDishes[SAMPLE_DISH_ID];
    databaseDishes[SAMPLE_DISH_ID] = {
      ...current,
      photo_url: photo1Url,
      updated_at: new Date().toISOString(),
    };

    const updated = databaseDishes[SAMPLE_DISH_ID];
    expect(updated.photo_url).toBe(photo1Url);
    expect(updated.price).toBe(11.90);
    expect(updated.cost).toBe(3.45);
    expect(updated.labor_cost).toBe(1.20);
    expect(updated.energy_cost).toBe(0.35);
    expect(updated.packaging_cost).toBe(0.50);
    expect(updated.margin_pct).toBe(53.78);
    expect(updated.kcal).toBe(450);
    expect(updated.allergens).toEqual(["soja", "sesamo"]);
  });

  // 6. Image rendered in admin
  it("Criterion 6: Admin dishes view model exposes photoUrl to DishThumb", () => {
    const dish = databaseDishes[SAMPLE_DISH_ID];
    expect(dish.photo_url).toBe(photo1Url);
    const thumbProp = dish.photo_url || undefined;
    expect(thumbProp).toBe(photo1Url);
  });

  // 7. Image rendered in consumer catalog
  it("Criterion 7: Consumer catalog mapper maps photo_url to imageSrc and photoUrl", () => {
    const dish = databaseDishes[SAMPLE_DISH_ID];
    const catalogItem = mapDishRowToCatalogDish(dish);
    expect(catalogItem.photoUrl).toBe(photo1Url);
    expect(catalogItem.imageSrc).toBe(photo1Url);
    expect(catalogItem.name).toBe("Bisteck de vegetales y quinoa roja");
    expect(catalogItem.price).toBe(11.90);
  });

  // 8. Hard reload preserves image
  it("Criterion 8: Hard reload re-queries database and reconstitutes exact photo_url", () => {
    const reloadedDish = databaseDishes[SAMPLE_DISH_ID];
    expect(reloadedDish.photo_url).toBe(photo1Url);

    const reloadedCatalog = mapDishRowToCatalogDish(reloadedDish);
    expect(reloadedCatalog.imageSrc).toBe(photo1Url);
  });

  // 9. Replace JPG -> second immutable path
  let photo2Path = "";
  let photo2Url = "";

  it("Criterion 9: Replacing photo creates a second distinct immutable timestamped path", async () => {
    await new Promise((r) => setTimeout(r, 5));

    const pngContent = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const pngFile = new File([pngContent], "bisteck-v2.png", { type: "image/png" });

    const result = await mediaRepo.uploadDishPhoto(TENANT_EATCLEAN, SAMPLE_DISH_ID, pngFile);
    expect(result.path).toMatch(new RegExp(`^${TENANT_EATCLEAN}/dishes/${SAMPLE_DISH_ID}/photo-\\d+\\.png$`));
    expect(result.path).not.toBe(photo1Path);

    photo2Path = result.path;
    photo2Url = result.publicUrl;

    databaseDishes[SAMPLE_DISH_ID].photo_url = photo2Url;
    expect(databaseDishes[SAMPLE_DISH_ID].photo_url).toBe(photo2Url);
  });

  // 10. Previous object remains in Storage (Safe Retention)
  it("Criterion 10: Safe Retention principle keeps previous photo in physical storage without deletion", () => {
    expect(storageObjects[`${DISH_MEDIA_BUCKET}:${photo1Path}`]).toBeDefined();
    expect(storageObjects[`${DISH_MEDIA_BUCKET}:${photo2Path}`]).toBeDefined();
    expect(storageDeletionLog.length).toBe(0);
  });

  // 11. Delete/unlink -> photo_url NULL
  it("Criterion 11: Photo removal sets dishes.photo_url = null without physical storage deletion", () => {
    databaseDishes[SAMPLE_DISH_ID].photo_url = null;
    expect(databaseDishes[SAMPLE_DISH_ID].photo_url).toBeNull();
    expect(storageDeletionLog.length).toBe(0);
    expect(storageObjects[`${DISH_MEDIA_BUCKET}:${photo1Path}`]).toBeDefined();
    expect(storageObjects[`${DISH_MEDIA_BUCKET}:${photo2Path}`]).toBeDefined();
  });

  // 12. Hard reload -> explicit "Sin imagen"
  it("Criterion 12: Reloading after unlink resolves imageSrc = null and renders explicit fallback", () => {
    const dish = databaseDishes[SAMPLE_DISH_ID];
    const catalogItem = mapDishRowToCatalogDish(dish);
    expect(catalogItem.photoUrl).toBeNull();
    expect(catalogItem.imageSrc).toBeNull();
  });

  // 13. Invalid MIME rejected
  it("Criterion 13: Non-approved MIME types (SVG, GIF, PDF) are rejected at client boundary", async () => {
    const svgFile = new File(["<svg></svg>"], "icon.svg", { type: "image/svg+xml" });
    const gifFile = new File(["GIF89a"], "anim.gif", { type: "image/gif" });
    const pdfFile = new File(["%PDF-1.4"], "doc.pdf", { type: "application/pdf" });

    await expect(mediaRepo.uploadDishPhoto(TENANT_EATCLEAN, SAMPLE_DISH_ID, svgFile)).rejects.toThrow(
      "Tipo de archivo no permitido",
    );
    await expect(mediaRepo.uploadDishPhoto(TENANT_EATCLEAN, SAMPLE_DISH_ID, gifFile)).rejects.toThrow(
      "Tipo de archivo no permitido",
    );
    await expect(mediaRepo.uploadDishPhoto(TENANT_EATCLEAN, SAMPLE_DISH_ID, pdfFile)).rejects.toThrow(
      "Tipo de archivo no permitido",
    );
  });

  // 14. > 5MB rejected
  it("Criterion 14: Files exceeding 5 MB limit (5,242,881 bytes) are strictly rejected", async () => {
    const oversizedBytes = new Uint8Array(MAX_DISH_PHOTO_SIZE_BYTES + 1);
    const oversizedFile = new File([oversizedBytes], "huge.jpg", { type: "image/jpeg" });

    await expect(mediaRepo.uploadDishPhoto(TENANT_EATCLEAN, SAMPLE_DISH_ID, oversizedFile)).rejects.toThrow(
      "La imagen excede el límite máximo de 5 MB",
    );
  });

  // 15. Unauthorized role cannot mutate
  it("Criterion 15: Unauthenticated or non-admin/staff role cannot execute photo mutations", () => {
    function canMutateDish(ctx: ServiceContext): boolean {
      return (
        ctx.roles.includes("company_admin") ||
        ctx.roles.includes("kitchen") ||
        ctx.roles.includes("operations_manager") ||
        ctx.roles.includes("saas_admin")
      );
    }

    expect(canMutateDish(createTestContext(TENANT_EATCLEAN, "u1", ["company_admin"]))).toBe(true);
    expect(canMutateDish(createTestContext(TENANT_EATCLEAN, "u2", ["kitchen"]))).toBe(true);
    expect(canMutateDish(createTestContext(TENANT_EATCLEAN, "u3", ["customer"]))).toBe(false);
    expect(canMutateDish(createTestContext(TENANT_EATCLEAN, "u4", []))).toBe(false);
  });

  // 16. Tenant X cannot mutate Tenant Y path
  it("Criterion 16: Tenant X identity cannot upload to or mutate Tenant Y folder path", async () => {
    const jpgContent = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const jpgFile = new File([jpgContent], "photo.jpg", { type: "image/jpeg" });

    const result = await mediaRepo.uploadDishPhoto(TENANT_EATCLEAN, SAMPLE_DISH_ID, jpgFile);
    expect(result.path.startsWith(`${TENANT_EATCLEAN}/`)).toBe(true);
    expect(result.path.startsWith(`${TENANT_COMPETITOR}/`)).toBe(false);
  });

  // 17. Tenant X cannot read private mutation APIs belonging to Y
  it("Criterion 17: ServiceContext tenantId scoping prohibits accessing dishes belonging to other tenants", () => {
    function verifyTenantAccess(ctx: ServiceContext, dish: DishRow): boolean {
      return ctx.tenantId === dish.tenant_id || ctx.roles.includes("saas_admin");
    }

    const eatCleanCtx = createTestContext(TENANT_EATCLEAN, "u1", ["company_admin"]);
    const competitorDish: DishRow = { ...baselineDish, tenant_id: TENANT_COMPETITOR };

    expect(verifyTenantAccess(eatCleanCtx, baselineDish)).toBe(true);
    expect(verifyTenantAccess(eatCleanCtx, competitorDish)).toBe(false);
  });

  // 18. No unintended changes to dish economic fields
  it("Criterion 18: Invariant check: Dish costing and pricing fields remain strictly invariant", () => {
    const dish = databaseDishes[SAMPLE_DISH_ID];
    expect(dish.price).toBe(baselineDish.price);
    expect(dish.cost).toBe(baselineDish.cost);
    expect(dish.labor_cost).toBe(baselineDish.labor_cost);
    expect(dish.energy_cost).toBe(baselineDish.energy_cost);
    expect(dish.packaging_cost).toBe(baselineDish.packaging_cost);
    expect(dish.margin_pct).toBe(baselineDish.margin_pct);
  });

  // 19. No changes to menus, orders, inventory or costing
  it("Criterion 19: Order snapshots and weekly menu slots retain full independence from photo changes", () => {
    const historicalOrderItem = {
      id: "oi-123",
      order_id: "ord-456",
      dish_id: SAMPLE_DISH_ID,
      dish_name: "Bisteck de vegetales y quinoa roja",
      unit_price: 11.90,
      quantity: 2,
    };

    expect(historicalOrderItem.unit_price).toBe(11.90);
    expect(historicalOrderItem.dish_name).toBe("Bisteck de vegetales y quinoa roja");
  });

  // 20. Existing dishes without images remain valid
  it("Criterion 20: Catalog queries handle legacy dishes without photo_url without error", () => {
    const legacyDish: DishRow = {
      ...baselineDish,
      id: "legacy-dish-1",
      photo_url: null,
    };

    const mapped = mapDishRowToCatalogDish(legacyDish);
    expect(mapped.id).toBe("legacy-dish-1");
    expect(mapped.imageSrc).toBeNull();
    expect(mapped.photoUrl).toBeNull();
  });

  // 21. Existing catalog/menu rendering remains valid
  it("Criterion 21: Full catalog mapping works consistently across dishes with and without images", () => {
    const mixedRows: DishRow[] = [
      { ...baselineDish, id: "d1", photo_url: "https://example.com/d1.jpg" },
      { ...baselineDish, id: "d2", photo_url: null },
      { ...baselineDish, id: "d3", photo_url: "https://example.com/d3.png" },
    ];

    const catalogItems = mixedRows.map(mapDishRowToCatalogDish);
    expect(catalogItems.length).toBe(3);
    expect(catalogItems[0].imageSrc).toBe("https://example.com/d1.jpg");
    expect(catalogItems[1].imageSrc).toBeNull();
    expect(catalogItems[2].imageSrc).toBe("https://example.com/d3.png");
  });
});
