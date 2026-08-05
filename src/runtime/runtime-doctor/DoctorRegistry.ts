/**
 * Doctor Check Registry — Doctor does not know concrete checks.
 * DEVELOPER-PLATFORM-004
 */

import type { DoctorCheck } from "./DoctorCheck";
import { emitRuntimeCoreEvent } from "../runtime-core";

const checks = new Map<string, DoctorCheck>();

export function registerCheck(check: DoctorCheck): void {
  if (!check?.id) {
    throw new Error("DoctorRegistry: check.id is required");
  }
  if (!check.run) {
    throw new Error(`DoctorRegistry: check.run is required (${check.id})`);
  }
  checks.set(check.id, check);
  emitRuntimeCoreEvent("doctor-check-registered", { id: check.id });
}

export function unregisterCheck(id: string): void {
  checks.delete(id);
}

export function getChecks(): DoctorCheck[] {
  return [...checks.values()];
}

export function findCheck(id: string): DoctorCheck | undefined {
  return checks.get(id);
}

/** Test / HMR helper */
export function resetDoctorRegistry(): void {
  checks.clear();
}
