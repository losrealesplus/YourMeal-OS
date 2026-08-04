/**
 * YMOS Runtime Inspector — pure observation snapshot builder.
 */
import { Capacitor } from "@capacitor/core";
import type { i18n as I18nInstance } from "i18next";
import { getYmosRuntimeStatus } from "../ymos-runtime-status";
import { getYmosAssetAuditSnapshot } from "../ymos-runtime-assets";
import type { YmosAssetAuditSnapshot } from "../ymos-runtime-assets";

const EXPECTED_NS = ["common", "auth", "customer", "admin", "branding"] as const;

const SAMPLE_KEYS = [
  "auth:welcome",
  "common:email",
  "ops.nav.kitchen",
] as const;

export type YmosRuntimeDiagnostic = {
  tool: "YMOS Runtime Inspector";
  platform: string;
  build: { mobileSpa: boolean; capacitorNative: boolean };
  route: string;
  react: {
    mainStarted: boolean;
    rootImported: boolean;
    queryClient: boolean;
    localization: boolean;
    identity: boolean;
    bootstrap: boolean;
    outlet: boolean;
  };
  i18n: {
    isInitialized: boolean;
    language: string | undefined;
    resolvedLanguage: string | undefined;
    defaultNS: unknown;
    namespaces: unknown;
    storeLanguages: string[];
    bundles: Record<string, boolean>;
    translations: Record<string, string>;
  };
  branding: {
    logoLoaded: boolean | null;
    logoSrc: string | null;
  };
  supabase: {
    authenticated: boolean;
    loading: boolean;
    userId: string | null;
    email: string | null;
    tenantId: string | null;
    tenantName: string | null;
  };
  errors: {
    lastException: string | null;
    lastRedirect: string | null;
  };
  assets: YmosAssetAuditSnapshot;
  capturedAt: string;
};

function detectPlatform(): string {
  try {
    if (Capacitor.isNativePlatform()) {
      return Capacitor.getPlatform();
    }
  } catch {
    /* ignore */
  }
  return "web";
}

function isMobileSpaBuild(): boolean {
  try {
    // Heuristic: Capacitor injects bridge on native; SPA shell has no SSR document markers.
    return Capacitor.isNativePlatform() || Boolean((window as unknown as { Capacitor?: unknown }).Capacitor);
  } catch {
    return false;
  }
}

function probeLogo(): { logoLoaded: boolean | null; logoSrc: string | null } {
  if (typeof document === "undefined") {
    return { logoLoaded: null, logoSrc: null };
  }
  const imgs = Array.from(
    document.querySelectorAll<HTMLImageElement>("img[alt*='EatClean'], img[alt*='YourMeal'], img[src*='logo']"),
  );
  const img =
    imgs.find((el) => el.currentSrc || el.src) ??
    document.querySelector<HTMLImageElement>("img");
  if (!img) return { logoLoaded: null, logoSrc: null };
  const src = img.currentSrc || img.src || null;
  if (!src) return { logoLoaded: null, logoSrc: null };
  if (img.complete && img.naturalWidth > 0) {
    return { logoLoaded: true, logoSrc: src };
  }
  if (img.complete && img.naturalWidth === 0) {
    return { logoLoaded: false, logoSrc: src };
  }
  return { logoLoaded: null, logoSrc: src };
}

export type AuthObserveSlice = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  tenantId: string | null;
  tenantName: string | null;
  authenticated: boolean;
};

export function collectYmosRuntimeDiagnostic(input: {
  i18n: I18nInstance;
  route: string;
  auth: AuthObserveSlice;
}): YmosRuntimeDiagnostic {
  const status = getYmosRuntimeStatus();
  const lng = input.i18n.resolvedLanguage || input.i18n.language || "es";
  const storeLanguages = Object.keys(input.i18n.store?.data ?? {});

  const bundles: Record<string, boolean> = {};
  for (const ns of EXPECTED_NS) {
    bundles[`hasResourceBundle(${lng},${ns})`] = input.i18n.hasResourceBundle(
      lng,
      ns,
    );
    bundles[`hasResourceBundle(es,${ns})`] = input.i18n.hasResourceBundle(
      "es",
      ns,
    );
  }

  const translations: Record<string, string> = {};
  for (const key of SAMPLE_KEYS) {
    translations[key] = String(input.i18n.t(key));
  }

  const logo = probeLogo();

  return {
    tool: "YMOS Runtime Inspector",
    platform: detectPlatform(),
    build: {
      mobileSpa: isMobileSpaBuild(),
      capacitorNative: (() => {
        try {
          return Capacitor.isNativePlatform();
        } catch {
          return false;
        }
      })(),
    },
    route: input.route,
    react: {
      mainStarted: status.mainStarted,
      rootImported: status.rootImported,
      queryClient: Boolean(status.mounts.queryClient),
      localization: Boolean(status.mounts.localization),
      identity: Boolean(status.mounts.identity),
      bootstrap: Boolean(status.mounts.bootstrap),
      outlet: Boolean(status.mounts.outlet),
    },
    i18n: {
      isInitialized: Boolean(input.i18n.isInitialized),
      language: input.i18n.language,
      resolvedLanguage: input.i18n.resolvedLanguage,
      defaultNS: input.i18n.options.defaultNS,
      namespaces: input.i18n.options.ns,
      storeLanguages,
      bundles,
      translations,
    },
    branding: logo,
    supabase: {
      authenticated: input.auth.authenticated,
      loading: input.auth.loading,
      userId: input.auth.userId,
      email: input.auth.email,
      tenantId: input.auth.tenantId,
      tenantName: input.auth.tenantName,
    },
    errors: {
      lastException: status.lastException,
      lastRedirect: status.lastRedirect,
    },
    assets: getYmosAssetAuditSnapshot(),
    capturedAt: new Date().toISOString(),
  };
}
