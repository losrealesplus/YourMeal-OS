/**
 * Last Doctor report session cache (for module.export / health).
 * Split from register-doctor-module to avoid circular imports with DoctorPanel.
 */

let lastReportJson: string | null = null;

export function setLastDoctorReportJson(json: string | null): void {
  lastReportJson = json;
}

export function getLastDoctorReportJson(): string | null {
  return lastReportJson;
}

export function resetLastDoctorReportJson(): void {
  lastReportJson = null;
}
