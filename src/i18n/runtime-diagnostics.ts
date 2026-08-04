/**
 * ANDROID-QA · BUG-001 Runtime Diagnostics
 *
 * Observe-only sensors for Capacitor/Android. Does not change i18n behavior.
 * Output is prefixed `[YMOS-I18N]` for `adb logcat` filtering.
 */
import type { i18n as I18nInstance } from "i18next";

const FLAG = "__YMOS_I18N_RUNTIME_DIAG__";

declare global {
  interface Window {
    [FLAG]?: boolean;
  }
}

export function runI18nRuntimeDiagnostics(instance: I18nInstance): void {
  if (typeof window === "undefined") return;
  if (window[FLAG]) return;
  window[FLAG] = true;

  const storeData = instance.store?.data ?? {};
  const languages = Object.keys(storeData);
  const tree = languages.map((lng) => {
    const nsKeys = Object.keys(storeData[lng] ?? {});
    return `${lng}: [${nsKeys.join(", ")}]`;
  });

  const lines = [
    "[YMOS-I18N] ===== runtime diagnostic (once) =====",
    `[YMOS-I18N] language=${String(instance.language)}`,
    `[YMOS-I18N] resolvedLanguage=${String(instance.resolvedLanguage)}`,
    `[YMOS-I18N] defaultNS=${JSON.stringify(instance.options.defaultNS)}`,
    `[YMOS-I18N] ns=${JSON.stringify(instance.options.ns)}`,
    `[YMOS-I18N] store.languages=${JSON.stringify(languages)}`,
    `[YMOS-I18N] store.tree=${tree.join(" | ") || "(empty)"}`,
    `[YMOS-I18N] hasResourceBundle(es,auth)=${String(instance.hasResourceBundle("es", "auth"))}`,
    `[YMOS-I18N] hasResourceBundle(es,common)=${String(instance.hasResourceBundle("es", "common"))}`,
    `[YMOS-I18N] hasResourceBundle(en,auth)=${String(instance.hasResourceBundle("en", "auth"))}`,
    `[YMOS-I18N] hasResourceBundle(en,common)=${String(instance.hasResourceBundle("en", "common"))}`,
    `[YMOS-I18N] isInitialized=${String(instance.isInitialized)}`,
    `[YMOS-I18N] t(auth:welcome)=${JSON.stringify(instance.t("auth:welcome"))}`,
    `[YMOS-I18N] t(common:email)=${JSON.stringify(instance.t("common:email"))}`,
    `[YMOS-I18N] t(ops.nav.kitchen)=${JSON.stringify(instance.t("ops.nav.kitchen"))}`,
    "[YMOS-I18N] ===== end diagnostic =====",
  ];

  for (const line of lines) {
    console.log(line);
  }
}

/**
 * Run once after i18n reports initialized (or immediately if already ready).
 */
export function scheduleI18nRuntimeDiagnostics(instance: I18nInstance): void {
  if (typeof window === "undefined") return;

  const run = () => {
    try {
      runI18nRuntimeDiagnostics(instance);
    } catch (err) {
      console.log("[YMOS-I18N] diagnostic threw", err);
    }
  };

  if (instance.isInitialized) {
    // Defer one tick so WebView/logcat is ready.
    queueMicrotask(run);
    return;
  }

  instance.on("initialized", run);
}
