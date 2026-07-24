import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { resolveHomePath } from "@/lib/resolve-home-path";
import { toast } from "sonner";
import {
  PoweredByLine,
  TenantBrandScope,
} from "@/components/tenant/tenant-brand-scope";

import { TenantLogo } from "@/components/tenant/tenant-logo";
import { BrandLeafMark } from "@/components/tenant/brand-leaf-mark";
import { QuietLocaleSwitch } from "@/components/tenant/quiet-locale-switch";
import { brandConfig, tenantCopyEs } from "@/tenant/brand-config";
import { PrimaryCTA } from "@/components/consumer";
import splashImage from "@/assets/eatclean-splash.jpg";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Iniciar sesión — ${brandConfig.name}` },
      {
        name: "description",
        content: `Accede a tu cuenta de ${brandConfig.name} para programar tu pedido semanal de comida preparada saludable.`,
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Tab = "email" | "phone";
type Phase = "splash" | "onboarding" | "login";

const ONBOARDING_KEY = "tenant_onboarding_done";

const authInputClass =
  "w-full border border-border/80 rounded-2xl bg-white pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors";

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
    <TenantBrandScope className="min-h-screen font-[family-name:var(--font-tenant-body,Open_Sans,sans-serif)]">
      <div
        className={cn(
          "min-h-screen relative grid place-items-center p-5 sm:p-8",
          phase === "login" ? "overflow-hidden" : "bg-[var(--background)]",
        )}
        style={
          {
            "--font-tenant-display": `"${brandConfig.typography.display}", sans-serif`,
            "--font-tenant-body": `"${brandConfig.typography.body}", sans-serif`,
          } as CSSProperties
        }
      >
        {phase === "login" ? (
          <>
            <img
              src={splashImage}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(247,245,241,0.72) 0%, rgba(247,245,241,0.88) 45%, rgba(247,245,241,0.94) 100%)",
              }}
            />
          </>
        ) : null}

        <div className="absolute top-5 right-5 md:top-7 md:right-7 z-20">
          <QuietLocaleSwitch />
        </div>

        {phase === "splash" ? (
          <div className="w-full max-w-md animate-fade-in flex flex-col items-center gap-10 text-center px-6 relative z-10">
            <TenantLogo height={64} />
            <div>
              <p
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-tenant-display)" }}
              >
                {brandConfig.name}
              </p>
              <p className="text-sm text-muted-foreground mt-3 max-w-xs leading-relaxed font-normal">
                {tenantCopyEs.claims.enjoy}
              </p>
            </div>
            <PoweredByLine className="mt-4" />
          </div>
        ) : null}

        {phase === "onboarding" ? (
          <div className="w-full max-w-md animate-fade-in relative z-10">
            <div className="rounded-[1.75rem] bg-card border border-border/50 p-8 sm:p-10 shadow-sm min-h-[28rem] flex flex-col">
              <TenantLogo height={50} className="mb-8" />
              <h1
                className="text-[1.75rem] font-bold tracking-tight text-balance leading-snug"
                style={{ fontFamily: "var(--font-tenant-display)" }}
              >
                {onboardingSlides[onboardingStep]?.title}
              </h1>
              <p className="text-[15px] text-muted-foreground mt-4 leading-[1.7] text-pretty flex-1 font-normal">
                {onboardingSlides[onboardingStep]?.body}
              </p>
              <div className="flex gap-2 my-8">
                {onboardingSlides.map((_, i) => (
                  <div
                    key={i}
                    className={
                      "h-1.5 flex-1 rounded-full transition-colors " +
                      (i <= onboardingStep ? "attention-dot" : "bg-muted")
                    }
                  />
                ))}
              </div>
              <PrimaryCTA
                trailingIcon={onboardingStep < onboardingSlides.length - 1}
                className="!rounded-2xl !h-14 !normal-case !tracking-normal !text-[15px] hover:!opacity-95"
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
            <PoweredByLine className="mt-8" />
          </div>
        ) : null}

        {phase === "login" ? (
          <div className="w-full max-w-[26rem] animate-fade-in relative z-10 py-6">
            <div className="rounded-[1.75rem] bg-white/95 backdrop-blur-[2px] border border-white/60 p-8 sm:p-10 shadow-[0_20px_50px_-28px_rgba(15,35,23,0.35)]">
              <div className="flex justify-center pt-2">
                <TenantLogo height={72} />
              </div>

              <h1
                className="text-[1.65rem] font-bold tracking-tight mt-16 text-center text-balance leading-snug"
                style={{ fontFamily: "var(--font-tenant-display)" }}
              >
                {t("auth:welcome")}
              </h1>
              <p className="text-[15px] text-muted-foreground mt-3 text-center leading-[1.7] font-normal max-w-[22rem] mx-auto">
                {t("auth:welcomeSub")}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-1 bg-muted/80 p-1 rounded-2xl">
                {(["email", "phone"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className={
                      "relative text-xs font-semibold py-2.5 rounded-xl transition-colors " +
                      (tab === k
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground")
                    }
                  >
                    {t(`auth:tabs.${k}`)}
                    {tab === k ? (
                      <span
                        className="absolute left-1/2 -translate-x-1/2 bottom-1 h-0.5 w-6 rounded-full attention-dot"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="mt-7">
                {tab === "email" ? <EmailForm /> : <PhoneForm />}
              </div>

              <div className="mt-8 flex items-center gap-3">
                <div className="h-px flex-1 bg-border/80" />
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
                  {t("common:or")}
                </span>
                <div className="h-px flex-1 bg-border/80" />
              </div>

              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const r = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: window.location.origin,
                    });
                    if (r.error) toast.error(r.error.message);
                  }}
                  className="border border-border/80 bg-white text-sm font-semibold py-3.5 rounded-2xl hover:bg-muted/60 transition-colors"
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
                  className="border border-border/80 bg-white text-sm font-semibold py-3.5 rounded-2xl hover:bg-muted/60 transition-colors"
                >
                  {t("auth:withApple")}
                </button>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-5">
              <BrandLeafMark className="text-[11px] tracking-[0.08em] underline-offset-4 hover:underline" />
              <PoweredByLine />
            </div>
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
    <form onSubmit={submit} className="grid gap-4">
      {mode === "signup" ? (
        <input
          placeholder={t("auth:fullName")}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={cn(authInputClass, "!pl-4")}
        />
      ) : null}
      <label className="relative block">
        <Mail
          className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          type="email"
          required
          placeholder={t("common:email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={authInputClass}
        />
      </label>
      <label className="relative block">
        <Lock
          className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          type="password"
          required
          placeholder={t("common:password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={authInputClass}
        />
      </label>
      <button
        disabled={busy}
        className="mt-1 bg-primary text-primary-foreground text-[15px] font-semibold py-3.5 rounded-2xl disabled:opacity-50 hover:opacity-95 transition-opacity"
      >
        {mode === "signin" ? t("common:signIn") : t("common:signUp")}
      </button>
      <div className="flex items-center justify-between text-xs pt-1">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? t("common:signUp") : t("common:signIn")}
        </button>
        {mode === "signin" ? (
          <button
            type="button"
            onClick={forgot}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("auth:forgotPassword")}
          </button>
        ) : null}
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
    <div className="grid gap-4">
      <label className="relative block">
        <Phone
          className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          type="tel"
          placeholder="+34 600 000 000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={authInputClass}
        />
      </label>
      {sent ? (
        <input
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={cn(authInputClass, "!pl-4 font-mono tracking-widest")}
        />
      ) : null}
      <button
        type="button"
        onClick={sent ? verify : sendCode}
        disabled={busy}
        className="bg-primary text-primary-foreground text-[15px] font-semibold py-3.5 rounded-2xl disabled:opacity-50 hover:opacity-95 transition-opacity"
      >
        {sent ? t("auth:verifyCode") : t("auth:sendCode")}
      </button>
    </div>
  );
}
