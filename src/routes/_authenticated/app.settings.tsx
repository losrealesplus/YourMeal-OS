import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  User as UserIcon,
  MapPin,
  Phone,
  CreditCard,
  FileText,
  History,
  Leaf,
  Bell,
  HelpCircle,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSelector } from "@/components/language-selector";
import { ScreenHeader, PrimaryCTA } from "@/components/consumer";

/**
 * Screen: Customer · Account / Profile Hub
 * - Objetivo operacional: gestión propia (preferencias · datos · logout).
 * - Capability: profile.manage
 * - Core Object(s): CustomerProfile
 */
export const Route = createFileRoute("/_authenticated/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation(["customer", "common"]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const groups: Array<{
    title: string;
    items: Array<{ key: string; icon: React.ReactNode; to?: string }>;
  }> = [
    {
      title: t("customer:groupAccount"),
      items: [
        { key: "profile", icon: <UserIcon className="size-4" />, to: "/app/settings/profile" },
        { key: "onboarding", icon: <UserIcon className="size-4" />, to: "/app/onboarding" },
        { key: "companyPortal", icon: <UserIcon className="size-4" />, to: "/app/company" },
        { key: "addresses", icon: <MapPin className="size-4" />, to: "/app/addresses" },
        { key: "phones", icon: <Phone className="size-4" /> },
      ],
    },
    {
      title: t("customer:groupBilling"),
      items: [
        { key: "payment", icon: <CreditCard className="size-4" />, to: "/app/payment-methods" },
        { key: "invoices", icon: <FileText className="size-4" /> },
        { key: "orderHistory", icon: <History className="size-4" />, to: "/app/orders" },
      ],
    },
    {
      title: t("customer:groupFood"),
      items: [
        { key: "allergies", icon: <Leaf className="size-4" /> },
        { key: "preferences", icon: <Leaf className="size-4" />, to: "/app/favorites" },
      ],
    },
    {
      title: t("customer:groupApp"),
      items: [
        { key: "notifications", icon: <Bell className="size-4" /> },
        { key: "help", icon: <HelpCircle className="size-4" /> },
        { key: "about", icon: <Info className="size-4" /> },
      ],
    },
  ];

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    "";

  return (
    <div className="flex-1 flex flex-col pb-6">
      <ScreenHeader
        overline={t("common:tenant")}
        title={t("customer:settings")}
      />

      {/* Profile card */}
      <div className="px-6">
        <div className="surface-raised border border-border/60 rounded-3xl p-5 flex items-center gap-4">
          <div className="grid place-items-center size-14 rounded-2xl hero-emerald text-primary-foreground text-lg font-extrabold shrink-0">
            {(displayName || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold truncate">{displayName || "—"}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6 mt-6">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-3 w-0.5 rounded-full bg-primary/70" aria-hidden />
              <p className="meta-label">{group.title}</p>
            </div>
            <div className="surface-raised border border-border/60 rounded-3xl overflow-hidden divide-y divide-border/60">
              {group.items.map((item) => {
                const body = (
                  <div className="w-full flex items-center gap-3 px-4 py-4">
                    <span className="grid place-items-center size-9 rounded-xl bg-secondary text-muted-foreground shrink-0">
                      {item.icon}
                    </span>
                    <span className="flex-1 text-sm font-semibold truncate">
                      {t(`customer:${item.key}`)}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                );
                return item.to ? (
                  <Link key={item.key} to={item.to} className="block transition-colors hover:bg-secondary/50 active:bg-secondary">
                    {body}
                  </Link>
                ) : (
                  <button
                    key={item.key}
                    type="button"
                    className="w-full text-left transition-colors hover:bg-secondary/50 active:bg-secondary"
                  >
                    {body}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-3 w-0.5 rounded-full bg-primary/70" aria-hidden />
            <p className="meta-label">{t("customer:language")}</p>
          </div>
          <div className="surface-raised border border-border/60 rounded-3xl p-4 flex items-center justify-between">
            <span className="text-sm font-semibold">
              {t("common:selectLanguage")}
            </span>
            <LanguageSelector />
          </div>
        </div>

        <PrimaryCTA variant="outline" onClick={signOut}>
          <span className="text-destructive">{t("common:signOut")}</span>
        </PrimaryCTA>
      </div>
    </div>
  );
}
