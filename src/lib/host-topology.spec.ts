import { describe, it, expect } from "vitest";
import { resolveHostTopology, getClientPortalUrl, getTenantAppUrl } from "./host-topology";
import {
  getPublicClientsDirectory,
  getPublicClientBySlug,
  CLIENT_REGISTRY,
} from "./public-clients-registry";

describe("Block C0: Host Topology, Public Directory & Demo Distinction", () => {
  it("A. www.yourmealos.com resolves deterministically to public_marketing in SSR", () => {
    const topo = resolveHostTopology("www.yourmealos.com");
    expect(topo.hostType).toBe("public_marketing");
    expect(topo.tenantSlug).toBeNull();
  });

  it("B. yourmealos.com (apex domain) resolves to public_marketing in SSR", () => {
    const topo = resolveHostTopology("yourmealos.com");
    expect(topo.hostType).toBe("public_marketing");
    expect(topo.tenantSlug).toBeNull();
  });

  it("C. clientes.yourmealos.com resolves to client_portal in SSR", () => {
    const topo = resolveHostTopology("clientes.yourmealos.com");
    expect(topo.hostType).toBe("client_portal");
    expect(topo.tenantSlug).toBeNull();
  });

  it("D. eatclean.yourmealos.com and eatclean-staging resolve to tenant 'eatclean' in SSR", () => {
    const prodTopo = resolveHostTopology("eatclean.yourmealos.com");
    expect(prodTopo.hostType).toBe("tenant");
    expect(prodTopo.tenantSlug).toBe("eatclean");

    const stagingTopo = resolveHostTopology("eatclean-staging.yourmealos.com");
    expect(stagingTopo.hostType).toBe("tenant");
    expect(stagingTopo.tenantSlug).toBe("eatclean");
  });

  it("E. Future tenant (e.g. singular.yourmealos.com) resolves to tenant 'singular' in SSR", () => {
    const topo = resolveHostTopology("singular.yourmealos.com");
    expect(topo.hostType).toBe("tenant");
    expect(topo.tenantSlug).toBe("singular");
  });

  it("F. Unknown host, preview URLs or localhost safely fall back to public_marketing", () => {
    const topo1 = resolveHostTopology("preview-123.pages.dev");
    expect(topo1.hostType).toBe("public_marketing");

    const topo2 = resolveHostTopology("localhost:3000");
    expect(topo2.hostType).toBe("public_marketing");

    const topo3 = resolveHostTopology("");
    expect(topo3.hostType).toBe("public_marketing");
  });

  it("G. Hydration Parity: Server and Client resolve identical topology for any given host header", () => {
    const testHosts = [
      "www.yourmealos.com",
      "yourmealos.com",
      "clientes.yourmealos.com",
      "eatclean.yourmealos.com",
      "eatclean-staging.yourmealos.com",
      "catering-b.yourmealos.com",
    ];

    for (const host of testHosts) {
      const serverResult = resolveHostTopology(host);
      const clientResult = resolveHostTopology(host);
      expect(serverResult.hostType).toBe(clientResult.hostType);
      expect(serverResult.tenantSlug).toBe(clientResult.tenantSlug);
    }
  });

  it("H. Public directory places YourMeal OS Demo first with 'platform_demo' type", () => {
    const publicList = getPublicClientsDirectory();
    expect(publicList.length).toBeGreaterThan(0);
    expect(publicList[0].slug).toBe("yourmeal-os");
    expect(publicList[0].type).toBe("platform_demo");
    expect(publicList[0].label).toBe("Demo oficial");
  });

  it("I. Public directory lists EatClean as a real customer with 'customer' type", () => {
    const publicList = getPublicClientsDirectory();
    const eatclean = publicList.find((c) => c.slug === "eatclean");
    expect(eatclean).toBeDefined();
    expect(eatclean?.type).toBe("customer");
    expect(eatclean?.label).toBe("Cliente de YourMeal OS");
  });

  it("J. Language Audit: Public registry descriptions contain clean operational Spanish without internal jargon", () => {
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
