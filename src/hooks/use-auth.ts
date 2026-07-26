/**
 * Public auth hook — consumes IdentityProvider context.
 * Do not branch on Bootstrap Mode in feature screens; identity origin is swapped
 * at the provider layer (EP-BOOTSTRAP-001).
 */
export type {
  ActiveTenant,
  AppRole,
  AuthState,
  UserProfile,
} from "./use-auth-types";
export { STAFF_ROLES } from "./use-auth-types";

export { useAuthContext as useAuth } from "@/identity/auth-context";
