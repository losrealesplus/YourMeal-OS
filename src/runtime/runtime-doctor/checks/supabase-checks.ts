/**
 * Supabase capability checks — env / client presence (no network by default).
 * DEVELOPER-PLATFORM-004
 */

import type { DoctorCheck } from "../DoctorCheck";

export const supabaseChecks: DoctorCheck[] = [
  {
    id: "supabase.env-url",
    name: "Supabase URL configured",
    capability: "supabase",
    severity: "error",
    run: () => {
      const url =
        (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL ??
        "";
      if (!url) {
        return {
          status: "fail",
          message: "VITE_SUPABASE_URL is empty",
          recommendations: [
            "Set VITE_SUPABASE_URL in the environment for this build",
          ],
        };
      }
      return {
        status: "pass",
        message: "VITE_SUPABASE_URL present",
        payload: { host: (() => {
          try {
            return new URL(url).host;
          } catch {
            return "(invalid-url)";
          }
        })() },
      };
    },
  },
  {
    id: "supabase.env-anon",
    name: "Supabase anon key configured",
    capability: "supabase",
    severity: "error",
    run: () => {
    const env = (import.meta as { env?: Record<string, string> }).env;

  const key =
  env?.VITE_SUPABASE_PUBLISHABLE_KEY ??
  env?.VITE_SUPABASE_ANON_KEY ??
  "";
      if (!key) {
        return {
          status: "fail",
          message: "Supabase publishable key is empty",
          recommendations: [
  "Set VITE_SUPABASE_PUBLISHABLE_KEY for client auth",
],
        };
      }
      return {
        status: "pass",
        message: `Publishable key present (${key.slice(0, 6)}...)`,
      };
    },
  },
  {
    id: "supabase.session-probe",
    name: "Session storage probe",
    capability: "supabase",
    severity: "info",
    soft: true,
    run: () => {
      if (typeof localStorage === "undefined") {
        return { status: "skip", message: "No localStorage" };
      }
      const keys = Object.keys(localStorage).filter(
        (k) => /supabase|sb-/i.test(k) || k.includes("auth-token"),
      );
      return {
        status: "info",
        message:
          keys.length > 0
            ? `Found ${keys.length} auth-related storage key(s)`
            : "No Supabase session keys in localStorage",
        payload: { keys: keys.slice(0, 8) },
      };
    },
  },
];
