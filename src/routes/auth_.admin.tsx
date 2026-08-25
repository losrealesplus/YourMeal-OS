import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Mail } from "lucide-react";
import {
  beginPostLoginPipeline,
  getSession,
  signInWithPassword,
  signOut,
  canonicalUserIdFromAuthData,
  logPostLoginStep,
  stopPostLogin,
} from "@/auth";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/use-auth";
import {
  classifyAdminAuthBootstrapError,
  enterOperationsCenter,
  reportAdminAuthBootstrapFailure,
  type ClassifiedAdminAuthError,
} from "@/lib/admin-auth-bootstrap";
import { parseOperationsAuthSearch } from "@/lib/open-operations-center";
import { ensurePlatformOwnerSession } from "@/lib/ensure-platform-owner-session";
import { createAuthSession002Trace } from "@/lib/auth-session-002-trace";
import { toast } from "sonner";
import {
  PoweredByLine,
  TenantBrandScope,
} from "@/components/tenant/tenant-brand-scope";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { QuietLocaleSwitch } from "@/components/tenant/quiet-locale-switch";
import { brandConfig, tenantCopyEs } from "@/tenant/brand-config";

import { resolveInstanceRuntimeConfig } from "@/lib/instance-runtime-boundary";

/**
 * Operations Center login — official backoffice gate.
 * EP-002A.1.1: after staff auth, return to Ops Center (or safe returnTo).
 * No public registration. No customer OAuth / phone.
 *
 * BUGFIX-001: bootstrap failures must never leave checkingSession stuck true.
 */
export const Route = createFileRoute("/auth_/admin")({
  validateSearch: (search: Record<string, unknown>) =>
    parseOperationsAuthSearch(search),
  head: () => {
    let instanceName = "YourMeal OS";
    try {
      const host = typeof window !== "undefined" ? window.location.hostname : undefined;
      const config = resolveInstanceRuntimeConfig(host);
      if (config.tenantSlug === "eatclean") {
        instanceName = "EatClean Tenerife";
      }
    } catch {
      // Default to YourMeal OS
    }
    return {
      meta: [
        {
          title: `${tenantCopyEs.backOffice.entryLabel} — ${instanceName}`,
        },
        { name: "robots", content: "noindex" },
      ],
    };
  },
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

async function tryEnterOperationsCenter(userId: string, returnTo?: string) {
  return enterOperationsCenter({
    userId,
    returnTo,
    ensurePlatformOwnerSession,
    loadRoles,
  });
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
  const [bootstrapError, setBootstrapError] =
    useState<ClassifiedAdminAuthError | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // AUTH-SESSION-002: timing only — same awaits / same control flow.
    const trace = createAuthSession002Trace({
      route: "/auth/admin",
      source: "cold_mount",
    });

    void (async () => {
      setCheckingSession(true);
      setBootstrapError(null);
      setNonStaffSession(false);

      let userId: string | null = null;
      try {
        const { data, error: sessionError } = await trace.time("getSession", () =>
          getSession(),
        );
        if (sessionError) throw sessionError;

        const user = data.session?.user;
        if (!user) {
          trace.skip("ensurePlatformOwnerSession", "no_session");
          trace.skip("loadRoles", "no_session");
          return;
        }
        userId = user.id;

        // Same enterOperationsCenter path; wrap deps so ensure/loadRoles are timed.
        const result = await enterOperationsCenter({
          userId: user.id,
          returnTo,
          ensurePlatformOwnerSession: () =>
            trace.time("ensurePlatformOwnerSession", () =>
              ensurePlatformOwnerSession(),
            ),
          loadRoles: (id) => trace.time("loadRoles", () => loadRoles(id)),
        });
        if (cancelled) return;

        if (result.status === "not_staff") {
          setNonStaffSession(true);
          return;
        }

        navigate({ to: result.path as "/admin", replace: true });
      } catch (err) {
        if (cancelled) return;
        const classified = classifyAdminAuthBootstrapError(err);
        reportAdminAuthBootstrapFailure(err, classified, {
          route: "/auth/admin",
          userId,
        });
        setBootstrapError(classified);
        // Do not navigate. Do not treat ensure failure as staff success.
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
        trace.summary({
          cancelled,
          checkingSessionCleared: !cancelled,
          userId,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, returnTo, retryNonce]);

  async function switchAccount() {
    setBusy(true);
    try {
      await signOut();
      setNonStaffSession(false);
      setBootstrapError(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setBootstrapError(null);
    try {
      beginPostLoginPipeline("canonical", { route: "/auth/admin" });
      const { data, error } = await signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      logPostLoginStep("LOGIN_OK", { route: "/auth/admin" });
      const uid = canonicalUserIdFromAuthData(data);
      if (!uid) {
        stopPostLogin("canonical_session_missing_after_signin", {
          route: "/auth/admin",
        });
        throw new Error("Auth session missing");
      }
      logPostLoginStep("CANONICAL_SESSION", {
        userId: uid,
        hasSession: Boolean(data.session),
        source: "signInWithPassword",
        route: "/auth/admin",
      });
      // FCR-008: no getSession() here — data.session is canonical.
      logPostLoginStep("BOOTSTRAP_START", { userId: uid, route: "/auth/admin" });
      const result = await tryEnterOperationsCenter(uid, returnTo);
      if (result.status === "not_staff") {
        stopPostLogin("not_staff", { userId: uid, route: "/auth/admin" });
        setNonStaffSession(true);
        toast.error(t("auth:adminNotStaff"));
        return;
      }
      // HOME_PATH_RESOLVED emitted inside enterOperationsCenter when canonical.
      navigate({ to: result.path as "/admin", replace: true });
      logPostLoginStep("NAVIGATE", {
        userId: uid,
        path: result.path,
        route: "/auth/admin",
      });
      logPostLoginStep("DASHBOARD_RENDERED", {
        userId: uid,
        path: result.path,
        route: "/auth/admin",
      });
    } catch (err) {
      stopPostLogin("auth_admin_submit_error", {
        route: "/auth/admin",
        message: err instanceof Error ? err.message : String(err),
      });
      const classified = classifyAdminAuthBootstrapError(err);
      reportAdminAuthBootstrapFailure(err, classified, {
        route: "/auth/admin",
        userId: null,
      });
      // Credential mistakes stay on the form (toast only). Bootstrap/infra
      // failures also surface the retry panel without granting access.
      if (
        classified.kind === "rpc_missing" ||
        classified.kind === "network" ||
        classified.kind === "forbidden" ||
        classified.kind === "unexpected" ||
        classified.kind === "session"
      ) {
        setBootstrapError(classified);
      }
      toast.error(t(`auth:${classified.messageKey}`));
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
            ) : bootstrapError ? (
              <div className="mt-8 space-y-4 text-center">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`auth:${bootstrapError.messageKey}`)}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setRetryNonce((n) => n + 1)}
                  className="w-full bg-primary text-primary-foreground text-[15px] font-semibold py-3.5 rounded-2xl disabled:opacity-50 hover:opacity-95 transition-opacity"
                >
                  {t("auth:adminBootstrapRetry")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void switchAccount()}
                  className="w-full border border-border/80 bg-white text-[15px] font-semibold py-3.5 rounded-2xl disabled:opacity-50 hover:bg-muted/60 transition-colors"
                >
                  {t("auth:adminSwitchAccount")}
                </button>
              </div>
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
