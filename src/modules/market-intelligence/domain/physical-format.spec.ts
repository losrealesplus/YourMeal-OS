import { describe, it, expect } from "vitest";
import {
  convertWithinDimension,
  convertVolumeToMassWithDensity,
  parseGtin,
  resolvePhysicalPack,
  verifyGs1CheckDigit,
} from "./physical-format";

describe("PhysicalFormat (CR-COST-05 Block 2)", () => {
  describe("GTIN / EAN text preservation and check digits", () => {
    it("preserves leading zeros as text for EAN-13, UPC-12, EAN-8, and GTIN-14", () => {
      const ean13 = parseGtin("0041234567890");
      expect(ean13.isValidFormat).toBe(true);
      expect(ean13.gtin).toBe("0041234567890");
      expect(ean13.gtinType).toBe("EAN13");

      const ean8 = parseGtin("01234565");
      expect(ean8.isValidFormat).toBe(true);
      expect(ean8.gtin).toBe("01234565");
      expect(ean8.gtinType).toBe("EAN8");
      expect(ean8.checksumValid).toBe(true);
    });

    it("rejects numeric input or malformed lengths", () => {
      expect(parseGtin(4006381333931).isValidFormat).toBe(false);
      expect(parseGtin("12345").isValidFormat).toBe(false);
      expect(parseGtin("8412345678905").checksumValid).toBe(true);
      expect(verifyGs1CheckDigit("8412345678900")).toBe(false);
    });
  });

  describe("Pack resolution & anti-double-multiplication", () => {
    it("computes pack total once for 6 x 1 L when observedPriceBasis is per_pack", () => {
      const resolved = resolvePhysicalPack({
        packCount: 6,
        unitContentQty: 1,
        unitContentUnit: "l",
        observedPriceBasis: "per_pack",
      });

      expect(resolved.standardQuantity).toBe(6);
      expect(resolved.standardUnit).toBe("l");
      expect(resolved.normalizedUnit).toBe("EUR_PER_L");
      expect(resolved.measurementDimension).toBe("volume");
    });

    it("uses single inner unit when observedPriceBasis is per_inner_unit", () => {
      const resolved = resolvePhysicalPack({
        packCount: 6,
        unitContentQty: 250,
        unitContentUnit: "ml",
        netContentQty: 1500,
        netContentUnit: "ml",
        observedPriceBasis: "per_inner_unit",
      });

      expect(resolved.standardQuantity).toBe(0.25);
      expect(resolved.standardUnit).toBe("l");
    });

    it("uses precomputed netContent directly without multiplying by packCount again", () => {
      const resolved = resolvePhysicalPack({
        packCount: 6,
        netContentQty: 6,
        netContentUnit: "l",
        observedPriceBasis: "per_pack",
      });

      expect(resolved.standardQuantity).toBe(6);
    });

    it("rejects contradictory packCount * unitContent vs netContent", () => {
      expect(() =>
        resolvePhysicalPack({
          packCount: 6,
          unitContentQty: 1,
          unitContentUnit: "l",
          netContentQty: 8,
          netContentUnit: "l",
          observedPriceBasis: "per_pack",
        }),
      ).toThrow("Pack consistency mismatch");
    });
  });

  describe("Dimension separation & density boundary", () => {
    it("allows conversion strictly within the same dimension", () => {
      expect(convertWithinDimension(750, "ml", "l")).toBe(0.75);
      expect(convertWithinDimension(2500, "g", "kg")).toBe(2.5);
    });

    it("rejects converting liters to kg without documented density", () => {
      expect(() => convertWithinDimension(5, "l", "kg")).toThrow("without documented density");
      expect(() => convertVolumeToMassWithDensity(5, "l", null)).toThrow("never assume 1.0");
    });

    it("converts volume to mass ONLY when explicit densityKgPerL is provided", () => {
      const massKg = convertVolumeToMassWithDensity(5, "l", 0.916); // olive oil ~0.916 kg/L
      expect(massKg).toBe(4.58);

      const packMass = resolvePhysicalPack({
        netContentQty: 5,
        netContentUnit: "l",
        densityKgPerL: 0.916,
        targetDimension: "mass",
      });
      expect(packMass.standardQuantity).toBe(4.58);
      expect(packMass.standardUnit).toBe("kg");
      expect(packMass.normalizedUnit).toBe("EUR_PER_KG");
    });
  });
});
