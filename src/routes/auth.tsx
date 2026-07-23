import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { LanguageSelector } from "@/components/language-selector";
import { resolveHomePath } from "@/lib/resolve-home-path";
import { toast } from "sonner";
import {
  PoweredByLine,
  TenantBrandScope,
} from "@/components/tenant/tenant-brand-scope";
import { brandConfig } from "@/tenant/brand-config";
import { PrimaryCTA } from "@/components/consumer";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `${brandConfig.name} — ${brandConfig.storeAssets.shortDescription}` },
      {
        name: "description",
        content: brandConfig.storeAssets.shortDescription,
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Tab = "email" | "phone";
type Phase = "splash" | "onboarding" | "login";

const ONBOARDING_KEY = "tenant_onboarding_done";

async function goHome(
  navigate: ReturnType<typeof useNavigate>,
  userId: string,
) {
  const path = await resolveHomePath(userId);
  navigate({ to: path as "/app", replace: true });
}

function AuthPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("email");
  const [phase, setPhase] = useState<Phase>("splash");
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        await goHome(navigate, data.session.user.id);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (phase !== "splash") return;
    const id = window.setTimeout(() => {
      const done = localStorage.getItem(ONBOARDING_KEY) === "1";
      setPhase(done ? "login" : "onboarding");
    }, 1600);
    return () => window.clearTimeout(id);
  }, [phase]);

  const onboardingSlides = [
    {
      title: t("auth:onboarding1Title"),
      body: t("auth:onboarding1Body"),
    },
    {
      title: t("auth:onboarding2Title"),
      body: t("auth:onboarding2Body"),
    },
    {
      title: t("auth:onboarding3Title"),
      body: t("auth:onboarding3Body"),
    },
  ];

  return (
    <TenantBrandScope className="min-h-screen">
      <div className="min-h-screen grid place-items-center p-4 relative bg-[var(--background)]">
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
          <LanguageSelector />
        </div>

        {phase === "splash" ? (
          <div className="flex flex-col items-center gap-6 animate-fade-in text-center px-6">
            <div className="size-20 rounded-[1.5rem] bg-primary text-primary-foreground grid place-items-center text-2xl font-extrabold tracking-tight shadow-lg">
              EC
            </div>
            <div>
              <p className="text-2xl font-extrabold tracking-tight">{brandConfig.name}</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                {brandConfig.storeAssets.shortDescription}
              </p>
            </div>
            <PoweredByLine className="mt-8" />
          </div>
        ) : null}

        {phase === "onboarding" ? (
          <div className="w-full max-w-md animate-fade-in">
            <div className="rounded-[1.75rem] bg-card border border-border/70 p-8 shadow-sm min-h-[28rem] flex flex-col">
              <p className="meta-label text-primary">{brandConfig.name}</p>
              <h1 className="text-3xl font-extrabold tracking-tight mt-4 text-balance">
                {onboardingSlides[onboardingStep]?.title}
              </h1>
              <p className="text-base text-muted-foreground mt-4 leading-relaxed text-pretty flex-1">
                {onboardingSlides[onboardingStep]?.body}
              </p>
              <div className="flex gap-2 my-6">
                {onboardingSlides.map((_, i) => (
                  <div
                    key={i}
                    className={
                      "h-1.5 flex-1 rounded-full " +
                      (i <= onboardingStep ? "bg-primary" : "bg-secondary")
                    }
                  />
                ))}
              </div>
              <PrimaryCTA
                trailingIcon={onboardingStep < onboardingSlides.length - 1}
                onClick={() => {
                  if (onboardingStep < onboardingSlides.length - 1) {
                    setOnboardingStep((s) => s + 1);
                    return;
                  }
                  localStorage.setItem(ONBOARDING_KEY, "1");
                  setPhase("login");
                }}
              >
                {onboardingStep < onboardingSlides.length - 1
                  ? t("common:continue")
                  : t("auth:startNow")}
              </PrimaryCTA>
            </div>
            <PoweredByLine className="mt-6" />
          </div>
        ) : null}

        {phase === "login" ? (
          <div className="w-full max-w-md animate-fade-in">
            <div className="rounded-[1.75rem] bg-card border border-border/70 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center text-sm font-extrabold">
                  EC
                </div>
                <p className="font-extrabold tracking-tight">{brandConfig.name}</p>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight mt-6">
                {t("auth:welcome")}
              </h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {t("auth:welcomeSub")}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2 bg-secondary/60 p-1 rounded-xl">
                {(["email", "phone"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className={
                      "text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors " +
                      (tab === k
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground")
                    }
                  >
                    {t(`auth:tabs.${k}`)}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                {tab === "email" ? <EmailForm /> : <PhoneForm />}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="meta-label">{t("common:or")}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="mt-6 grid gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const r = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: window.location.origin,
                    });
                    if (r.error) toast.error(r.error.message);
                  }}
                  className="border border-border bg-card text-sm font-bold py-3 rounded-xl hover:bg-secondary/60 transition-colors"
                >
                  {t("auth:withGoogle")}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const r = await lovable.auth.signInWithOAuth("apple", {
                      redirect_uri: window.location.origin,
                    });
                    if (r.error) toast.error(r.error.message);
                  }}
                  className="border border-border bg-card text-sm font-bold py-3 rounded-xl hover:bg-secondary/60 transition-colors"
                >
                  {t("auth:withApple")}
                </button>
              </div>
            </div>
            <PoweredByLine className="mt-6" />
          </div>
        ) : null}
      </div>
    </TenantBrandScope>
  );
}

function EmailForm() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user?.id;
        if (uid) await goHome(navigate, uid);
        else navigate({ to: "/app", replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success(t("auth:checkEmail"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email) {
      toast.error(t("common:email"));
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success(t("auth:resetSent"));
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      {mode === "signup" && (
        <input
          placeholder={t("auth:fullName")}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border border-border rounded-xl px-4 py-3.5 text-sm bg-background"
        />
      )}
      <input
        type="email"
        required
        placeholder={t("common:email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-border rounded-xl px-4 py-3.5 text-sm bg-background"
      />
      <input
        type="password"
        required
        placeholder={t("common:password")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border border-border rounded-xl px-4 py-3.5 text-sm bg-background"
      />
      <button
        disabled={busy}
        className="bg-primary text-primary-foreground text-sm font-bold py-3.5 rounded-xl disabled:opacity-50"
      >
        {mode === "signin" ? t("common:signIn") : t("common:signUp")}
      </button>
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? t("common:signUp") : t("common:signIn")}
        </button>
        {mode === "signin" && (
          <button
            type="button"
            onClick={forgot}
            className="text-muted-foreground hover:text-foreground"
          >
            {t("auth:forgotPassword")}
          </button>
        )}
      </div>
    </form>
  );
}

function PhoneForm() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      setSent(true);
      toast.success(t("auth:codeSent"));
    }
  }
  async function verify() {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (uid) await goHome(navigate, uid);
      else navigate({ to: "/app", replace: true });
    }
  }

  return (
    <div className="grid gap-3">
      <input
        type="tel"
        placeholder="+34 600 000 000"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="border border-border rounded-xl px-4 py-3.5 text-sm bg-background"
      />
      {sent && (
        <input
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border border-border rounded-xl px-4 py-3.5 text-sm bg-background font-mono tracking-widest"
        />
      )}
      <button
        type="button"
        onClick={sent ? verify : sendCode}
        disabled={busy}
        className="bg-primary text-primary-foreground text-sm font-bold py-3.5 rounded-xl disabled:opacity-50"
      >
        {sent ? t("auth:verifyCode") : t("auth:sendCode")}
      </button>
    </div>
  );
}
