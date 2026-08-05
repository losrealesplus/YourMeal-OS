/**
 * Assets capability checks — observe-only against asset audit ledger.
 * Does not modify ANDROID-ASSETS engines.
 * DEVELOPER-PLATFORM-004
 */

import { getYmosAssetAuditSnapshot } from "../../ymos-runtime-assets";
import type { DoctorCheck } from "../DoctorCheck";

function short(url: string, n = 64): string {
  return url.length <= n ? url : `${url.slice(0, n)}…`;
}

export const assetsChecks: DoctorCheck[] = [
  {
    id: "assets.ledger-available",
    name: "Asset ledger available",
    capability: "assets",
    severity: "warning",
    soft: true,
    run: () => {
      try {
        const snap = getYmosAssetAuditSnapshot();
        return {
          status: "pass",
          message: `Ledger entries: ${snap.entries.length}`,
          payload: {
            counts: snap.counts,
            env: {
              baseUrl: snap.env.baseUrl,
              baseURI: snap.env.baseURI,
            },
          },
        };
      } catch (err) {
        return {
          status: "fail",
          message: "Asset audit snapshot unavailable",
          payload: { error: String(err) },
          recommendations: [
            "Confirm installYmosAssetResolutionAudit() ran at boot",
          ],
        };
      }
    },
  },
  {
    id: "assets.no-l5e",
    name: "No __l5e placeholder URLs (live errors)",
    capability: "assets",
    severity: "error",
    run: () => {
      const snap = getYmosAssetAuditSnapshot();
      const l5e = snap.entries.filter(
        (e) =>
          e.status === "error" &&
          (e.url.includes("/__l5e/") || (e.error ?? "").includes("__l5e")),
      );
      if (l5e.length > 0) {
        return {
          status: "fail",
          message: `${l5e.length} __l5e-related asset error(s)`,
          payload: { samples: l5e.slice(0, 5).map((e) => short(e.url)) },
          recommendations: [
            "Open Assets / Consistency modules for lifecycle classification",
            "Verify Vite base + Capacitor server paths for Android",
          ],
        };
      }
      return {
        status: "pass",
        message: "No __l5e errors in asset ledger",
      };
    },
  },
  {
    id: "assets.logo-observed",
    name: "Logo asset observed",
    capability: "assets",
    severity: "warning",
    soft: true,
    run: () => {
      const snap = getYmosAssetAuditSnapshot();
      const logo = snap.entries.find(
        (e) =>
          /logo|brand|leaf/i.test(e.url) ||
          (e.kind === "image" && /logo/i.test(e.url)),
      );
      if (!logo) {
        return {
          status: "info",
          message: "No logo-like URL observed yet in ledger",
          payload: { tip: "Navigate a branded surface then re-run Doctor" },
          recommendations: [
            "Open customer shell so logo loads, then Run Doctor again",
          ],
        };
      }
      if (logo.status === "error") {
        return {
          status: "fail",
          message: `Logo-like asset failed: ${short(logo.url)}`,
          payload: { id: logo.id, error: logo.error },
          recommendations: ["Inspect Assets module for resolution env"],
        };
      }
      return {
        status: "pass",
        message: `Logo-like asset: ${logo.status}`,
        payload: { url: short(logo.url), status: logo.status },
      };
    },
  },
];
