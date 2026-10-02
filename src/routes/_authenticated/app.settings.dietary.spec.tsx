/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { Route } from "./app.settings.dietary";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => ({ options: config }),
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

// Mock hooks
const mockUseCurrentCustomerId = vi.fn();
vi.mock("@/hooks/use-current-customer-id", () => ({
  useCurrentCustomerId: () => mockUseCurrentCustomerId(),
}));

vi.mock("@/components/admin/customer-dietary-editor", () => ({
  CustomerDietaryEditor: ({ customerId, canWrite }: any) => (
    <div data-testid="dietary-editor" data-customer-id={customerId} data-can-write={canWrite}>
      <span>Mocked Customer Dietary Editor</span>
    </div>
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe("app.settings.dietary route component", () => {
  const Component = (Route as any).options.component;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading indicator while resolving customer id", () => {
    mockUseCurrentCustomerId.mockReturnValue({
      isLoading: true,
      data: null,
    });

    const html = renderToString(<Component />);
    expect(html).toContain("Cargando...");
  });

  it("renders message to complete onboarding if no customer id exists", () => {
    mockUseCurrentCustomerId.mockReturnValue({
      isLoading: false,
      data: null,
    });

    const html = renderToString(<Component />);
    expect(html).toContain("No se encontró el perfil de cliente asociado");
    expect(html).toContain("Por favor completa el onboarding");
  });

  it("renders customer dietary editor when customer id is resolved", () => {
    mockUseCurrentCustomerId.mockReturnValue({
      isLoading: false,
      data: "c-cust-123",
    });

    const html = renderToString(<Component />);
    expect(html).toContain("Alergias y Preferencias");
    expect(html).toContain('data-customer-id="c-cust-123"');
    expect(html).toContain('data-can-write="true"');
    expect(html).toContain("Mocked Customer Dietary Editor");
  });
});
