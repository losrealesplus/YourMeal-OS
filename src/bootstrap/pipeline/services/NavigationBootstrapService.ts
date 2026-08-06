/**
 * NavigationBootstrapService — home path from roles (LP-001).
 * Wraps existing homePathForRoles — does not rewrite landing policy.
 */

import { homePathForRoles } from "@/lib/home-path";
import type { AppRole } from "@/hooks/use-auth-types";

export function resolveBootstrapHomePath(roles: readonly AppRole[]): string {
  return homePathForRoles(roles);
}
