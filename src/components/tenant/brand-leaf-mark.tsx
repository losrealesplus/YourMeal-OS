import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/use-auth";
import { decideOperationsCenterEntry } from "@/lib/open-operations-center";

/**
 * Staff entry into the Operations Center — sits near Powered by / Home footer.
 * Customers see a quiet brand control; staff recognize where the day starts.
 * Never navigates blindly: checks staff session, then auth or Ops Center.
 */
export function BrandLeafMark({ className }: { className?: string }) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { roles, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  async function openOperationsCenter() {
    if (loading || busy) return;
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      let effectiveRoles = roles;

      if (uid && roles.length === 0) {
        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid);
        effectiveRoles = (roleRows ?? []).map((r) => r.role as AppRole);
      }

      const decision = decideOperationsCenterEntry({
        sessionUserId: uid,
        roles: effectiveRoles,
      });

      if (decision.action === "auth") {
        await navigate({
          to: decision.to,
          search: decision.search,
        });
        return;
      }

      await navigate({ to: decision.to as "/admin" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void openOperationsCenter()}
      disabled={loading || busy}
      aria-label={t("adminEntryAria")}
      className={cn(
        "text-[10px] font-medium tracking-[0.04em] text-muted-foreground",
        "transition-colors duration-300 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:rounded-sm",
        "disabled:opacity-50",
        className,
      )}
    >
      {t("adminEntryLabel")}
    </button>
  );
}
