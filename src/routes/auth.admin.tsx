import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveHomePath } from "@/lib/resolve-home-path";
import { toast } from "sonner";
import {
  PoweredByLine,
  TenantBrandScope,
} from "@/components/tenant/tenant-brand-scope";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { QuietLocaleSwitch } from "@/components/tenant/quiet-locale-switch";
import { brandConfig, tenantCopyEs } from "@/tenant/brand-config";

/**
 * Operations Center login — staff only surface.
 * Footer link on customer Login opens this screen; protection is auth + RBAC.
 * No public registration. No customer OAuth / phone.
 */
export const Route = createFileRoute("/auth/admin")({
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
  "w-full border border-border/80 rounded-2xl bg-white pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-[#9a8f7c]/75 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors";

async function goHome(
  navigate: ReturnType<typeof useNavigate>,
  userId: string,
) {
  const path = await resolveHomePath(userId);
  navigate({ to: path as "/admin", replace: true });
}

function AdminAuthPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        await goHome(navigate, data.session.user.id);
      }
    });
  }, [navigate]);

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
      if (uid) await goHome(navigate, uid);
      else navigate({ to: "/admin", replace: true });
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

            <form onSubmit={submit} className="grid gap-4 mt-8">
              <label className="relative block">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#9a8f7c]/80"
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
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#9a8f7c]/80"
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
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <PoweredByLine />
            <Link
              to="/auth"
              className="text-xs text-[#9a8f7c]/80 hover:text-foreground transition-colors"
            >
              {t("auth:backToCustomerLogin")}
            </Link>
          </div>
        </div>
      </div>
    </TenantBrandScope>
  );
}
