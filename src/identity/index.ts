/**
 * Identity package — React IdentityProvider (observer) + IdentityFacade (API).
 *
 * OPERATIONAL-001: Modules consume IdentityFacade / useIdentity.
 * Bootstrap owns loading. Existing AuthState / useAuth remain for legacy screens.
 */

export { IdentityProvider } from "./identity-provider";
export { AuthContext, useAuthContext } from "./auth-context";

export type {
  IdentityContext,
  IdentityState,
  PermissionModel,
  WorkspaceContext,
  BrandingContext,
  LocaleContext,
  FeatureFlagSnapshot,
  UserPreferencesSnapshot,
  MembershipContext,
  OperationalContext,
} from "./IdentityContext";

export type {
  IdentityResult,
  IdentityError,
  IdentityErrorCode,
} from "./IdentityResult";

export { composeIdentity } from "./composeIdentity";
export type { ComposeIdentityInput } from "./composeIdentity";

export {
  IdentityFacade,
  getIdentityFacade,
  resetIdentityFacade,
  type IdentityFacadeView,
} from "./IdentityFacade";

export { useIdentity } from "./useIdentity";

export {
  onIdentityLifecycle,
  emitIdentityLifecycle,
  resetIdentityLifecycleListeners,
  type IdentityLifecycleEvent,
  type IdentityLifecycleEventName,
} from "./IdentityEvents";
