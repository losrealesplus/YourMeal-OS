/**
 * Register foundation Doctor checks (idempotent).
 * Future PRs add Network / Storage / Session / Performance as registerCheck only.
 * DEVELOPER-PLATFORM-004
 */

import { registerCheck } from "../DoctorRegistry";
import { androidChecks } from "./android-checks";
import { assetsChecks } from "./assets-checks";
import { brandingChecks } from "./branding-checks";
import { runtimeChecks } from "./runtime-checks";
import { supabaseChecks } from "./supabase-checks";

let installed = false;

export function registerBuiltinDoctorChecks(): void {
  if (installed) return;
  for (const check of [
    ...runtimeChecks,
    ...assetsChecks,
    ...brandingChecks,
    ...androidChecks,
    ...supabaseChecks,
  ]) {
    registerCheck(check);
  }
  installed = true;
}

/** Test helper */
export function resetBuiltinDoctorChecksFlag(): void {
  installed = false;
}

export const BUILTIN_DOCTOR_CHECK_IDS = [
  ...runtimeChecks,
  ...assetsChecks,
  ...brandingChecks,
  ...androidChecks,
  ...supabaseChecks,
].map((c) => c.id);
