/**
 * Centro de Operaciones — Experience First entry for EatClean staff.
 *
 * Not a dashboard. Not KPIs. Not charts.
 * Answers: "¿Qué necesita hacer hoy mi departamento?"
 *
 * Workspace rule (presentation only — RBAC unchanged):
 * - 1 authorized workspace → enter directly
 * - 2+ workspaces → show this Operations Center
 * - company_admin / saas_admin → always show all workspaces
 *
 * No services / Supabase / RBAC changes.
 */
import type { ComponentType } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ChefHat,
  Truck,
  Package,
  Users,
  Briefcase,
  Wallet,
  ArrowRight,
  CircleAlert,
  CircleDot,
  CircleCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  resolveOperationsEntry,
  type OperationsWorkspaceId,
} from "@/lib/operations-workspaces";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: OperationsCenterPage,
});

const WORKSPACE_ICONS: Record<
  OperationsWorkspaceId,
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  kitchen: ChefHat,
  delivery: Truck,
  stock: Package,
  customers: Users,
  administration: Briefcase,
  finance: Wallet,
};

/** Agenda cues — presentation placeholders until live ops signals exist. */
const AGENDA_CUES = [
  {
    tone: "urgent" as const,
    icon: CircleAlert,
    key: "cueProduction",
  },
  {
    tone: "attention" as const,
    icon: CircleDot,
    key: "cueRoutes",
  },
  {
    tone: "ok" as const,
    icon: CircleCheck,
    key: "cueStock",
  },
];

function OperationsCenterPage() {
  const { t, i18n } = useTranslation("admin");
  const { profile, roles, user } = useAuth();
  const entry = resolveOperationsEntry(roles);

  if (entry.kind === "direct") {
    return <Navigate to={entry.path} replace />;
  }

  const firstName =
    profile?.fullName?.trim().split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    "";

  const weekday = new Intl.DateTimeFormat(i18n.language || "es", {
    weekday: "long",
  }).format(new Date());

  const paths = new Set(entry.workspaces.map((w) => w.path));
  const canProduction = paths.has("/admin/production");
  const canDelivery = paths.has("/admin/routes");

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          {t("ops.kicker")}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("ops.title")}
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          {firstName
            ? t("ops.greetingNamed", { name: firstName })
            : t("ops.greeting")}
        </p>
        <p className="text-sm capitalize text-muted-foreground/80">
          {t("ops.todayIs", { weekday })}
        </p>
      </header>

      <section
        aria-labelledby="ops-agenda-heading"
        className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm sm:p-6"
      >
        <h2
          id="ops-agenda-heading"
          className="font-display text-lg font-semibold text-foreground"
        >
          {t("ops.agendaTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("ops.agendaLead")}</p>

        <ul className="mt-5 space-y-3">
          {AGENDA_CUES.map((cue) => {
            const Icon = cue.icon;
            return (
              <li
                key={cue.key}
                className="flex items-start gap-3 text-sm text-foreground"
              >
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    cue.tone === "urgent" && "text-destructive",
                    cue.tone === "attention" && "text-[color:var(--attention,#EDB32A)]",
                    cue.tone === "ok" && "text-primary",
                  )}
                  strokeWidth={2.25}
                  aria-hidden
                />
                <span>{t(`ops.agenda.${cue.key}`)}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {canProduction && (
            <Link
              to="/admin/production"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
            >
              {t("ops.ctaStartProduction")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
          {canDelivery && (
            <Link
              to="/admin/routes"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/50"
            >
              {t("ops.ctaPrepareDelivery")}
            </Link>
          )}
          {canDelivery && (
            <Link
              to="/admin/routes/incidents"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
            >
              {t("ops.ctaReviewIncidents")}
            </Link>
          )}
        </div>
      </section>

      <section aria-labelledby="ops-workspaces-heading" className="space-y-4">
        <div>
          <h2
            id="ops-workspaces-heading"
            className="font-display text-lg font-semibold text-foreground"
          >
            {t("ops.workspacesTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("ops.workspacesLead")}
          </p>
        </div>

        {entry.workspaces.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
            {t("ops.noWorkspaces")}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {entry.workspaces.map((ws) => {
              const Icon = WORKSPACE_ICONS[ws.id];
              return (
                <Link
                  key={ws.id}
                  to={ws.path}
                  className="group flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-5 transition hover:border-primary/35 hover:bg-accent/40"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="space-y-1">
                    <p className="font-display text-base font-semibold text-foreground">
                      {t(`ops.workspace.${ws.id}.label`)}
                    </p>
                    <p className="text-sm leading-snug text-muted-foreground">
                      {t(`ops.workspace.${ws.id}.description`)}
                    </p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                    {t("ops.enterWorkspace")}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
