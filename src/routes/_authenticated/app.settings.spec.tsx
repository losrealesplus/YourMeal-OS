/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { Route as SettingsIndexRoute } from "./app.settings.index";
import { Route as SettingsProfileRoute } from "./app.settings.profile";
import { Route as AddressesRoute } from "./app.addresses";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: any) => ({ options: config }),
  useNavigate: () => vi.fn(),
  Link: ({ children, to, className }: any) => (
    <a href={typeof to === "string" ? to : "/"} className={className}>
      {children}
    </a>
  ),
}));

// Mock Auth
let mockUser: any = {
  id: "user-cust-1",
  email: "alex@eatclean.test",
  user_metadata: { full_name: "Alejandro Real" },
};
let mockRoles = ["customer"];

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockUser,
    roles: mockRoles,
    tenantId: "tenant-eatclean-1",
  }),
}));

// Mock Customer Self Profile
let mockProfileData: any = {
  customerId: "cust-1",
  tenantId: "tenant-eatclean-1",
  revision: 1,
  displayName: "Alejandro Real",
  email: "contacto@alexreal.com",
  phone: "+34 611 222 333",
  kind: "individual",
  addresses: [
    {
      id: "addr-1",
      label: "Casa",
      street: "Calle Velázquez 24",
      city: "Madrid",
      zip: "28001",
      isDefault: true,
      archived: false,
    },
    {
      id: "addr-2",
      label: "Oficina",
      street: "Paseo de la Castellana 100",
      city: "Madrid",
      zip: "28046",
      isDefault: false,
      archived: false,
    },
  ],
};
let mockProfileLoading = false;
let mockProfileError: any = null;
let mockLinksData: any[] = [];
let mockUncertain = false;
let mockMayRetrySame = false;
let mockBusy = false;

vi.mock("@/hooks/use-customer-self-profile", () => ({
  useCustomerSelfProfile: () => ({
    tenantId: "tenant-eatclean-1",
    profile: {
      data: mockProfileData,
      isLoading: mockProfileLoading,
      error: mockProfileError,
      isSuccess: !mockProfileLoading && !mockProfileError,
    },
    links: {
      data: mockLinksData,
      isLoading: false,
    },
    customer: {
      data: "cust-1",
      isLoading: false,
      error: null,
    },
    uncertain: mockUncertain,
    mayRetrySame: mockMayRetrySame,
    busy: mockBusy,
    execute: vi.fn(),
    reconcile: vi.fn(),
    retrySame: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    cancelQueries: vi.fn(),
    clear: vi.fn(),
  }),
}));

vi.mock("@/auth", () => ({
  signOut: vi.fn(),
}));

vi.mock("@/components/language-selector", () => ({
  LanguageSelector: () => <div data-testid="lang-selector">ES / EN</div>,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe("CX-01B: Settings Index Hub (app.settings.index)", () => {
  const Component = (SettingsIndexRoute as any).options.component;

  beforeEach(() => {
    mockProfileData = {
      customerId: "cust-1",
      tenantId: "tenant-eatclean-1",
      revision: 1,
      displayName: "Alejandro Real",
      email: "contacto@alexreal.com",
      phone: "+34 611 222 333",
      kind: "individual",
      addresses: [
        {
          id: "addr-1",
          label: "Casa",
          street: "Calle Velázquez 24",
          city: "Madrid",
          zip: "28001",
          isDefault: true,
          archived: false,
        },
      ],
    };
  });

  it("renders profile summary card with avatar initial, name, email, phone, and address count", () => {
    const html = renderToString(<Component />);
    expect(html).toContain("Alejandro Real");
    expect(html).toContain("contacto@alexreal.com");
    expect(html).toContain("+34 611 222 333");
    expect(html).toContain("1 dirección");
    expect(html).toContain('href="/app/settings/profile"');
  });

  it("renders exclusively functional navigation targets without dead buttons", () => {
    const html = renderToString(<Component />);

    // Account & Profile
    expect(html).toContain('href="/app/settings/profile"');
    expect(html).toContain("Datos personales");
    expect(html).toContain('href="/app/addresses"');
    expect(html).toContain("Direcciones de entrega");
    expect(html).toContain('href="/app/company"');
    expect(html).toContain("Portal de empresa");

    // Food & Wellness
    expect(html).toContain('href="/app/settings/dietary"');
    expect(html).toContain("Alergias y preferencias");
    expect(html).toContain('href="/app/favorites"');
    expect(html).toContain("Platos favoritos");

    // Orders & Billing
    expect(html).toContain('href="/app/orders"');
    expect(html).toContain("Historial de pedidos");
    expect(html).toContain('href="/app/payment-methods"');
    expect(html).toContain("Métodos de pago");

    // App Preferences
    expect(html).toContain('href="/app/notifications"');
    expect(html).toContain("Notificaciones");

    // Dead buttons eliminated
    expect(html).not.toContain("customer:phones");
    expect(html).not.toContain("customer:invoices");
    expect(html).not.toContain("customer:help");
    expect(html).not.toContain("customer:about");
  });

  it("renders language selector and sign out CTA", () => {
    const html = renderToString(<Component />);
    expect(html).toContain("ES / EN");
    expect(html).toContain("Cerrar sesión");
  });
});

describe("CX-01B: Profile Management (app.settings.profile)", () => {
  const Component = (SettingsProfileRoute as any).options.component;

  it("renders customer profile view mode with clear key-value items and edit button", () => {
    mockProfileData = {
      customerId: "cust-1",
      tenantId: "tenant-eatclean-1",
      revision: 3,
      displayName: "Alejandro Real",
      email: "contacto@alexreal.com",
      phone: "+34 611 222 333",
      kind: "individual",
      addresses: [],
    };

    const html = renderToString(<Component />);
    expect(html).toContain("Datos personales");
    expect(html).toContain("Ficha de cliente");
    expect(html).toContain("Alejandro Real");
    expect(html).toContain("contacto@alexreal.com");
    expect(html).toContain("+34 611 222 333");
    expect(html).toContain("Editar mis datos");
  });

  it("renders onboarding card when customer does not have a profile yet", () => {
    mockProfileData = null;
    mockRoles = ["customer"];

    const html = renderToString(<Component />);
    expect(html).toContain("Crea tu ficha de cliente");
    expect(html).toContain("Soy nuevo cliente: crear ficha");
    expect(html).toContain("Ya soy cliente: solicitar vinculación");
  });

  it("renders concurrency recovery alert when state is uncertain", () => {
    mockProfileData = {
      customerId: "cust-1",
      displayName: "Alejandro Real",
      revision: 1,
      addresses: [],
    };
    mockUncertain = true;
    mockMayRetrySame = true;

    const html = renderToString(<Component />);
    expect(html).toContain("Comprobación requerida");
    expect(html).toContain("Comprobar resultado");
    expect(html).toContain("Reintentar solicitud");
  });
});

describe("CX-01B: Addresses Management (app.addresses)", () => {
  const Component = (AddressesRoute as any).options.component;

  beforeEach(() => {
    mockUncertain = false;
    mockMayRetrySame = false;
  });

  it("renders empty state notice when no active delivery addresses exist", () => {
    mockProfileData = {
      customerId: "cust-1",
      tenantId: "tenant-eatclean-1",
      revision: 1,
      displayName: "Alejandro",
      addresses: [],
    };

    const html = renderToString(<Component />);
    expect(html).toContain("Sin direcciones guardadas");
    expect(html).toContain("Añadir nueva dirección");
  });

  it("renders active address cards with default badge, address lines, and action buttons", () => {
    mockProfileData = {
      customerId: "cust-1",
      tenantId: "tenant-eatclean-1",
      revision: 1,
      displayName: "Alejandro",
      addresses: [
        {
          id: "addr-1",
          label: "Casa",
          street: "Calle Velázquez 24, 4º A",
          city: "Madrid",
          zip: "28001",
          isDefault: true,
          archived: false,
        },
        {
          id: "addr-2",
          label: "Oficina",
          street: "Paseo de la Castellana 100",
          city: "Madrid",
          zip: "28046",
          isDefault: false,
          archived: false,
        },
      ],
    };

    const html = renderToString(<Component />);
    expect(html).toContain("Direcciones activas (2)");
    expect(html).toContain("Casa");
    expect(html).toContain("Predeterminada");
    expect(html).toContain("Calle Velázquez 24, 4º A");
    expect(html).toContain("Oficina");
    expect(html).toContain("Paseo de la Castellana 100");
    expect(html).toContain("Editar");
    expect(html).toContain("Archivar");
    expect(html).toContain("Hacer predeterminada");
    expect(html).toContain("Añadir nueva dirección");
  });

  it("renders archived address cards with restore action", () => {
    mockProfileData = {
      customerId: "cust-1",
      tenantId: "tenant-eatclean-1",
      revision: 1,
      displayName: "Alejandro",
      addresses: [
        {
          id: "addr-arch-1",
          label: "Antiguo piso",
          street: "Calle Princesa 10",
          city: "Madrid",
          zip: "28008",
          isDefault: false,
          archived: true,
        },
      ],
    };

    const html = renderToString(<Component />);
    expect(html).toContain("Direcciones archivadas (1)");
    expect(html).toContain("Antiguo piso");
    expect(html).toContain("Restaurar");
  });
});
