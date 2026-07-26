import type { AppRole } from "@/hooks/use-auth-types";

/**
 * Temporary development identities — no DB persistence.
 * Tenant id matches EatClean Tenerife seed (docs / OP-002 evidence).
 */
export const BOOTSTRAP_TENANT_ID = "7823e85a-986f-401f-9bbe-e4e431ff3be1";
export const BOOTSTRAP_TENANT_SLUG = "eatclean-tenerife";
export const BOOTSTRAP_TENANT_NAME = "EatClean Tenerife";
export const BOOTSTRAP_COMPANY_ID = "00000000-0000-4000-8000-00000000c001";

export type BootstrapProfileId =
  | "customer"
  | "kitchen"
  | "delivery"
  | "support"
  | "finance"
  | "company_admin"
  | "saas_admin";

export type BootstrapProfile = {
  id: BootstrapProfileId;
  /** Stable synthetic auth user id (UUID shape). */
  userId: string;
  email: string;
  displayName: string;
  label: string;
  roles: AppRole[];
  tenantId: string;
  companyId: string;
};

/**
 * Spec "Finance" maps to official `accounting` app_role
 * (no `finance` enum member exists).
 */
export const BOOTSTRAP_PROFILES: readonly BootstrapProfile[] = [
  {
    id: "customer",
    userId: "00000000-0000-4000-8000-000000000001",
    email: "bootstrap.customer@dev.local",
    displayName: "Bootstrap Customer",
    label: "Customer",
    roles: ["customer"],
    tenantId: BOOTSTRAP_TENANT_ID,
    companyId: BOOTSTRAP_COMPANY_ID,
  },
  {
    id: "kitchen",
    userId: "00000000-0000-4000-8000-000000000002",
    email: "bootstrap.kitchen@dev.local",
    displayName: "Bootstrap Kitchen",
    label: "Kitchen",
    roles: ["kitchen"],
    tenantId: BOOTSTRAP_TENANT_ID,
    companyId: BOOTSTRAP_COMPANY_ID,
  },
  {
    id: "delivery",
    userId: "00000000-0000-4000-8000-000000000003",
    email: "bootstrap.delivery@dev.local",
    displayName: "Bootstrap Delivery",
    label: "Delivery",
    roles: ["delivery"],
    tenantId: BOOTSTRAP_TENANT_ID,
    companyId: BOOTSTRAP_COMPANY_ID,
  },
  {
    id: "support",
    userId: "00000000-0000-4000-8000-000000000004",
    email: "bootstrap.support@dev.local",
    displayName: "Bootstrap Support",
    label: "Support",
    roles: ["support"],
    tenantId: BOOTSTRAP_TENANT_ID,
    companyId: BOOTSTRAP_COMPANY_ID,
  },
  {
    id: "finance",
    userId: "00000000-0000-4000-8000-000000000005",
    email: "bootstrap.finance@dev.local",
    displayName: "Bootstrap Finance",
    label: "Finance",
    roles: ["accounting"],
    tenantId: BOOTSTRAP_TENANT_ID,
    companyId: BOOTSTRAP_COMPANY_ID,
  },
  {
    id: "company_admin",
    userId: "00000000-0000-4000-8000-000000000006",
    email: "bootstrap.company-admin@dev.local",
    displayName: "Bootstrap Company Admin",
    label: "Company Admin",
    roles: ["company_admin"],
    tenantId: BOOTSTRAP_TENANT_ID,
    companyId: BOOTSTRAP_COMPANY_ID,
  },
  {
    id: "saas_admin",
    userId: "00000000-0000-4000-8000-000000000007",
    email: "bootstrap.saas-admin@dev.local",
    displayName: "Bootstrap SaaS Admin",
    label: "SaaS Admin",
    roles: ["company_admin", "saas_admin"],
    tenantId: BOOTSTRAP_TENANT_ID,
    companyId: BOOTSTRAP_COMPANY_ID,
  },
] as const;

export function getBootstrapProfile(
  id: BootstrapProfileId | string | null | undefined,
): BootstrapProfile | null {
  if (!id) return null;
  return BOOTSTRAP_PROFILES.find((p) => p.id === id) ?? null;
}

export function getBootstrapProfileByUserId(
  userId: string,
): BootstrapProfile | null {
  return BOOTSTRAP_PROFILES.find((p) => p.userId === userId) ?? null;
}
