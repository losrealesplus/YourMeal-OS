/**
 * useIdentity — React entry for Operational Modules (ADR 0055 Phase 2).
 *
 * Composes existing IdentityProvider AuthState — does not load identity.
 * Prefer this over useAuth() for new operational module code.
 */

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getBootstrapIdentitySnapshot } from "@/bootstrap/pipeline/BootstrapIdentityStore";
import {
  getIdentityFacade,
  type IdentityFacadeView,
} from "./IdentityFacade";

/**
 * Canonical operational identity hook.
 * Modules: identity.tenant / identity.permissions / identity.workspace …
 */
export function useIdentity(): IdentityFacadeView {
  const auth = useAuth();
  return useMemo(() => {
    return getIdentityFacade().compose(auth, getBootstrapIdentitySnapshot());
  }, [auth]);
}
