import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Globe } from "lucide-react";
import { getUser } from "@/auth";
import { persistUiLanguage } from "@/i18n";
import { LANGUAGES, type LanguageCode, getLanguage } from "@/i18n/languages";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Variant = "default" | "compact";

export function LanguageSelector({
  variant = "default",
  align = "right",
}: {
  variant?: Variant;
  align?: "left" | "right";
}) {
  const { i18n, t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const current = getLanguage(i18n.resolvedLanguage ?? i18n.language) ?? LANGUAGES[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function pick(code: LanguageCode) {
    setOpen(false);
    if (code === i18n.resolvedLanguage) return;
    await i18n.changeLanguage(code);
    document.documentElement.setAttribute("lang", code);
    await persistUiLanguage(code);
    // Persist to profile if signed in — non-blocking, silent on failure.
    const { data } = await getUser();
    if (data.user) {
      await supabase
        .from("profiles")
        .update({ locale: code })
        .eq("id", data.user.id);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("selectLanguage")}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border bg-card text-foreground",
          "transition-colors hover:bg-secondary/60",
          variant === "compact"
            ? "px-2.5 py-1.5 text-xs"
            : "px-3 py-2 text-xs font-semibold uppercase tracking-widest",
        )}
      >
        <span className="text-base leading-none">{current.flag}</span>
        {variant === "default" ? (
          <span className="font-bold">{current.code.toUpperCase()}</span>
        ) : (
          <Globe className="size-3.5 opacity-60" strokeWidth={2.25} />
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg ring-1 ring-black/[0.04]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {LANGUAGES.map((lng) => {
            const active = lng.code === current.code;
            return (
              <button
                key={lng.code}
                role="option"
                aria-selected={active}
                onClick={() => pick(lng.code)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  active ? "bg-secondary" : "hover:bg-secondary/60",
                )}
              >
                <span className="text-base leading-none">{lng.flag}</span>
                <span className="flex-1 font-medium">{lng.name}</span>
                {active && <Check className="size-4 text-primary" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
