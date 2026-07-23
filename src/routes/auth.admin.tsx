import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector } from "@/components/language-selector";
import { resolveHomePath } from "@/lib/resolve-home-path";
import { toast } from "sonner";
import {
  PoweredByLine,
  TenantBrandScope,
} from "@/components/tenant/tenant-brand-scope";
import { brandConfig, tenantCopyEs } from "@/tenant/brand-config";

/**
 * EatClean Admin Login — staff only surface.
 * Presentation / navigation entry. Auth + RBAC reuse existing flows.
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
      <div className="min-h-screen grid place-items-center p-4 relative bg-[var(--background)]">
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-md animate-fade-in">
          <div className="rounded-[1.75rem] bg-card border border-border/70 p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-primary/15 text-primary grid place-items-center">
                <Leaf className="size-5" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="font-extrabold tracking-tight">{brandConfig.name}</p>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight mt-6">
              {t("auth:adminTitle")}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {t("auth:adminSubtitle")}
            </p>

            <form onSubmit={submit} className="grid gap-3 mt-8">
              <input
                type="email"
                required
                autoComplete="username"
                placeholder={t("common:email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-border rounded-xl px-4 py-3.5 text-sm bg-background"
              />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder={t("common:password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-border rounded-xl px-4 py-3.5 text-sm bg-background"
              />
              <button
                type="submit"
                disabled={busy}
                className="bg-primary text-primary-foreground text-sm font-bold py-3.5 rounded-xl disabled:opacity-50 mt-1"
              >
                {t("auth:adminEnter")}
              </button>
            </form>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <PoweredByLine />
            <Link
              to="/auth"
              className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
            >
              {t("auth:backToCustomerLogin")}
            </Link>
          </div>
        </div>
      </div>
    </TenantBrandScope>
  );
}
