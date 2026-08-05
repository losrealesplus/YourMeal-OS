/**
 * Doctor capability labels & Host ordering.
 * DEVELOPER-PLATFORM-004
 */

import type { DoctorCapabilityId } from "./DoctorCheck";

export const DOCTOR_CAPABILITY_ORDER: readonly DoctorCapabilityId[] = [
  "runtime",
  "assets",
  "branding",
  "android",
  "ios",
  "supabase",
  "network",
  "storage",
  "session",
  "performance",
  "security",
  "developer",
] as const;

export const DOCTOR_CAPABILITY_LABELS: Record<string, string> = {
  runtime: "Runtime",
  assets: "Assets",
  branding: "Branding",
  android: "Android",
  ios: "iOS",
  supabase: "Supabase",
  network: "Network",
  storage: "Storage",
  session: "Session",
  performance: "Performance",
  security: "Security",
  developer: "Developer",
};

export function doctorCapabilityLabel(id: string): string {
  return DOCTOR_CAPABILITY_LABELS[id] ?? id;
}
