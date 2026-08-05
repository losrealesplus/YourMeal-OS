/**
 * Branding capability checks — BrandConfig presence (observe-only).
 * DEVELOPER-PLATFORM-004
 */

import { brandConfig } from "@/tenant/brand-config";
import type { DoctorCheck } from "../DoctorCheck";

export const brandingChecks: DoctorCheck[] = [
  {
    id: "branding.config-present",
    name: "BrandConfig present",
    capability: "branding",
    severity: "error",
    run: () => {
      if (!brandConfig?.slug || !brandConfig?.name) {
        return {
          status: "fail",
          message: "BrandConfig missing slug/name",
          recommendations: ["Verify tenants/<slug>/brand.json sync into brand-config"],
        };
      }
      return {
        status: "pass",
        message: `${brandConfig.name} (${brandConfig.slug})`,
        payload: {
          slug: brandConfig.slug,
          primaryColor: brandConfig.primaryColor,
        },
      };
    },
  },
  {
    id: "branding.logo-path",
    name: "Brand logo path declared",
    capability: "branding",
    severity: "warning",
    soft: true,
    run: () => {
      const logo = brandConfig.assets?.logo;
      if (!logo) {
        return {
          status: "warning",
          message: "BrandConfig.assets.logo missing",
          recommendations: ["Declare assets.logo in tenant brand resources"],
        };
      }
      return {
        status: "pass",
        message: `Logo path: ${logo}`,
        payload: {
          logo,
          splash: brandConfig.assets?.splash ?? null,
          hero: brandConfig.assets?.heroHome ?? null,
        },
      };
    },
  },
  {
    id: "branding.splash-hero",
    name: "Splash & hero declared",
    capability: "branding",
    severity: "warning",
    soft: true,
    run: () => {
      const splash = brandConfig.assets?.splash;
      const hero = brandConfig.assets?.heroHome;
      const missing = [
        !splash ? "splash" : null,
        !hero ? "heroHome" : null,
      ].filter(Boolean);
      if (missing.length) {
        return {
          status: "warning",
          message: `Missing assets: ${missing.join(", ")}`,
          recommendations: ["Complete splash/hero in BrandConfig.assets"],
          payload: { splash, hero },
        };
      }
      return {
        status: "pass",
        message: "Splash and hero paths declared",
        payload: { splash, hero },
      };
    },
  },
  {
    id: "branding.theme-tokens",
    name: "Theme tokens present",
    capability: "branding",
    severity: "warning",
    soft: true,
    run: () => {
      const required = ["primaryColor", "background", "foreground"] as const;
      const missing = required.filter(
        (k) => !(k in brandConfig) || !(brandConfig as Record<string, unknown>)[k],
      );
      if (missing.length) {
        return {
          status: "warning",
          message: `Missing theme tokens: ${missing.join(", ")}`,
          recommendations: ["Complete BrandConfig color tokens for WCAG surfaces"],
          payload: { missing },
        };
      }
      return {
        status: "pass",
        message: "Core theme tokens present",
      };
    },
  },
];
