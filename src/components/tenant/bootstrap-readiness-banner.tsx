/**
 * OP-001.1 · Bootstrap readiness banner — surfaces integrity blocks in Ops UI.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import {
  BootstrapIntegrityService,
  type BootstrapIntegrityReport,
} from "@/modules/bootstrap-integrity";
import { cn } from "@/lib/utils";

const NEXT_STEP: Record<string, { label: string; to: string }> = {
  BOOTSTRAP_NO_DISHES: { label: "Ir a platos", to: "/admin/dishes" },
  BOOTSTRAP_EMPTY_MENU: { label: "Ir a menús", to: "/admin/menus" },
  BOOTSTRAP_NO_PUBLISHED_MENU: { label: "Publicar menú", to: "/admin/menus" },
  BOOTSTRAP_NO_KITCHEN_DEMAND: { label: "Ver pedidos", to: "/admin/orders" },
  BOOTSTRAP_NO_DELIVERY_DEMAND: { label: "Ir a cocina", to: "/admin/kitchen" },
  BOOTSTRAP_NO_COMPANY_ADMIN: { label: "Usuarios", to: "/admin/users" },
};

export function BootstrapReadinessBanner({
  className,
  focus,
}: {
  className?: string;
  /** When set, only show blocks matching these codes (e.g. kitchen page). */
  focus?: string[];
}) {
  const { user, tenantId, roles } = useAuth();
  const [report, setReport] = useState<BootstrapIntegrityReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !tenantId) return;
      try {
        const ctx = await createServiceContext({
          supabase,
          userId: user.id,
          tenantId,
          roles,
        });
        const next = await BootstrapIntegrityService.audit(ctx);
        if (!cancelled) setReport(next);
      } catch {
        // Capability or RLS — banner is advisory; stay quiet.
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, tenantId, roles]);

  if (!report) return null;

  let blocked = report.blocked;
  if (focus?.length) {
    blocked = blocked.filter((b) => focus.includes(b.verdict.code));
  }
  // On ops home, only show the first blocking step that still matters for stage.
  if (!focus && blocked.length > 1) {
    const stagePriority = [
      "BOOTSTRAP_NO_COMPANY_ADMIN",
      "BOOTSTRAP_NO_DISHES",
      "BOOTSTRAP_NO_PUBLISHED_MENU",
      "BOOTSTRAP_NO_KITCHEN_DEMAND",
      "BOOTSTRAP_NO_DELIVERY_DEMAND",
    ];
    const first = stagePriority
      .map((code) => blocked.find((b) => b.verdict.code === code))
      .find(Boolean);
    blocked = first ? [first] : blocked.slice(0, 1);
  }

  if (blocked.length === 0) {
    if (focus) return null;
    if (report.stage === "operational") {
      return (
        <div
          className={cn(
            "rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm",
            className,
          )}
        >
          <p className="font-semibold text-foreground">
            Bootstrap operativo · stage `{report.stage}`
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Cadena tenant → menú → pedidos → cocina → entrega cerrada al menos una vez.
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-[oklch(0.75_0.12_75)]/40 bg-[oklch(0.97_0.03_85)] px-4 py-3 text-sm space-y-2",
        className,
      )}
      role="status"
    >
      <p className="font-semibold text-foreground">
        Bootstrap integrity · stage `{report.stage}`
      </p>
      <ul className="space-y-2">
        {blocked.map((b) => {
          const next = NEXT_STEP[b.verdict.code];
          return (
            <li key={b.id} className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">{b.verdict.message}</span>
              {next ? (
                <Link
                  to={next.to as "/admin"}
                  className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  {next.label}
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
