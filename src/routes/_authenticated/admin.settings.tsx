import { createFileRoute, Link } from "@tanstack/react-router";
import { assertCapabilityFromContext } from "@/permissions/route-guards";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Palette,
  ChevronRight,
  LineChart,
  Users,
  Shield,
  ScrollText,
  LifeBuoy,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  beforeLoad: ({ context }) => {
    assertCapabilityFromContext(context, "admin.settings");
  },
  component: AdminSettingsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Ajustes" },
      {
        name: "description",
        content: "Ajustes de tu organización: marca, equipo, auditoría.",
      },
    ],
  }),
});

function AdminSettingsPage() {
  const { t } = useTranslation(["admin", "branding"]);
  const { roles } = useAuth();
  const canManageBrand =
    roles.includes("saas_admin") || roles.includes("company_admin");
  const isAdmin = canManageBrand;

  const entries = [
    canManageBrand
      ? {
          to: "/admin/branding" as const,
          title: t("branding:entry.title"),
          description: t("branding:entry.description"),
          cta: t("branding:entry.cta"),
          icon: Palette,
        }
      : null,
    isAdmin
      ? {
          to: "/admin/commercial" as const,
          title: "Dashboard Comercial",
          description: "Métricas de negocio con datos reales del tenant.",
          cta: "Abrir",
          icon: LineChart,
        }
      : null,
    isAdmin
      ? {
          to: "/admin/customers" as const,
          title: "Clientes",
          description: "Particulares y empresas — directorio operativo.",
          cta: "Abrir",
          icon: Users,
        }
      : null,
    isAdmin
      ? {
          to: "/admin/support" as const,
          title: "Atención al Cliente",
          description: "Consulta sobre la misma base de clientes.",
          cta: "Abrir",
          icon: LifeBuoy,
        }
      : null,
    isAdmin
      ? {
          to: "/admin/users" as const,
          title: "Usuarios",
          description: "Miembros del tenant y roles RBAC.",
          cta: "Abrir",
          icon: Shield,
        }
      : null,
    isAdmin
      ? {
          to: "/admin/audit" as const,
          title: "Auditoría",
          description: "Registro de cambios persistidos.",
          cta: "Abrir",
          icon: ScrollText,
        }
      : null,
  ].filter(Boolean) as Array<{
    to:
      | "/admin/branding"
      | "/admin/commercial"
      | "/admin/customers"
      | "/admin/support"
      | "/admin/users"
      | "/admin/audit";
    title: string;
    description: string;
    cta: string;
    icon: typeof Palette;
  }>;

  return (
    <div className="mx-auto w-full max-w-4xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("admin:settings", { defaultValue: "Ajustes" })}
        </h1>
        <p className="text-sm text-muted-foreground">
          Centro de gestión EatClean — solo superficies conectadas.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <Card key={entry.to} className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-medium leading-tight">{entry.title}</h2>
                  <p className="text-muted-foreground text-xs mt-1">
                    {entry.description}
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-2">
                <Button asChild size="sm" variant="secondary">
                  <Link to={entry.to}>
                    {entry.cta}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
