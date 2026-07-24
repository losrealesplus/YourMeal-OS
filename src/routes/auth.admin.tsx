import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/use-auth";
import { hasStaffAccess } from "@/permissions";
import {
  parseOperationsAuthSearch,
  resolvePostAdminLoginPath,
} from "@/lib/open-operations-center";
import { toast } from "sonner";
import {
  PoweredByLine,
  TenantBrandScope,
} from "@/components/tenant/tenant-brand-scope";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { QuietLocaleSwitch } from "@/components/tenant/quiet-locale-switch";
import { brandConfig, tenantCopyEs } from "@/tenant/brand-config";

/**
 * Operations Center login — official backoffice gate.
 * EP-002A.1.1: after staff auth, return to Ops Center (or safe returnTo).
 * No public registration. No customer OAuth / phone.
 */
export const Route = createFileRoute("/auth/admin")({
  validateSearch: (search: Record<string, unknown>) =>
    parseOperationsAuthSearch(search),
  head: () => ({
    meta: [
      {
        title: `${tenantCopyEs.backOffice.entryLabel} — ${brandConfig.name}`,
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAuthPage,
});

const authInputClass =
  "w-full border border-border/80 rounded-2xl bg-white pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors";

async function loadRoles(userId: string): Promise<AppRole[]> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.role as AppRole);
}

async function enterOperationsCenter(
  navigate: ReturnType<typeof useNavigate>,
  userId: string,
  returnTo?: string,
): Promise<"ok" | "not_staff"> {
  const roles = await loadRoles(userId);
  if (!hasStaffAccess(roles)) {
    return "not_staff";
  }
  const path = resolvePostAdminLoginPath(roles, returnTo);
  navigate({ to: path as "/admin", replace: true });
  return "ok";
}

function AdminAuthPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const { returnTo } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [nonStaffSession, setNonStaffSession] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        if (!cancelled) {
          setCheckingSession(false);
          setNonStaffSession(false);
        }
        return;
      }

      const result = await enterOperationsCenter(navigate, user.id, returnTo);
      if (cancelled) return;
      if (result === "not_staff") {
        setNonStaffSession(true);
        setCheckingSession(false);
        return;
      }
      // staff → navigation in progress
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, returnTo]);

  async function switchAccount() {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      setNonStaffSession(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (!uid) {
        navigate({ to: "/admin", replace: true });
        return;
      }
      const result = await enterOperationsCenter(navigate, uid, returnTo);
      if (result === "not_staff") {
        setNonStaffSession(true);
        toast.error(t("auth:adminNotStaff"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <TenantBrandScope className="min-h-screen">
      <div className="min-h-screen grid place-items-center p-5 sm:p-8 relative bg-[var(--background)]">
        <div className="absolute top-5 right-5 md:top-7 md:right-7 z-10">
          <QuietLocaleSwitch />
        </div>

        <div className="w-full max-w-[26rem] animate-fade-in">
          <div className="rounded-[1.75rem] bg-white border border-border/50 p-8 sm:p-10 shadow-sm">
            <div className="flex justify-center">
              <TenantLogo height={56} />
            </div>

            <h1 className="text-[1.65rem] font-bold tracking-tight mt-12 text-center">
              {t("auth:adminTitle")}
            </h1>
            <p className="text-[15px] text-muted-foreground mt-3 text-center leading-[1.7] font-normal">
              {t("auth:adminSubtitle")}
            </p>

            {checkingSession ? (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                {t("common:loading")}
              </p>
            ) : nonStaffSession ? (
              <div className="mt-8 space-y-4 text-center">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("auth:adminNotStaffHint")}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void switchAccount()}
                  className="w-full bg-primary text-primary-foreground text-[15px] font-semibold py-3.5 rounded-2xl disabled:opacity-50 hover:opacity-95 transition-opacity"
                >
                  {t("auth:adminSwitchAccount")}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-4 mt-8">
                <label className="relative block">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    placeholder={t("common:email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={authInputClass}
                  />
                </label>
                <label className="relative block">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder={t("common:password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={authInputClass}
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-1 bg-primary text-primary-foreground text-[15px] font-semibold py-3.5 rounded-2xl disabled:opacity-50 hover:opacity-95 transition-opacity"
                >
                  {t("auth:adminEnter")}
                </button>
              </form>
            )}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <PoweredByLine />
            <Link
              to="/auth"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("auth:backToCustomerLogin")}
            </Link>
          </div>
        </div>
      </div>
    </TenantBrandScope>
  );
}
