import { describe, it, expect } from "vitest";
import { evaluateDeliveryCoverage, normalizePostalCode } from "./geo-coverage";
import type { MarketDeliveryCoverage } from "./types";

describe("GeoCoverage (CR-COST-05 Block 2)", () => {
  const sampleCoverages: MarketDeliveryCoverage[] = [
    {
      id: "cov-tf",
      sourceId: "src-makro",
      establishmentId: "est-adeje",
      ownerTenantId: null,
      fulfillmentMode: "delivery",
      coverageStatus: "documented_available",
      countryCode: "ES",
      regionCode: "ES_TENERIFE_TF",
      islandCode: "TF",
      postalCodePrefix: "386",
      createdAt: "2026-11-12T00:00:00Z",
      updatedAt: "2026-11-12T00:00:00Z",
    },
    {
      id: "cov-gc-pickup",
      sourceId: "src-gmcash",
      establishmentId: "est-telde",
      ownerTenantId: null,
      fulfillmentMode: "pickup_only",
      coverageStatus: "documented_available",
      countryCode: "ES",
      regionCode: "ES_GRAN_CANARIA_GC",
      islandCode: "GC",
      createdAt: "2026-11-12T00:00:00Z",
      updatedAt: "2026-11-12T00:00:00Z",
    },
    {
      id: "cov-pt",
      sourceId: "src-makro",
      establishmentId: null,
      ownerTenantId: null,
      fulfillmentMode: "delivery",
      coverageStatus: "documented_available",
      countryCode: "PT",
      subdivisionCode: "PT-11",
      createdAt: "2026-11-12T00:00:00Z",
      updatedAt: "2026-11-12T00:00:00Z",
    },
  ];

  it("preserves postal codes as text with leading zeros", () => {
    expect(normalizePostalCode("08001")).toBe("08001");
    expect(normalizePostalCode("38001")).toBe("38001");
    expect(() => normalizePostalCode(8001)).toThrow("as text");
  });

  it("never infers Canarias delivery from a Mainland Peninsula observation when coverage is undocumented", () => {
    const res = evaluateDeliveryCoverage({
      sourceId: "src-mercadona",
      observationRegionCode: "ES_PENINSULA_MAINLAND",
      coverages: sampleCoverages,
      target: {
        countryCode: "ES",
        regionCode: "ES_TENERIFE_TF",
        islandCode: "TF",
        postalCode: "38670",
      },
    });

    expect(res.state).toBe("unknown");
    expect(res.isDeliverable).toBe(false);
    expect(res.reason).toContain("does not imply destination availability");
  });

  it("matches postal prefix & island coverage when documented for the establishment", () => {
    const res = evaluateDeliveryCoverage({
      sourceId: "src-makro",
      establishmentId: "est-adeje",
      coverages: sampleCoverages,
      target: {
        countryCode: "ES",
        regionCode: "ES_TENERIFE_TF",
        islandCode: "TF",
        postalCode: "38670",
      },
    });

    expect(res.state).toBe("delivery_available");
    expect(res.isDeliverable).toBe(true);
    expect(res.matchedCoverageId).toBe("cov-tf");
  });

  it("distinguishes pickup_only from delivery and remains open to non-Spain markets", () => {
    const pickupDenied = evaluateDeliveryCoverage({
      sourceId: "src-gmcash",
      establishmentId: "est-telde",
      coverages: sampleCoverages,
      target: {
        countryCode: "ES",
        regionCode: "ES_GRAN_CANARIA_GC",
        islandCode: "GC",
        allowPickup: false,
      },
    });
    expect(pickupDenied.state).toBe("pickup_only");
    expect(pickupDenied.isDeliverable).toBe(false);

    const pickupAllowed = evaluateDeliveryCoverage({
      sourceId: "src-gmcash",
      establishmentId: "est-telde",
      coverages: sampleCoverages,
      target: {
        countryCode: "ES",
        regionCode: "ES_GRAN_CANARIA_GC",
        islandCode: "GC",
        allowPickup: true,
      },
    });
    expect(pickupAllowed.state).toBe("pickup_only");
    expect(pickupAllowed.isDeliverable).toBe(true);

    const portugal = evaluateDeliveryCoverage({
      sourceId: "src-makro",
      coverages: sampleCoverages,
      target: {
        countryCode: "PT",
        subdivisionCode: "PT-11",
      },
    });
    expect(portugal.state).toBe("delivery_available");
    expect(portugal.matchedCoverageId).toBe("cov-pt");
  });
});
