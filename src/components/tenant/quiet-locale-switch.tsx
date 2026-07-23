import { useTranslation } from "react-i18next";
import { LANGUAGES, type LanguageCode, getLanguage } from "@/i18n/languages";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Quiet ES / EN switch — brand-aligned, no chrome.
 * Auth surfaces only.
 */
export function QuietLocaleSwitch({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current =
    getLanguage(i18n.resolvedLanguage ?? i18n.language)?.code ?? "es";

  async function pick(code: LanguageCode) {
    if (code === current) return;
    await i18n.changeLanguage(code);
    document.documentElement.setAttribute("lang", code);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("profiles").update({ locale: code }).eq("id", data.user.id);
    }
  }

  const codes = LANGUAGES.filter((l) => l.code === "es" || l.code === "en");

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {codes.map((lng, i) => (
        <span key={lng.code} className="inline-flex items-center gap-1.5">
          {i > 0 ? (
            <span className="text-[#9a8f7c]/50" aria-hidden>
              /
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void pick(lng.code)}
            className={cn(
              "uppercase transition-colors",
              current === lng.code
                ? "text-primary"
                : "text-[#9a8f7c]/70 hover:text-primary/80",
            )}
          >
            {lng.code}
          </button>
        </span>
      ))}
    </div>
  );
}
