import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { LanguageSelector } from "@/components/language-selector";

export const Route = createFileRoute("/_authenticated/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation(["customer", "common"]);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const groups: Array<[string, string[]]> = [
    ["Account", ["profile", "addresses", "phones"]],
    ["Billing", ["payment", "invoices", "orderHistory"]],
    ["Food", ["allergies", "preferences"]],
  ];

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 pt-10 pb-6">
        <p className="meta-label">{t("common:tenant")}</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          {t("customer:settings")}
        </h1>
      </header>
      <div className="px-6 space-y-6 pb-6">
        {groups.map(([title, keys]) => (
          <div key={title}>
            <p className="meta-label mb-2">{title}</p>
            <div className="bg-card border border-border rounded-2xl divide-y divide-border">
              {keys.map((k) => (
                <button
                  key={k}
                  className="w-full text-left px-4 py-4 text-sm font-medium hover:bg-secondary/60"
                >
                  {t(`customer:${k}`)}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="meta-label mb-2">{t("customer:language")}</p>
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium">
              {t("common:selectLanguage")}
            </span>
            <LanguageSelector />
          </div>
        </div>

        <button
          onClick={signOut}
          className="w-full border border-border bg-card py-3 rounded-lg text-sm font-bold text-destructive"
        >
          {t("common:signOut")}
        </button>
      </div>
    </div>
  );
}
