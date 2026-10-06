import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { AppRole } from "./use-auth";
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "staff" }, tenantId: "tenant", roles: ["company_admin"] }),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { customCaptureRoleEligible, useCustomOrderCapture } from "./use-custom-order-capture";
describe("custom presentation authority", () => {
  it.each(["company_admin", "operations_manager", "saas_admin"])(
    "allows compatible %s only on individual channel",
    (role) => {
      expect(customCaptureRoleEligible([role as AppRole], "individual")).toBe(true);
      expect(customCaptureRoleEligible([role as AppRole], "company")).toBe(false);
    },
  );
  it.each([{ roles: [] }, { roles: ["customer"] }, { roles: ["kitchen"] }, { roles: ["driver"] }])(
    "closes incompatible roles %j",
    ({ roles }) => expect(customCaptureRoleEligible(roles as AppRole[], "individual")).toBe(false),
  );
  it("renders CLOSED during SSR/initial loading before a tenant flag resolves", () => {
    function Probe() {
      return <span>{useCustomOrderCapture() ? "OPEN" : "CLOSED"}</span>;
    }
    expect(renderToString(<Probe />)).toContain("CLOSED");
  });
});
