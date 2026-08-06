import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { onAuthStateChange } from "@/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  clearBootstrapIdentitySnapshot,
  getBootstrapIdentitySnapshot,
  subscribeBootstrapIdentitySnapshot,
  type BootstrapIdentitySnapshot,
} from "@/bootstrap/pipeline/BootstrapIdentityStore";
import { runOwnedIdentityStages } from "@/bootstrap/pipeline/runOwnedIdentityStages";
import { homePathForRoles } from "@/lib/home-path";
import {
  deriveAuthFlags,
  type ActiveTenant,
  type AppRole,
  type AuthState,
  type UserProfile,
} from "@/hooks/use-auth-types";
import { AuthContext } from "./auth-context";

function applySnapshot(
  snap: BootstrapIdentitySnapshot,
  setters: {
    setRoles: (r: AppRole[]) => void;
    setProfile: (p: UserProfile | null) => void;
    setTenant: (t: ActiveTenant | null) => void;
    setHomePath: (h: string | null) => void;
  },
) {
  setters.setRoles(snap.roles);
  setters.setProfile(snap.profile);
  setters.setTenant(snap.tenant);
  setters.setHomePath(snap.homePath);
}

/**
 * Production identity Provider — PRODUCT-CORE-003 observer.
 *
 * Owns: session subscription, context exposure, realtime role refresh, render.
 * Does NOT own: startup load of roles/profile/tenant (SessionStage / TenantStage).
 */
export function SupabaseIdentityProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<ActiveTenant | null>(null);
  const [homePath, setHomePath] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    return subscribeBootstrapIdentitySnapshot((snap) => {
      if (snap.status === "cleared" || snap.status === "idle") {
        setRoles([]);
        setProfile(null);
        setTenant(null);
        setHomePath(null);
        return;
      }
      applySnapshot(snap, { setRoles, setProfile, setTenant, setHomePath });
    });
  }, []);

  useEffect(() => {
    const { data: sub } = onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
      // FCR-008: do NOT call getSession() here — INITIAL_SESSION / SIGNED_IN
      // deliver the session. Identity ladder ownership → Stages.
      if (!s?.user) {
        clearBootstrapIdentitySnapshot();
        return;
      }
      const current = getBootstrapIdentitySnapshot();
      if (
        current.status === "ready" &&
        current.userId === s.user.id &&
        current.updatedAt > Date.now() - 5_000
      ) {
        applySnapshot(current, { setRoles, setProfile, setTenant, setHomePath });
        return;
      }
      void runOwnedIdentityStages({ userId: s.user.id, mode: "cold" });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Realtime RBAC — react to role changes (not startup orchestration).
  useEffect(() => {
    if (!session?.user) return;
    const uid = session.user.id;
    let cancelled = false;

    async function refreshRoles() {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      if (cancelled) return;
      setRoles((data ?? []).map((r) => r.role as AppRole));
      void router.invalidate();
    }

    const channel = supabase
      .channel(`rbac:${uid}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
          filter: `user_id=eq.${uid}`,
        },
        () => {
          void refreshRoles();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [session?.user?.id, router]);

  const value = useMemo<AuthState>(() => {
    const flags = deriveAuthFlags(roles);
    return {
      session,
      user: session?.user ?? null,
      loading,
      roles,
      profile,
      tenantId: tenant?.id ?? null,
      tenant,
      ...flags,
      homePath: homePath ?? homePathForRoles(roles),
    };
  }, [session, loading, roles, profile, tenant, homePath]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
