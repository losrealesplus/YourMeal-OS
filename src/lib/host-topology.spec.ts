import { describe, it, expect } from "vitest";
import { resolveHostTopology, getClientPortalUrl, getTenantAppUrl } from "./host-topology";
import {
  getPublicClientsDirectory,
  getPublicClientBySlug,
  CLIENT_REGISTRY,
} from "./public-clients-registry";

describe("Block 1: Host Topology & Public Client Registry Micro-Hardening", () => {
  it("A. www.yourmealos.com resolves to public_marketing", () => {
    const topo = resolveHostTopology("www.yourmealos.com");
    expect(topo.hostType).toBe("public_marketing");
    expect(topo.tenantSlug).toBeNull();
  });

  it("B. yourmealos.com (apex domain) resolves to public_marketing", () => {
    const topo = resolveHostTopology("yourmealos.com");
    expect(topo.hostType).toBe("public_marketing");
    expect(topo.tenantSlug).toBeNull();
  });

  it("C. clientes.yourmealos.com resolves to client_portal", () => {
    const topo = resolveHostTopology("clientes.yourmealos.com");
    expect(topo.hostType).toBe("client_portal");
    expect(topo.tenantSlug).toBeNull();
  });

  it("D. eatclean.yourmealos.com resolves to tenant 'eatclean'", () => {
    const topo = resolveHostTopology("eatclean.yourmealos.com");
    expect(topo.hostType).toBe("tenant");
    expect(topo.tenantSlug).toBe("eatclean");
  });

  it("E. Future tenant (e.g. singular.yourmealos.com) resolves to tenant 'singular'", () => {
    const topo = resolveHostTopology("singular.yourmealos.com");
    expect(topo.hostType).toBe("tenant");
    expect(topo.tenantSlug).toBe("singular");
  });

  it("F. Unknown host or preview domain safely falls back to public_marketing", () => {
    const topo1 = resolveHostTopology("preview-123.pages.dev");
    expect(topo1.hostType).toBe("public_marketing");

    const topo2 = resolveHostTopology("localhost");
    expect(topo2.hostType).toBe("public_marketing");
  });

  it("G. Public registry filters strictly by isPublicDirectory === true", () => {
    const publicList = getPublicClientsDirectory();
    expect(publicList.length).toBeGreaterThan(0);
    expect(publicList.every((c) => c.isPublicDirectory === true)).toBe(true);
  });

  it("H. Non-public tenant is strictly invisible in the public directory", () => {
    const allRegistered = CLIENT_REGISTRY;
    const privateTenant = allRegistered.find((c) => c.isPublicDirectory === false);
    expect(privateTenant).toBeDefined();

    const publicList = getPublicClientsDirectory();
    expect(publicList.find((c) => c.slug === privateTenant?.slug)).toBeUndefined();

    const resolvedBySlug = getPublicClientBySlug(privateTenant?.slug || "");
    expect(resolvedBySlug).toBeNull();
  });

  it("I. EatClean is correctly listed with its canonical public metadata", () => {
    const eatclean = getPublicClientBySlug("eatclean");
    expect(eatclean).not.toBeNull();
    expect(eatclean?.publicName).toBe("EatClean");
    expect(eatclean?.appUrl).toBe("https://eatclean.yourmealos.com");
    expect(eatclean?.isPublicDirectory).toBe(true);
  });

  it("J. Language Audit: Public registry descriptions contain clean operational Spanish", () => {
    const forbidden = [
      "Zero Friction",
      "Prototype",
      "Experimental",
      "TTO",
      "TTE",
      "A1",
      "A2",
      "A3",
      "A4",
    ];
    const publicList = getPublicClientsDirectory();

    for (const client of publicList) {
      for (const term of forbidden) {
        expect(client.description.includes(term)).toBe(false);
        expect(client.publicName.includes(term)).toBe(false);
        expect(client.category.includes(term)).toBe(false);
      }
    }
  });

  it("K. URL helpers generate valid paths", () => {
    expect(getClientPortalUrl("www.yourmealos.com")).toBe("https://clientes.yourmealos.com");
    expect(getClientPortalUrl("localhost:3000")).toBe("/clientes");
    expect(getTenantAppUrl("eatclean", "www.yourmealos.com")).toBe(
      "https://eatclean.yourmealos.com",
    );
    expect(getTenantAppUrl("eatclean", "localhost:3000")).toBe("/?tenant=eatclean");
  });
});
