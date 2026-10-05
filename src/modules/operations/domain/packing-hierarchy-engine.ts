import { operationalItemIdentity } from "@/modules/orders/domain/order-item-read-model";
/**
 * CR-OPS-07: Packing Hierarchy Engine (P2 Packing)
 * Pure transformation over NormalizedOperationalLine[] to produce
 * the 6-tier collapsible destination packing tree.
 */

import type {
  HistoricalResolutionStatus,
  NormalizedOperationalLine,
  OperationalTemporalMode,
  PackingCompanyNode,
  PackingCustomerOrderUnit,
  PackingDishSummaryItem,
  PackingMunicipalityCluster,
  PackingOrganizationalUnitNode,
  PackingSheetModel,
  PackingSiteNode,
  VersionMetadata,
} from "./operational-engine-types";

/**
 * Builds the hierarchical packing tree without loss of information.
 */
export function buildPackingHierarchySheet(params: {
  lines: NormalizedOperationalLine[];
  targetDate: string;
  temporalMode: OperationalTemporalMode;
  resolutionStatus: HistoricalResolutionStatus;
  versionMetadata: VersionMetadata;
}): PackingSheetModel {
  const { lines, targetDate, temporalMode, resolutionStatus, versionMetadata } = params;

  // 1. Group lines by Municipality
  const municipalityMap = new Map<string, NormalizedOperationalLine[]>();
  for (const line of lines) {
    const muni = line.municipality || "General";
    const group = municipalityMap.get(muni) || [];
    group.push(line);
    municipalityMap.set(muni, group);
  }

  const municipalities: PackingMunicipalityCluster[] = [];
  let b2bCompanyCount = 0;
  let b2bPortionsCount = 0;
  let b2cIndividualCount = 0;
  let b2cPortionsCount = 0;

  for (const [muniName, muniLines] of municipalityMap.entries()) {
    const b2cLines = muniLines.filter((l) => l.demandChannel === "individual");
    const b2bLines = muniLines.filter((l) => l.demandChannel === "company");

    // Process B2C Individuals
    const b2cIndividuals = buildCustomerOrderUnits(b2cLines);
    b2cIndividualCount += b2cIndividuals.length;
    b2cPortionsCount += b2cLines.length;

    // Process B2B Companies
    const b2bCompanies = buildCompanyHierarchy(b2bLines);
    b2bCompanyCount += b2bCompanies.length;
    b2bPortionsCount += b2bLines.length;

    const muniPortions = muniLines.length;
    const distinctMuniOrders = new Set(muniLines.map((l) => l.identity.orderId)).size;

    municipalities.push({
      municipality: muniName,
      totalPortions: muniPortions,
      totalOrders: distinctMuniOrders,
      b2cIndividuals,
      b2bCompanies,
    });
  }

  // Sort municipalities alphabetically
  municipalities.sort((a, b) => a.municipality.localeCompare(b.municipality));

  const grandTotalOrders = new Set(lines.map((l) => l.identity.orderId)).size;

  return {
    targetDate,
    temporalMode,
    resolutionStatus,
    versionMetadata,
    municipalities,
    totals: {
      municipalityCount: municipalities.length,
      b2bCompanyCount,
      b2bPortionsCount,
      b2cIndividualCount,
      b2cPortionsCount,
      grandTotalPortions: lines.length,
      grandTotalOrders,
    },
  };
}

/**
 * Groups lines belonging to a single level into individual customer order packing units.
 */
function buildCustomerOrderUnits(lines: NormalizedOperationalLine[]): PackingCustomerOrderUnit[] {
  const orderMap = new Map<string, NormalizedOperationalLine[]>();
  for (const line of lines) {
    const group = orderMap.get(line.identity.orderId) || [];
    group.push(line);
    orderMap.set(line.identity.orderId, group);
  }

  const units: PackingCustomerOrderUnit[] = [];

  for (const [orderId, orderLines] of orderMap.entries()) {
    const first = orderLines[0];
    const dishCountMap = new Map<string, PackingDishSummaryItem>();

    for (const l of orderLines) {
      const key = `${operationalItemIdentity(l.identity)}:${l.criticalSafetyAllergens.join("_")}:${l.modifications.join("_")}`;
      let safetyTag: string | null =
        l.identity.itemKind === "custom" ? "PERSONALIZADO · Alérgenos sin declarar" : null;
      if (l.criticalSafetyAllergens.length > 0) {
        safetyTag = `🔴 ${l.criticalSafetyAllergens.join(", ").toUpperCase()}`;
      } else if (l.modifications.length > 0) {
        safetyTag = `🟡 ${l.modifications.join(" · ")}`;
      }

      if (
        l.identity.itemKind === "custom" &&
        (l.modifications.length || l.criticalSafetyAllergens.length)
      )
        safetyTag += " · PERSONALIZADO · Alérgenos sin declarar";

      const existing = dishCountMap.get(key) || {
        dishId: l.identity.dishId,
        itemIdentity: operationalItemIdentity(l.identity),
        itemKind: l.identity.itemKind ?? "dish",
        allergenState: l.allergenSnapshotState,
        dishName: l.dishName,
        qty: 0,
        safetyTag,
      };
      if (existing.allergenState === "UNKNOWN" || l.allergenSnapshotState === "UNKNOWN")
        existing.allergenState = "UNKNOWN";
      else if (
        !existing.allergenState ||
        existing.allergenState === "HISTORICAL_UNAVAILABLE" ||
        !l.allergenSnapshotState ||
        l.allergenSnapshotState === "HISTORICAL_UNAVAILABLE"
      )
        existing.allergenState = "HISTORICAL_UNAVAILABLE";
      if (existing.itemKind !== "custom" && existing.allergenState !== "DECLARED") {
        const notice =
          existing.allergenState === "UNKNOWN"
            ? "Alérgenos sin declarar"
            : "Declaración histórica no disponible";
        if (!existing.safetyTag?.includes(notice))
          existing.safetyTag = existing.safetyTag ? `${existing.safetyTag} · ${notice}` : notice;
      }
      existing.qty += 1;
      dishCountMap.set(key, existing);
    }

    const items: PackingDishSummaryItem[] = Array.from(dishCountMap.values());
    const dietaryBadges: string[] = [
      ...first.customerAllergens.map((a) => `🔴 ${a}`),
      ...first.preferences.map((p) => `🔵 ${p}`),
    ];

    units.push({
      orderId,
      customerId: first.customerId,
      customerName: first.customerName,
      totalPortions: orderLines.length,
      items,
      specialInstructions: first.itemNotes,
      dietaryBadges,
    });
  }

  return units;
}

/**
 * Builds the nested B2B hierarchy: Company -> Site -> Unit -> Customers
 */
function buildCompanyHierarchy(lines: NormalizedOperationalLine[]): PackingCompanyNode[] {
  const companyMap = new Map<string, NormalizedOperationalLine[]>();
  for (const line of lines) {
    const compKey = line.companyId || line.companyName || "Empresa Sin Asignar";
    const group = companyMap.get(compKey) || [];
    group.push(line);
    companyMap.set(compKey, group);
  }

  const companies: PackingCompanyNode[] = [];

  for (const [compKey, compLines] of companyMap.entries()) {
    const first = compLines[0];
    const companyName = first.companyName || compKey;
    const companyId = first.companyId || compKey;

    // Group by Site
    const siteMap = new Map<string, NormalizedOperationalLine[]>();
    for (const l of compLines) {
      const siteKey = l.siteId || l.siteName || "Sede Principal";
      const group = siteMap.get(siteKey) || [];
      group.push(l);
      siteMap.set(siteKey, group);
    }

    const sites: PackingSiteNode[] = [];

    for (const [siteKey, siteLines] of siteMap.entries()) {
      const firstSiteLine = siteLines[0];
      const siteName = firstSiteLine.siteName || siteKey;
      const siteId = firstSiteLine.siteId || siteKey;
      const siteAddress = firstSiteLine.deliveryAddress.street;

      // Group by Unit/Department
      const unitMap = new Map<string, NormalizedOperationalLine[]>();
      for (const sl of siteLines) {
        const uKey = sl.organizationalUnitId || sl.organizationalUnitName || "General";
        const group = unitMap.get(uKey) || [];
        group.push(sl);
        unitMap.set(uKey, group);
      }

      const units: PackingOrganizationalUnitNode[] = [];

      for (const [uKey, uLines] of unitMap.entries()) {
        const firstUnitLine = uLines[0];
        const unitName = firstUnitLine.organizationalUnitName || uKey;
        const unitId = firstUnitLine.organizationalUnitId || uKey;

        const customers = buildCustomerOrderUnits(uLines);
        units.push({
          unitId,
          unitName,
          totalPortions: uLines.length,
          totalOrders: customers.length,
          customers,
        });
      }

      sites.push({
        siteId,
        siteName,
        siteAddress,
        totalPortions: siteLines.length,
        totalOrders: new Set(siteLines.map((l) => l.identity.orderId)).size,
        units,
      });
    }

    companies.push({
      companyId,
      companyName,
      totalPortions: compLines.length,
      totalOrders: new Set(compLines.map((l) => l.identity.orderId)).size,
      sites,
    });
  }

  return companies;
}
