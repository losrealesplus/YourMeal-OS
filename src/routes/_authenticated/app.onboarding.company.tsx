/**
 * Public company self-registration removed.
 * Companies are provisioned by EatClean staff at /admin/companies.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ScreenHeader, PrimaryCTA } from "@/components/consumer";

export const Route = createFileRoute("/_authenticated/app/onboarding/company")({
  component: CompanySelfRegisterRemovedPage,
});

function CompanySelfRegisterRemovedPage() {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col pb-10">
      <ScreenHeader
        backTo="/app/onboarding"
        title="Alta de empresa"
        subtitle="Este flujo no es autoservicio"
      />
      <div className="px-6 space-y-4 text-sm text-muted-foreground">
        <p>
          Las empresas{" "}
          <strong className="text-foreground">no se registran</strong> desde la
          app. EatClean las da de alta tras el proceso comercial (Centro de
          Operaciones → Administración → Clientes Empresa).
        </p>
        <p>
          Si eres empleado, únete con el{" "}
          <strong className="text-foreground">Company Code</strong> que te
          facilite tu empresa.
        </p>
        <div className="pt-2 space-y-3">
          <PrimaryCTA onClick={() => navigate({ to: "/app/onboarding/employee" })}>
            Unirme con Company Code
          </PrimaryCTA>
          <PrimaryCTA
            variant="outline"
            onClick={() => navigate({ to: "/app/onboarding" })}
          >
            Volver
          </PrimaryCTA>
        </div>
        <p className="text-xs">
          <Link to="/app" className="underline">
            Ir al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
