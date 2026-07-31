import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getUser, onAuthStateChange } from "@/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  hydrateUiLanguage,
  isSupportedLanguage,
  persistUiLanguage,
} from "@/i18n";
import type { LanguageCode } from "@/i18n/languages";

/**
 * Syncs the interface language with the authenticated user's profile.
 *
 * - Hydrates stored language via StorageProvider (M-04).
 * - On sign-in, if the profile has a saved locale, apply it.
 * - If the profile has no locale, fall back to the user's tenant default.
 * - Persists preference so it survives sign-out / app restart.
 *
 * Mount once at the root (inside providers). Safe to run on public routes.
 */
export function useLanguageSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    void hydrateUiLanguage((lng) => i18n.changeLanguage(lng));

    async function apply(code: string | null | undefined) {
      if (cancelled || !code || !isSupportedLanguage(code)) return;
      if (i18n.resolvedLanguage === code) return;
      await i18n.changeLanguage(code);
      document.documentElement.setAttribute("lang", code);
      await persistUiLanguage(code);
    }

    async function loadForUser(userId: string) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("locale")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.locale) {
        await apply(profile.locale as LanguageCode);
        return;
      }

      // No profile locale — fall back to tenant default.
      const { data: member } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!member?.tenant_id) return;

      const { data: tenant } = await supabase
        .from("tenants")
        .select("locale_default")
        .eq("id", member.tenant_id)
        .maybeSingle();

      if (tenant?.locale_default) await apply(tenant.locale_default);
    }

    getUser().then(({ data }) => {
      if (data.user) loadForUser(data.user.id);
    });

    const { data: sub } = onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) loadForUser(session.user.id);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [i18n]);
}
