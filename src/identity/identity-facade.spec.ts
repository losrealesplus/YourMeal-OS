import { afterEach, describe, expect, it } from "vitest";
import type { AuthState } from "@/hooks/use-auth-types";
import { composeIdentity } from "./composeIdentity";
import {
  getIdentityFacade,
  resetIdentityFacade,
} from "./IdentityFacade";
import {
  onIdentityLifecycle,
  resetIdentityLifecycleListeners,
} from "./IdentityEvents";
import {
  publishBootstrapIdentitySnapshot,
  resetBootstrapIdentitySnapshot,
} from "@/bootstrap/pipeline/BootstrapIdentityStore";

function auth(partial: Partial<AuthState> = {}): AuthState {
  return {
    session: null,
    user: null,
    loading: false,
    roles: [],
    profile: null,
    tenantId: null,
    tenant: null,
    isSaasAdmin: false,
    isStaff: false,
    isDriver: false,
    isCustomer: true,
    homePath: "/auth",
    ...partial,
  };
}

describe("IdentityFacade compose", () => {
  afterEach(() => {
    resetIdentityFacade();
    resetIdentityLifecycleListeners();
    resetBootstrapIdentitySnapshot();
  });

  it("exposes anonymous identity without session", () => {
    const result = composeIdentity({ auth: auth() });
    expect(result.context.state).toBe("anonymous");
    expect(result.context.sessionPresent).toBe(false);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "AUTH_REQUIRED")).toBe(true);
  });

  it("composes tenant, permissions, workspace for operational user", () => {
    const result = composeIdentity({
      auth: auth({
        user: { id: "u1" } as AuthState["user"],
        session: { user: { id: "u1" } } as AuthState["session"],
        roles: ["company_admin"],
        isStaff: true,
        isCustomer: false,
        profile: {
          id: "u1",
          fullName: "Alex",
          avatarUrl: null,
          locale: "es",
          phone: null,
        },
        tenantId: "t1",
        tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
        homePath: "/admin",
      }),
    });

    expect(result.ok).toBe(true);
    expect(result.context.state).toBe("operational_ready");
    expect(result.context.tenant?.id).toBe("t1");
    expect(result.context.workspace.surface).toBe("admin");
    expect(result.context.permissions.capabilities.length).toBeGreaterThan(0);
    expect(result.context.currentUser?.fullName).toBe("Alex");
    expect(result.context.locale.locale).toBe("es");
    expect(result.context.branding.tenantSlug).toBe("eatclean");
  });

  it("IdentityFacade view matches public API shape", () => {
    const facade = getIdentityFacade();
    const view = facade.compose(
      auth({
        user: { id: "u1" } as AuthState["user"],
        session: { user: { id: "u1" } } as AuthState["session"],
        roles: ["saas_admin"],
        isSaasAdmin: true,
        isCustomer: false,
        homePath: "/saas",
      }),
    );

    expect(view.session.present).toBe(true);
    expect(view.workspace.surface).toBe("saas");
    expect(view.permissions.roles).toContain("saas_admin");
    expect(view.isOperationalReady()).toBe(true);
  });

  it("emits identity lifecycle when state changes", () => {
    const names: string[] = [];
    onIdentityLifecycle((e) => names.push(e.name));
    const facade = getIdentityFacade();
    facade.compose(auth());
    facade.compose(
      auth({
        user: { id: "u1" } as AuthState["user"],
        session: { user: { id: "u1" } } as AuthState["session"],
        roles: ["customer"],
        tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
        tenantId: "t1",
        homePath: "/app",
      }),
    );
    expect(names).toContain("identity:anonymous");
    expect(names).toContain("identity:operational_ready");
  });

  it("reads bootstrap snapshot when AuthState roles empty", () => {
    publishBootstrapIdentitySnapshot({
      userId: "u1",
      roles: ["kitchen"],
      profile: null,
      tenant: { id: "t1", name: "EatClean", slug: "eatclean" },
      homePath: "/admin",
      status: "ready",
    });
    const result = composeIdentity({
      auth: auth({
        user: { id: "u1" } as AuthState["user"],
        session: { user: { id: "u1" } } as AuthState["session"],
        homePath: "/admin",
      }),
      snapshot: undefined,
    });
    // composeIdentity uses snapshot param; facade passes getBootstrapIdentitySnapshot
    const view = getIdentityFacade().compose(
      auth({
        user: { id: "u1" } as AuthState["user"],
        session: { user: { id: "u1" } } as AuthState["session"],
        homePath: "/admin",
      }),
    );
    expect(view.permissions.roles).toContain("kitchen");
    expect(view.tenant?.id).toBe("t1");
    expect(result.context.sessionPresent).toBe(true);
  });
});
