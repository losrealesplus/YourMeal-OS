import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { homePathForRoles } from "@/lib/home-path";
import { ensurePlatformOwnerSession } from "@/lib/ensure-platform-owner-session";

export type AppRole =
  | "saas_admin"
  | "company_admin"
  | "operations_manager"
  | "kitchen"
  | "purchasing"
  | "inventory"
  | "production"
  | "support"
  | "accounting"
  | "logistics"
  | "delivery"
  | "driver"
  | "employee"
  | "customer";

const STAFF_ROLES: AppRole[] = [
  "company_admin",
  "operations_manager",
  "kitchen",
  "purchasing",
  "inventory",
  "production",
  "support",
  "accounting",
  "logistics",
  "delivery",
];

export type UserProfile = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  locale: string;
  phone: string | null;
};

export type ActiveTenant = {
  id: string;
  name: string;
  slug: string | null;
};

export type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  roles: AppRole[];
  profile: UserProfile | null;
  tenantId: string | null;
  tenant: ActiveTenant | null;
  isSaasAdmin: boolean;
  isStaff: boolean;
  isDriver: boolean;
  isCustomer: boolean;
  homePath: string;
};

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<ActiveTenant | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const router = useRouter();

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
      // OP-002: ensure Platform Owner grants before reading RBAC state.
      // Errors for allowlisted owners are not swallowed — they surface in console
      // and leave roles empty until the session RPC succeeds.
      await ensurePlatformOwnerSession().catch((err: unknown) => {
        console.error(err);
      });
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

    // RBAC realtime — role grants/revocations propagate without page refresh.
    // Router.invalidate() forces beforeLoad guards to re-run against the
    // new role set, so a revoked role instantly loses route access.
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


  const isSaasAdmin = roles.includes("saas_admin");
  const isStaff = roles.some((r) => STAFF_ROLES.includes(r));
  const isDriver = roles.includes("driver");
  const isCustomer =
    roles.includes("customer") || (!isSaasAdmin && !isStaff && !isDriver);

  return {
    session,
    user: session?.user ?? null,
    loading,
    roles,
    profile,
    tenantId: tenant?.id ?? null,
    tenant,
    isSaasAdmin,
    isStaff,
    isDriver,
    isCustomer,
    homePath: homePathForRoles(roles),
  };
}
