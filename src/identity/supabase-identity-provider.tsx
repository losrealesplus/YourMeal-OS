import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { getSession, onAuthStateChange } from "@/auth";
import { supabase } from "@/integrations/supabase/client";
import { homePathForRoles } from "@/lib/home-path";
import { tryEnsurePlatformOwnerSession } from "@/lib/ensure-platform-owner-session";
import {
  deriveAuthFlags,
  type ActiveTenant,
  type AppRole,
  type AuthState,
  type UserProfile,
} from "@/hooks/use-auth-types";
import { AuthContext } from "./auth-context";

/** Production identity — unchanged Supabase Auth + RBAC load. */
export function SupabaseIdentityProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<ActiveTenant | null>(null);
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = onAuthStateChange((_e, s) => {
      setSession(s);
    });
    getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setRoles([]);
      setProfile(null);
      setTenant(null);
      return;
    }
    let cancelled = false;
    const uid = session.user.id;

    async function loadRoles() {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      if (cancelled) return;
      setRoles((data ?? []).map((r) => r.role as AppRole));
    }

    void (async () => {
      await tryEnsurePlatformOwnerSession();
      if (cancelled) return;

      const [rolesRes, profileRes, memberRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url, locale, phone")
          .eq("id", uid)
          .maybeSingle(),
        supabase
          .from("tenant_members")
          .select("tenant_id, tenants:tenant_id(id, name, slug)")
          .eq("user_id", uid)
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;

      setRoles((rolesRes.data ?? []).map((r) => r.role as AppRole));

      const p = profileRes.data;
      setProfile(
        p
          ? {
              id: p.id,
              fullName: p.full_name,
              avatarUrl: p.avatar_url,
              locale: p.locale,
              phone: p.phone,
            }
          : null,
      );

      const t = (memberRes.data as { tenants?: ActiveTenant | null } | null)
        ?.tenants;
      setTenant(t ? { id: t.id, name: t.name, slug: t.slug ?? null } : null);
    })();

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
          void loadRoles().then(() => {
            void router.invalidate();
          });
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
      homePath: homePathForRoles(roles),
    };
  }, [session, loading, roles, profile, tenant]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
