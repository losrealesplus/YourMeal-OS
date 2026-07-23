import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Ajustes" },
      {
        name: "description",
        content: "Ajustes de tu organización: marca, equipo, integraciones.",
      },
    ],
  }),
});

function AdminSettingsPage() {
  const { t } = useTranslation(["admin", "branding"]);
  const { roles } = useAuth();
  const canManageBrand =
    roles.includes("saas_admin") || roles.includes("company_admin");

  return (
    <div className="mx-auto w-full max-w-4xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("admin:settings", { defaultValue: "Ajustes" })}
        </h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {canManageBrand && (
          <Card className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Palette className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-medium leading-tight">
                  {t("branding:entry.title")}
                </h2>
                <p className="text-muted-foreground text-xs mt-1">
                  {t("branding:entry.description")}
                </p>
              </div>
            </div>
            <div className="mt-auto pt-2">
              <Button asChild size="sm" variant="secondary">
                <Link to="/admin/branding">
                  {t("branding:entry.cta")}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
