import { createContext, useContext } from "react";
import type { AuthState } from "@/hooks/use-auth-types";

export const AuthContext = createContext<AuthState | null>(null);

export function useAuthContext(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "useAuth must be used within IdentityProvider (EP-BOOTSTRAP-001 / Supabase auth)",
    );
  }
  return ctx;
}
