import type { AppRole } from "@/hooks/use-auth";

const STAFF_ROLES: AppRole[] = [
  "company_admin",
  "kitchen",
  "purchasing",
  "inventory",
  "production",
  "support",
  "accounting",
  "logistics",
];

/** Post-login home — one app; path depends on roles. */
export function homePathForRoles(roles: readonly AppRole[]): string {
  if (roles.includes("saas_admin")) return "/saas";
  if (roles.some((r) => STAFF_ROLES.includes(r))) return "/admin";
  if (roles.includes("driver")) return "/driver";
  return "/app";
}
