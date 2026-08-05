/**
 * Permission Engine — architecture only (not enforced in v1.0).
 */

import type { RuntimePermissionLevel } from "./types";

const RANK: Record<RuntimePermissionLevel, number> = {
  PUBLIC: 0,
  ENGINEERING: 1,
  EXPERIMENTAL: 2,
  INTERNAL: 3,
};

/**
 * Whether a session level may access a module level.
 * Not wired to auth yet — pure predicate for future Permission Engine.
 */
export function canAccessModule(
  sessionLevel: RuntimePermissionLevel,
  moduleLevel: RuntimePermissionLevel,
): boolean {
  return RANK[sessionLevel] >= RANK[moduleLevel];
}

export const RUNTIME_PERMISSION_LEVELS: readonly RuntimePermissionLevel[] = [
  "PUBLIC",
  "ENGINEERING",
  "EXPERIMENTAL",
  "INTERNAL",
] as const;
