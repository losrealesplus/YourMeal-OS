import type { Session, User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Official role union — single source of truth with Postgres `app_role`. */
export type AppRole = Database["public"]["Enums"]["app_role"];

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

export const STAFF_ROLES: AppRole[] = [
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

export function deriveAuthFlags(roles: readonly AppRole[]) {
  const isSaasAdmin = roles.includes("saas_admin");
  const isStaff = roles.some((r) => STAFF_ROLES.includes(r));
  const isDriver = roles.includes("driver");
  const isCustomer =
    roles.includes("customer") || (!isSaasAdmin && !isStaff && !isDriver);
  return { isSaasAdmin, isStaff, isDriver, isCustomer };
}
