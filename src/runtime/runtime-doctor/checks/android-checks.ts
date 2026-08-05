/**
 * Android / Capacitor capability checks (info-level foundation).
 * No APK / Gradle deep probes here — those stay in CLI doctor for now.
 * DEVELOPER-PLATFORM-004
 */

import type { DoctorCheck } from "../DoctorCheck";

export const androidChecks: DoctorCheck[] = [
  {
    id: "android.platform-probe",
    name: "Capacitor platform probe",
    capability: "android",
    severity: "info",
    soft: true,
    supports: ["web", "android", "ios"],
    run: (ctx) => {
      let capPlatform = "unavailable";
      try {
        const Cap = (
          globalThis as {
            Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean };
          }
        ).Capacitor;
        capPlatform = Cap?.getPlatform?.() ?? "web";
        const native = Cap?.isNativePlatform?.() ?? false;
        if (ctx.platform === "android" || capPlatform === "android") {
          return {
            status: "pass",
            message: `Running on Android (Capacitor=${capPlatform})`,
            payload: { capPlatform, native, doctorPlatform: ctx.platform },
          };
        }
        return {
          status: "info",
          message: `Not on Android (platform=${ctx.platform}, Capacitor=${capPlatform})`,
          payload: { capPlatform, native, doctorPlatform: ctx.platform },
          recommendations: native
            ? undefined
            : ["Deep Android SDK/Gradle checks remain on CLI: npm run doctor"],
        };
      } catch (err) {
        return {
          status: "warning",
          message: "Capacitor probe failed",
          payload: { error: String(err) },
        };
      }
    },
  },
  {
    id: "android.user-agent-hint",
    name: "User-Agent Android hint",
    capability: "android",
    severity: "info",
    soft: true,
    run: () => {
      if (typeof navigator === "undefined") {
        return { status: "skip", message: "No navigator (SSR)" };
      }
      const ua = navigator.userAgent;
      const android = /Android/i.test(ua);
      return {
        status: android ? "pass" : "info",
        message: android ? "UA indicates Android" : "UA does not indicate Android",
        payload: { ua: ua.slice(0, 120) },
      };
    },
  },
];
