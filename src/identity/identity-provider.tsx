import type { ReactNode } from "react";
import { isBootstrapMode } from "@/bootstrap/flag";
import { BootstrapIdentityProvider } from "./bootstrap-identity-provider";
import { SupabaseIdentityProvider } from "./supabase-identity-provider";

/**
 * App
 *  └─ IdentityProvider
 *      ├─ SupabaseIdentityProvider   (default / production)
 *      └─ BootstrapIdentityProvider  (VITE_BOOTSTRAP_MODE=true only)
 *
 * Consumers always use useAuth() — no screen-level bootstrap branches.
 */
export function IdentityProvider({ children }: { children: ReactNode }) {
  if (isBootstrapMode()) {
    return <BootstrapIdentityProvider>{children}</BootstrapIdentityProvider>;
  }
  return <SupabaseIdentityProvider>{children}</SupabaseIdentityProvider>;
}
