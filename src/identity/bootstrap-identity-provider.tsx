import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import {
  BOOTSTRAP_TENANT_NAME,
  BOOTSTRAP_TENANT_SLUG,
  type BootstrapProfile,
} from "@/bootstrap/profiles";
import {
  getActiveBootstrapProfile,
  getActiveBootstrapSession,
  subscribeBootstrapAuth,
} from "@/bootstrap/session-store";
import { homePathForRoles } from "@/lib/home-path";
import {
  deriveAuthFlags,
  type AuthState,
} from "@/hooks/use-auth-types";
import { AuthContext } from "./auth-context";

function authStateFromProfile(
  profile: BootstrapProfile | null,
  session: Session | null,
  loading: boolean,
): AuthState {
  const roles = profile ? [...profile.roles] : [];
  const flags = deriveAuthFlags(roles);
  return {
    session,
    user: session?.user ?? null,
    loading,
    roles,
    profile: profile
      ? {
          id: profile.userId,
          fullName: profile.displayName,
          avatarUrl: null,
          locale: "es",
          phone: null,
        }
      : null,
    tenantId: profile?.tenantId ?? null,
    tenant: profile
      ? {
          id: profile.tenantId,
          name: BOOTSTRAP_TENANT_NAME,
          slug: BOOTSTRAP_TENANT_SLUG,
        }
      : null,
    ...flags,
    homePath: homePathForRoles(roles),
  };
}

/** Dev-only identity — same AuthState shape as Supabase provider. */
export function BootstrapIdentityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BootstrapProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setProfile(getActiveBootstrapProfile());
    setSession(getActiveBootstrapSession());
    setLoading(false);

    return subscribeBootstrapAuth((_event, nextSession) => {
      setSession(nextSession);
      setProfile(getActiveBootstrapProfile());
      void router.invalidate();
    });
  }, [router]);

  const value = useMemo(
    () => authStateFromProfile(profile, session, loading),
    [profile, session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
