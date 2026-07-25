import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { getUser, onAuthStateChange } from "@/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  getFormatter,
  mergeSettings,
  type Formatter,
  type LocalizationSettings,
} from "@/lib/localization";
import {
  getRegionalDefaults,
  inferCountryFromLocale,
  type RegionalDefaults,
} from "@/i18n/regional-defaults";
import { isSupportedLanguage, type LanguageCode } from "@/i18n/languages";

type ProfileRegional = {
  locale: string | null;
  country: string | null;
  currency: string | null;
  timezone: string | null;
  time_format: string | null;
  unit_weight: string | null;
  unit_volume: string | null;
  unit_distance: string | null;
  unit_temperature: string | null;
};

type TenantRegional = {
  locale_default: string | null;
  country: string | null;
  currency: string | null;
  timezone: string | null;
  time_format: string | null;
  unit_weight: string | null;
  unit_volume: string | null;
  unit_distance: string | null;
  unit_temperature: string | null;
};

type Ctx = {
  settings: LocalizationSettings;
  fmt: Formatter;
  refresh: () => void;
};

const REGIONAL_COLS =
  "country, currency, timezone, time_format, unit_weight, unit_volume, unit_distance, unit_temperature";

const LocalizationContext = createContext<Ctx | null>(null);

function toCamel(
  row: ProfileRegional | TenantRegional | null,
): Partial<Record<keyof LocalizationSettings, string | null>> {
  if (!row) return {};
  return {
    language: ("locale" in row ? row.locale : row.locale_default) ?? undefined,
    country: row.country,
    currency: row.currency,
    timezone: row.timezone,
    timeFormat: row.time_format,
    unitWeight: row.unit_weight,
    unitVolume: row.unit_volume,
    unitDistance: row.unit_distance,
    unitTemperature: row.unit_temperature,
  } as Partial<Record<keyof LocalizationSettings, string | null>>;
}

function browserDefaults(fallbackLanguage: LanguageCode): RegionalDefaults {
  const nav = typeof navigator !== "undefined" ? navigator.language : undefined;
  const country = inferCountryFromLocale(nav);
  const base = getRegionalDefaults(country);
  return { ...base, language: fallbackLanguage };
}

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [userRow, setUserRow] = useState<ProfileRegional | null>(null);
  const [tenantRow, setTenantRow] = useState<TenantRegional | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: auth } = await getUser();
      if (!auth.user) {
        if (!cancelled) {
          setUserRow(null);
          setTenantRow(null);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select(`locale, ${REGIONAL_COLS}`)
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!cancelled) setUserRow((profile as ProfileRegional) ?? null);

      const { data: member } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!member?.tenant_id) {
        if (!cancelled) setTenantRow(null);
        return;
      }
      const { data: tenant } = await supabase
        .from("tenants")
        .select(`locale_default, ${REGIONAL_COLS}`)
        .eq("id", member.tenant_id)
        .maybeSingle();
      if (!cancelled) setTenantRow((tenant as TenantRegional) ?? null);
    }

    load();
    const { data: sub } = onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT" || e === "USER_UPDATED") load();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [tick]);

  const value = useMemo<Ctx>(() => {
    const activeLang: LanguageCode = isSupportedLanguage(i18n.resolvedLanguage)
      ? i18n.resolvedLanguage
      : "en";

    const user = toCamel(userRow);
    const tenant = toCamel(tenantRow);

    // Country preset order: user country → tenant country → browser → fallback
    const countryHint =
      user.country ?? tenant.country ?? inferCountryFromLocale(navigator?.language);
    const preset = countryHint
      ? { ...getRegionalDefaults(countryHint), language: activeLang }
      : browserDefaults(activeLang);

    // Language always follows the active i18n language (already synced from
    // profile by `useLanguageSync`), so it wins over stored fields here.
    const settings = mergeSettings(
      { ...user, language: activeLang },
      tenant,
      preset,
    );

    return {
      settings,
      fmt: getFormatter(settings),
      refresh: () => setTick((n) => n + 1),
    };
  }, [userRow, tenantRow, i18n.resolvedLanguage]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): Ctx {
  const ctx = useContext(LocalizationContext);
  if (!ctx) {
    throw new Error(
      "useLocalization must be used inside <LocalizationProvider>",
    );
  }
  return ctx;
}

/** Shorthand: `const fmt = useFmt();  fmt.currency(12.5)` */
export function useFmt(): Formatter {
  return useLocalization().fmt;
}
