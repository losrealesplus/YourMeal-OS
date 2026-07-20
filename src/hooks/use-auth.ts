import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "saas_admin"
  | "company_admin"
  | "kitchen"
  | "purchasing"
  | "inventory"
  | "production"
  | "support"
  | "accounting"
  | "logistics"
  | "driver"
  | "employee"
  | "customer";

const STAFF_ROLES: AppRole[] = [
  "company_admin",
  "kitchen",
  "purchasing",
  "inventory",
  "production",
  "support",
  "accounting",
  "logistics",
];

export type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  roles: AppRole[];
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

  useEffect(() => {
    if (!session?.user) {
      setRoles([]);
      return;
    }
    let cancelled = false;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .then(({ data }) => {
        if (cancelled) return;
        setRoles((data ?? []).map((r) => r.role as AppRole));
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const isSaasAdmin = roles.includes("saas_admin");
  const isStaff = roles.some((r) => STAFF_ROLES.includes(r));
  const isDriver = roles.includes("driver");
  const isCustomer =
    roles.includes("customer") || (!isSaasAdmin && !isStaff && !isDriver);

  const homePath = isSaasAdmin
    ? "/saas"
    : isStaff
      ? "/admin"
      : isDriver
        ? "/driver"
        : "/app";

  return {
    session,
    user: session?.user ?? null,
    loading,
    roles,
    isSaasAdmin,
    isStaff,
    isDriver,
    isCustomer,
    homePath,
  };
}
