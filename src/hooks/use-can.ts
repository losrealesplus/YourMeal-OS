import { useAuth } from "@/hooks/use-auth";
import { can, canAny, type Capability } from "@/permissions";

/** Capability check for UI gating — never hardcode role strings in components. */
export function useCan() {
  const { roles } = useAuth();
  return {
    can: (capability: Capability) => can(roles, capability),
    canAny: (caps: readonly Capability[]) => canAny(roles, caps),
    roles,
  };
}
