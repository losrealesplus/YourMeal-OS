/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { Route } from "./app.settings.profile";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => ({ options: config }),
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

const mockUseAuth = vi.fn();
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseCustomerProfile = vi.fn();
const mockUseUpdateCustomerProfile = vi.fn();
vi.mock("@/hooks/use-customer-profile", () => ({
  useCustomerProfile: () => mockUseCustomerProfile(),
  useUpdateCustomerProfile: () => mockUseUpdateCustomerProfile(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe("CR-UX-CLIENT-02 · app.settings.profile route component", () => {
  const Component = (Route as any).options.component;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-123",
        email: "isabella@example.com",
        user_metadata: { full_name: "Isabella Fallback", phone: "+34 600 000 000" },
      },
      tenantId: "tenant-eatclean-uuid",
    });
    mockUseUpdateCustomerProfile.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("renders loading spinner while fetching profile", () => {
    mockUseCustomerProfile.mockReturnValue({
      isLoading: true,
      data: null,
    });

    const html = renderToString(<Component />);
    expect(html).toContain("Cargando perfil...");
  });

  it("TC-PROF-06: renders active profile view with relational values and enabled edit button (no comingSoon)", () => {
    mockUseCustomerProfile.mockReturnValue({
      isLoading: false,
      data: {
        id: "cust-999",
        displayName: "Isabella Hernandez",
        email: "isabella@example.com",
        phone: "+34 611 222 333",
      },
    });

    const html = renderToString(<Component />);
    expect(html).toContain("Isabella Hernandez");
    expect(html).toContain("isabella@example.com");
    expect(html).toContain("+34 611 222 333");
    expect(html).toContain("Editar datos personales");
    expect(html).not.toContain("comingSoon");
  });

  it("renders fallback data from user_metadata when relational fields are missing", () => {
    mockUseCustomerProfile.mockReturnValue({
      isLoading: false,
      data: null,
    });

    const html = renderToString(<Component />);
    expect(html).toContain("Isabella Fallback");
    expect(html).toContain("isabella@example.com");
    expect(html).toContain("+34 600 000 000");
  });
});
