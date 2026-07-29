import { useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { can, canAny, type Capability } from "@/permissions";

/**
 * Capability check for UI gating — never hardcode role strings in components.
 *
 * `can` / `canAny` identities are stable across renders while `roles` is unchanged.
 * Unstable `can` in effect deps caused FCR-002 (Ops Home render loop / flicker).
 */
export function useCan() {
  const { roles } = useAuth();

  const canFn = useCallback(
    (capability: Capability) => can(roles, capability),
    [roles],
  );

  const canAnyFn = useCallback(
    (caps: readonly Capability[]) => canAny(roles, caps),
    [roles],
  );

  return useMemo(
    () => ({
      can: canFn,
      canAny: canAnyFn,
      roles,
    }),
    [canFn, canAnyFn, roles],
  );
}
