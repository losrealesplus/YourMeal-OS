/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { CustomerWelcomeModal } from "./customer-welcome-modal";

const mockAuthUser = {
  id: "user-123",
  email: "cliente@eatclean.es",
  phone: "+34 611 222 333",
  user_metadata: { full_name: "María Canaria" },
};

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
  DialogDescription: ({ children, className }: any) => <p className={className}>{children}</p>,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isStaff: false,
    tenantId: "8bba00ba-331b-42c8-9283-4e3836ffb870",
    roles: ["customer"],
  }),
}));

let mockCustomerId: string | null = null;
vi.mock("@/hooks/use-current-customer-id", () => ({
  useCurrentCustomerId: () => ({
    data: mockCustomerId,
    isLoading: false,
    isSuccess: true,
  }),
}));

const mockExecute = vi.fn();
vi.mock("@/hooks/use-customer-self-profile", () => ({
  useCustomerSelfProfile: () => ({
    tenantId: "8bba00ba-331b-42c8-9283-4e3836ffb870",
    profile: {
      data: mockCustomerId
        ? {
            customerId: mockCustomerId,
            displayName: "María Canaria",
            revision: 1,
            addresses: [],
          }
        : null,
    },
    links: { data: [] },
    execute: mockExecute,
    busy: false,
    uncertain: false,
    reconcile: vi.fn(),
  }),
}));

describe("CustomerWelcomeModal (CX-01B Onboarding Wizard)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCustomerId = null;
  });

  it("renders Welcome step with value proposition and how it works explanation", () => {
    const html = renderToString(
      <CustomerWelcomeModal
        open={true}
        onOpenChange={vi.fn()}
        forcedStep="welcome"
      />,
    );

    expect(html).toContain("¡Bienvenido a EatClean!");
    expect(html).toContain("¿Cómo funciona EatClean?");
    expect(html).toContain("Elige tus platos");
    expect(html).toContain("Cocina fresca");
    expect(html).toContain("Entrega semanal");
    expect(html).toContain("Empezar configuración");
  });

  it("renders Identity step with prefilled name from OAuth metadata and phone input", () => {
    const html = renderToString(
      <CustomerWelcomeModal
        open={true}
        onOpenChange={vi.fn()}
        forcedStep="identity"
      />,
    );

    expect(html).toContain("Configura tu ficha de cliente");
    expect(html).toContain("Nombre completo");
    expect(html).toContain("María Canaria");
    expect(html).toContain("Teléfono de contacto");
    expect(html).toContain("+34 611 222 333");
    expect(html).toContain("Guardar y continuar");
    expect(html).toContain("Solicitar vinculación de ficha histórica");
  });

  it("renders Address step with street, city and zip inputs", () => {
    mockCustomerId = "cust-123";
    const html = renderToString(
      <CustomerWelcomeModal
        open={true}
        onOpenChange={vi.fn()}
        forcedStep="address"
      />,
    );

    expect(html).toContain("¿Dónde te entregamos tus platos?");
    expect(html).toContain("Calle, número y piso");
    expect(html).toContain("Las Palmas de Gran Canaria");
    expect(html).toContain("Código postal");
    expect(html).toContain("Guardar dirección y continuar");
  });

  it("renders Completion step ready to schedule meals", () => {
    mockCustomerId = "cust-123";
    const html = renderToString(
      <CustomerWelcomeModal
        open={true}
        onOpenChange={vi.fn()}
        forcedStep="dietary"
      />,
    );

    expect(html).toContain("¡Tu cuenta está lista!");
    expect(html).toContain("¡Ficha y dirección listas!");
    expect(html).toContain("Empezar a programar mis comidas");
  });
});
