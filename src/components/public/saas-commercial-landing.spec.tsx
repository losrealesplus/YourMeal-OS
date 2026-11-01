import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { SaasCommercialLanding } from "./saas-commercial-landing";
import { OperationalFlow } from "./operational-flow";
import { OperationalContext } from "./operational-context";
import { ProductEcosystem } from "./product-ecosystem";
import { ProductShowcase, ProductScreenshot } from "./product-showcase";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children?: React.ReactNode;
    to?: string;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}));

describe("Public Marketing Landing & Components — Navigation, A11y & Responsive Suite", () => {
  it("renders SaasCommercialLanding with synchronized header navigation anchors matching DOM IDs", () => {
    const html = renderToString(<SaasCommercialLanding />);

    // Header navigation anchors must match real DOM section IDs
    expect(html).toContain('href="#en-accion"');
    expect(html).toContain('href="#modulos"');
    expect(html).toContain('href="#flujo-operativo"');
    expect(html).toContain('href="#contacto"');

    // Mismatched legacy anchors must be completely absent from header navigation
    expect(html).not.toContain('href="#producto"');
    expect(html).not.toContain('href="#soluciones"');
    expect(html).not.toContain('href="#como-funciona"');

    // Destination sections must exist in the rendered DOM
    expect(html).toContain('id="en-accion"');
    expect(html).toContain('id="modulos"');
    expect(html).toContain('id="flujo-operativo"');
    expect(html).toContain('id="contacto"');
  });

  it("enforces WCAG AA compliant contrast tokens and eliminates failing text-emerald-500 / text-amber-600 on light backgrounds", () => {
    const landingHtml = renderToString(<SaasCommercialLanding />);
    const ordersShowcaseHtml = renderToString(<ProductScreenshot workspaceType="orders" />);
    const kitchenShowcaseHtml = renderToString(<ProductScreenshot workspaceType="kitchen" />);
    const logisticsShowcaseHtml = renderToString(<ProductScreenshot workspaceType="logistics" />);
    const financeShowcaseHtml = renderToString(<ProductScreenshot workspaceType="finance" />);

    // Compliant tokens
    expect(landingHtml).toContain("text-emerald-700 dark:text-emerald-400");
    expect(landingHtml).toContain("text-amber-700 dark:text-amber-400");
    expect(ordersShowcaseHtml).toContain("text-amber-700 dark:text-amber-400");
    expect(kitchenShowcaseHtml).toContain("text-emerald-700 dark:text-emerald-400");
    expect(logisticsShowcaseHtml).toContain("text-emerald-700 dark:text-emerald-400");
    expect(financeShowcaseHtml).toContain("text-emerald-700 dark:text-emerald-400");

    // Zero occurrences of failing colors
    expect(landingHtml).not.toContain("text-emerald-500 font-bold");
    expect(kitchenShowcaseHtml).not.toContain("text-emerald-500");
    expect(logisticsShowcaseHtml).not.toContain("text-emerald-500");
    expect(financeShowcaseHtml).not.toContain("text-emerald-500");
  });

  it("enforces aria-hidden='true' on decorative icons across all public components", () => {
    const landingHtml = renderToString(<SaasCommercialLanding />);
    const flowHtml = renderToString(<OperationalFlow />);
    const contextHtml = renderToString(<OperationalContext />);
    const ecosystemHtml = renderToString(<ProductEcosystem />);

    expect(landingHtml).toContain('aria-hidden="true"');
    expect(flowHtml).toContain('aria-hidden="true"');
    expect(contextHtml).toContain('aria-hidden="true"');
    expect(ecosystemHtml).toContain('aria-hidden="true"');
  });

  it("enforces strict heading hierarchy without skipping h3 levels", () => {
    const flowHtml = renderToString(<OperationalFlow />);
    const contextHtml = renderToString(<OperationalContext />);
    const landingHtml = renderToString(<SaasCommercialLanding />);

    // Step names in OperationalFlow must be h3
    expect(flowHtml).toContain("<h3");
    expect(flowHtml).not.toContain("<h4");

    // Card taglines in OperationalContext must be h3
    expect(contextHtml).toContain("<h3");
    expect(contextHtml).not.toContain("<h4");

    // Tenant domains in SaasCommercialLanding Section 9 must be h3
    expect(landingHtml).toContain("eatclean.yourmealos.com</h3>");
    expect(landingHtml).toContain("singular.yourmealos.com</h3>");
  });

  it("enforces minimum touch targets of 44px on footer navigation links", () => {
    const html = renderToString(<SaasCommercialLanding />);
    expect(html).toContain('min-h-[44px] inline-flex items-center"');
  });

  it("configures responsive grid on OperationalFlow to avoid column cramp on viewports 1024-1150px", () => {
    const html = renderToString(<OperationalFlow />);
    // Grid must scale through sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7
    expect(html).toContain("grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7");
  });
});
