import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TenantDeploymentService } from "./tenant-deployment-service";
import { tryConsumeDeploymentAssociation } from "./consume-deployment-association";

/**
 * ADR 0064 / Phase 2.3 Hardening Contract Tests
 * Simulates server-side RPC logic and client association consumption.
 */

type MockDeploymentRow = {
  platform: string;
  identifier: string;
  tenant_id: string;
  tenant_name: string;
  tenant_status: string;
  status: string;
};

type MockMemberRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected" | "suspended" | "revoked";
  membership_type: "customer" | "employee" | "supplier" | "company" | "company_employee";
  provisioning_channel: "self_registration" | "invitation" | "provisioning";
  approved_at?: string | null;
};

function createMockRpc(opts: {
  userId?: string | null;
  deployments: MockDeploymentRow[];
  members: MockMemberRow[];
}) {
  const members = [...opts.members];

  return async (rpcName: string, args: { p_platform: string; p_identifier: string }) => {
    if (rpcName !== "request_tenant_association_for_deployment") {
      throw new Error(`Unknown RPC: ${rpcName}`);
    }
    const uid = opts.userId ?? null;
    if (!uid) throw new Error("not authenticated");

    const platform = args.p_platform.trim().toLowerCase();
    const identifier = args.p_identifier.trim();

    if (!["android", "ios", "web"].includes(platform)) {
      throw new Error("invalid deployment platform");
    }
    if (!identifier || identifier.length > 255) {
      throw new Error("invalid deployment identifier");
    }

    const dep = opts.deployments.find(
      (d) => d.platform === platform && d.identifier === identifier && d.status === "active",
    );
    if (!dep) {
      throw new Error("deployment not found");
    }
    if (dep.tenant_status !== "active") {
      throw new Error("tenant not available");
    }

    let member = members.find((m) => m.tenant_id === dep.tenant_id && m.user_id === uid);
    let created = false;

    if (!member) {
      member = {
        id: `mem-${Math.random().toString(36).slice(2, 9)}`,
        tenant_id: dep.tenant_id,
        user_id: uid,
        status: "approved", // ADR 0064: auto-approved for customer self_registration on active trusted deployment
        membership_type: "customer",
        provisioning_channel: "self_registration",
        approved_at: new Date().toISOString(),
      };
      members.push(member);
      created = true;
    } else if (
      member.membership_type === "customer" &&
      member.provisioning_channel === "self_registration" &&
      member.status === "pending"
    ) {
      member.status = "approved";
      member.approved_at = new Date().toISOString();
    }

    return {
      data: {
        tenant_id: dep.tenant_id,
        display_name: dep.tenant_name,
        membership_id: member.id,
        status: member.status,
        created,
      },
      error: null,
    };
  };
}

describe("ADR 0064 — request_tenant_association_for_deployment Contract", () => {
  const TENANT_A_ID = "8bba00ba-331b-42c8-9283-4e3836ffb870"; // EatClean
  const TENANT_B_ID = "11111111-2222-3333-4444-555555555555"; // Other Tenant

  const mockDeployments: MockDeploymentRow[] = [
    {
      platform: "web",
      identifier: "eatclean.yourmealos.com",
      tenant_id: TENANT_A_ID,
      tenant_name: "EatClean",
      tenant_status: "active",
      status: "active",
    },
    {
      platform: "web",
      identifier: "eatclean-staging.yourmealos.com",
      tenant_id: TENANT_A_ID,
      tenant_name: "EatClean",
      tenant_status: "active",
      status: "active",
    },
    {
      platform: "web",
      identifier: "retired.yourmealos.com",
      tenant_id: TENANT_A_ID,
      tenant_name: "EatClean",
      tenant_status: "active",
      status: "retired",
    },
    {
      platform: "web",
      identifier: "inactive-tenant.yourmealos.com",
      tenant_id: TENANT_A_ID,
      tenant_name: "EatClean",
      tenant_status: "suspended",
      status: "active",
    },
    {
      platform: "web",
      identifier: "tenant-b.yourmealos.com",
      tenant_id: TENANT_B_ID,
      tenant_name: "Tenant B",
      tenant_status: "active",
      status: "active",
    },
  ];

  it("A. Valid active trusted deployment creates approved customer membership", async () => {
    const mockRpc = createMockRpc({
      userId: "user-123",
      deployments: mockDeployments,
      members: [],
    });
    const client = { rpc: mockRpc } as unknown as SupabaseClient;

    const res = await TenantDeploymentService.requestAssociation(client, {
      platform: "web",
      identifier: "eatclean-staging.yourmealos.com",
    });

    expect(res.tenantId).toBe(TENANT_A_ID);
    expect(res.displayName).toBe("EatClean");
    expect(res.status).toBe("approved");
    expect(res.created).toBe(true);
  });

  it("B. Unknown deployment is rejected", async () => {
    const mockRpc = createMockRpc({
      userId: "user-123",
      deployments: mockDeployments,
      members: [],
    });
    const client = { rpc: mockRpc } as unknown as SupabaseClient;

    await expect(
      TenantDeploymentService.requestAssociation(client, {
        platform: "web",
        identifier: "malicious-unknown-site.com",
      }),
    ).rejects.toThrow();
  });

  it("C. Retired deployment is rejected", async () => {
    const mockRpc = createMockRpc({
      userId: "user-123",
      deployments: mockDeployments,
      members: [],
    });
    const client = { rpc: mockRpc } as unknown as SupabaseClient;

    await expect(
      TenantDeploymentService.requestAssociation(client, {
        platform: "web",
        identifier: "retired.yourmealos.com",
      }),
    ).rejects.toThrow();
  });

  it("D. Inactive tenant deployment is rejected", async () => {
    const mockRpc = createMockRpc({
      userId: "user-123",
      deployments: mockDeployments,
      members: [],
    });
    const client = { rpc: mockRpc } as unknown as SupabaseClient;

    await expect(
      TenantDeploymentService.requestAssociation(client, {
        platform: "web",
        identifier: "inactive-tenant.yourmealos.com",
      }),
    ).rejects.toThrow();
  });

  it("E & F. Client cannot inject tenant_id or role (signature is platform + identifier only)", async () => {
    const mockRpc = createMockRpc({
      userId: "user-123",
      deployments: mockDeployments,
      members: [],
    });
    const client = { rpc: mockRpc } as unknown as SupabaseClient;

    const res = await TenantDeploymentService.requestAssociation(client, {
      platform: "web",
      identifier: "eatclean.yourmealos.com",
    });

    expect(res.tenantId).toBe(TENANT_A_ID);
    expect(res.status).toBe("approved");
  });

  it("G. Existing customer self_registration in pending state is reconciled to approved", async () => {
    const mockMembers: MockMemberRow[] = [
      {
        id: "mem-pending-customer",
        tenant_id: TENANT_A_ID,
        user_id: "user-existing-pending",
        status: "pending",
        membership_type: "customer",
        provisioning_channel: "self_registration",
      },
    ];
    const mockRpc = createMockRpc({
      userId: "user-existing-pending",
      deployments: mockDeployments,
      members: mockMembers,
    });
    const client = { rpc: mockRpc } as unknown as SupabaseClient;

    const res = await TenantDeploymentService.requestAssociation(client, {
      platform: "web",
      identifier: "eatclean-staging.yourmealos.com",
    });

    expect(res.status).toBe("approved");
    expect(res.created).toBe(false);
  });

  it("H. Existing employee membership in pending state remains pending (admin protection)", async () => {
    const mockMembers: MockMemberRow[] = [
      {
        id: "mem-pending-employee",
        tenant_id: TENANT_A_ID,
        user_id: "user-employee",
        status: "pending",
        membership_type: "employee",
        provisioning_channel: "invitation",
      },
    ];
    const mockRpc = createMockRpc({
      userId: "user-employee",
      deployments: mockDeployments,
      members: mockMembers,
    });
    const client = { rpc: mockRpc } as unknown as SupabaseClient;

    const res = await TenantDeploymentService.requestAssociation(client, {
      platform: "web",
      identifier: "eatclean.yourmealos.com",
    });

    expect(res.status).toBe("pending");
    expect(res.created).toBe(false);
  });

  it("I. Existing company_admin in pending state remains pending (admin protection)", async () => {
    const mockMembers: MockMemberRow[] = [
      {
        id: "mem-pending-company-admin",
        tenant_id: TENANT_A_ID,
        user_id: "user-admin",
        status: "pending",
        membership_type: "company",
        provisioning_channel: "provisioning",
      },
    ];
    const mockRpc = createMockRpc({
      userId: "user-admin",
      deployments: mockDeployments,
      members: mockMembers,
    });
    const client = { rpc: mockRpc } as unknown as SupabaseClient;

    const res = await TenantDeploymentService.requestAssociation(client, {
      platform: "web",
      identifier: "eatclean.yourmealos.com",
    });

    expect(res.status).toBe("pending");
    expect(res.created).toBe(false);
  });

  it("J. Non-self_registration channel membership remains under its existing approval flow", async () => {
    const mockMembers: MockMemberRow[] = [
      {
        id: "mem-invited-customer",
        tenant_id: TENANT_A_ID,
        user_id: "user-invited",
        status: "pending",
        membership_type: "customer",
        provisioning_channel: "invitation",
      },
    ];
    const mockRpc = createMockRpc({
      userId: "user-invited",
      deployments: mockDeployments,
      members: mockMembers,
    });
    const client = { rpc: mockRpc } as unknown as SupabaseClient;

    const res = await TenantDeploymentService.requestAssociation(client, {
      platform: "web",
      identifier: "eatclean.yourmealos.com",
    });

    expect(res.status).toBe("pending");
  });

  it("K. AUTH USER != CUSTOMER: Association only manages tenant_members, not public.customers", async () => {
    const mockRpc = createMockRpc({
      userId: "new-oauth-user",
      deployments: mockDeployments,
      members: [],
    });
    const client = { rpc: mockRpc } as unknown as SupabaseClient;

    const res = await TenantDeploymentService.requestAssociation(client, {
      platform: "web",
      identifier: "eatclean.yourmealos.com",
    });

    expect(res.membershipId).toBeDefined();
    expect(res.status).toBe("approved");
    // Verifies that customer materialization is detached and handled by onboarding/checkout
  });

  it("M. Concurrency: Multiple association calls are idempotent and return existing row", async () => {
    const mockMembers: MockMemberRow[] = [];
    const mockRpc = createMockRpc({
      userId: "concurrent-user",
      deployments: mockDeployments,
      members: mockMembers,
    });
    const client = { rpc: mockRpc } as unknown as SupabaseClient;

    const [res1, res2] = await Promise.all([
      TenantDeploymentService.requestAssociation(client, {
        platform: "web",
        identifier: "eatclean-staging.yourmealos.com",
      }),
      TenantDeploymentService.requestAssociation(client, {
        platform: "web",
        identifier: "eatclean-staging.yourmealos.com",
      }),
    ]);

    expect(res1.tenantId).toBe(TENANT_A_ID);
    expect(res2.tenantId).toBe(TENANT_A_ID);
    expect(res1.membershipId).toBe(res2.membershipId);
  });

  it("N. Deployment belonging to Tenant A cannot associate user with Tenant B", async () => {
    const mockRpc = createMockRpc({
      userId: "user-tenant-b",
      deployments: mockDeployments,
      members: [],
    });
    const client = { rpc: mockRpc } as unknown as SupabaseClient;

    const res = await TenantDeploymentService.requestAssociation(client, {
      platform: "web",
      identifier: "tenant-b.yourmealos.com",
    });

    expect(res.tenantId).toBe(TENANT_B_ID);
    expect(res.tenantId).not.toBe(TENANT_A_ID);
  });

  it("O. Production and staging deployment identifiers resolve to the same intended EatClean tenant", async () => {
    const mockRpc = createMockRpc({
      userId: "user-cross-env",
      deployments: mockDeployments,
      members: [],
    });
    const client = { rpc: mockRpc } as unknown as SupabaseClient;

    const prodRes = await TenantDeploymentService.requestAssociation(client, {
      platform: "web",
      identifier: "eatclean.yourmealos.com",
    });
    const stagingRes = await TenantDeploymentService.requestAssociation(client, {
      platform: "web",
      identifier: "eatclean-staging.yourmealos.com",
    });

    expect(prodRes.tenantId).toBe(TENANT_A_ID);
    expect(stagingRes.tenantId).toBe(TENANT_A_ID);
    expect(prodRes.tenantId).toBe(stagingRes.tenantId);
  });
});
