import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { handleAuthCallback } from "@/auth";
import { resolveHomePath } from "@/lib/resolve-home-path";
import { toast } from "sonner";
import {
  PoweredByLine,
  TenantBrandScope,
} from "@/components/tenant/tenant-brand-scope";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { brandConfig } from "@/tenant/brand-config";

/**
 * OAuth / PKCE return — Supabase Auth only (INFRA-003).
 * No Lovable `/~oauth/initiate` broker.
 */
export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Signing in — ${brandConfig.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const [message, setMessage] = useState(t("common:loading"));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await handleAuthCallback(window.location.href);
      if (cancelled) return;
      if (result.error || !result.userId) {
        const msg = result.error?.message ?? t("auth:welcome");
        toast.error(msg);
        setMessage(msg);
        navigate({ to: "/auth", replace: true });
        return;
      }
      const path = await resolveHomePath(result.userId);
      if (!cancelled) navigate({ to: path as "/app", replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, t]);

  return (
    <TenantBrandScope className="min-h-screen grid place-items-center p-6 bg-[var(--background)]">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <TenantLogo height={56} />
        <p className="text-sm text-muted-foreground">{message}</p>
        <PoweredByLine />
      </div>
    </TenantBrandScope>
  );
}
