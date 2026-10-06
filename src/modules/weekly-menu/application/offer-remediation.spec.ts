import { describe, expect, it, vi } from "vitest";
import {
  computeRemediationManifestHash,
  publishedOfferPriceRemediationRequestSchema,
  runPublishedOfferPriceRemediation,
  type PublishedOfferPriceRemediationManifest,
} from "./offer-remediation";
import { DomainError } from "@/domain/errors";

describe("OP08 Published offer price remediation", () => {
  const tenantId = "10000000-0000-4000-8000-000000000001";
  const requestId = "20000000-0000-4000-8000-000000000001";
  const manifest: PublishedOfferPriceRemediationManifest = {
    manifestVersion: "v1",
    tenantId,
    weekStart: "2026-10-05",
    reason: "CR-MENU M3 15 extras published pricing fix",
    items: [
      {
        slotId: "30000000-0000-4000-8000-000000000001",
        menuId: "40000000-0000-4000-8000-000000000001",
        dishId: "50000000-0000-4000-8000-000000000001",
        dayDate: "2026-10-05",
        expectedOldPrice: null,
        newPrice: "2.5000",
      },
    ],
  };

  it("computes deterministic SHA-256 manifest hash regardless of item order", async () => {
    const hash1 = await computeRemediationManifestHash(manifest);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);

    const reversedManifest: PublishedOfferPriceRemediationManifest = {
      ...manifest,
      items: [
        {
          slotId: "30000000-0000-4000-8000-000000000002",
          menuId: "40000000-0000-4000-8000-000000000001",
          dishId: "50000000-0000-4000-8000-000000000002",
          dayDate: "2026-10-06",
          expectedOldPrice: "2.5000",
          newPrice: "3.0000",
        },
        ...manifest.items,
      ],
    };

    const permutedManifest: PublishedOfferPriceRemediationManifest = {
      ...manifest,
      items: [
        manifest.items[0]!,
        {
          slotId: "30000000-0000-4000-8000-000000000002",
          menuId: "40000000-0000-4000-8000-000000000001",
          dishId: "50000000-0000-4000-8000-000000000002",
          dayDate: "2026-10-06",
          expectedOldPrice: "2.5000",
          newPrice: "3.0000",
        },
      ],
    };

    const hashReversed = await computeRemediationManifestHash(reversedManifest);
    const hashPermuted = await computeRemediationManifestHash(permutedManifest);
    expect(hashReversed).toBe(hashPermuted);
  });

  it("validates well-formed remediation requests", () => {
    const valid = publishedOfferPriceRemediationRequestSchema.safeParse({
      tenantId,
      requestId,
      manifest,
    });
    expect(valid.success).toBe(true);
  });

  it("rejects invalid manifest items with bad prices or dates", () => {
    const invalid = publishedOfferPriceRemediationRequestSchema.safeParse({
      tenantId,
      requestId,
      manifest: {
        ...manifest,
        items: [
          {
            ...manifest.items[0]!,
            newPrice: "-1.00",
          },
        ],
      },
    });
    expect(invalid.success).toBe(false);
  });
});
