import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — YourMeal OS" },
      { name: "description", content: "Sign in to your YourMeal OS operation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Tab = "email" | "phone";

function AuthPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("email");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-secondary/40 p-4">
      <div className="w-full max-w-md bg-card ring-1 ring-black/[0.03] border border-border rounded-3xl p-8 shadow-sm">
        <Link to="/" className="meta-label">
          ← YourMeal OS
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight mt-4">
          {t("auth:welcome")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("auth:welcomeSub")}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 bg-secondary/60 p-1 rounded-lg">
          {(["email", "phone"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={
                "text-xs font-bold uppercase tracking-widest py-2 rounded-md transition-colors " +
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
            onClick={async () => {
              const r = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (r.error) toast.error(r.error.message);
            }}
            className="border border-border bg-card text-sm font-bold py-3 rounded-lg hover:bg-secondary/60 transition-colors"
          >
            {t("auth:withGoogle")}
          </button>
          <button
            onClick={async () => {
              const r = await lovable.auth.signInWithOAuth("apple", {
                redirect_uri: window.location.origin,
              });
              if (r.error) toast.error(r.error.message);
            }}
            className="border border-border bg-card text-sm font-bold py-3 rounded-lg hover:bg-secondary/60 transition-colors"
          >
            {t("auth:withApple")}
          </button>
        </div>
      </div>
    </div>
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
        navigate({ to: "/app", replace: true });
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
          className="border border-border rounded-lg px-4 py-3 text-sm bg-background"
        />
      )}
      <input
        type="email"
        required
        placeholder={t("common:email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-border rounded-lg px-4 py-3 text-sm bg-background"
      />
      <input
        type="password"
        required
        placeholder={t("common:password")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border border-border rounded-lg px-4 py-3 text-sm bg-background"
      />
      <button
        disabled={busy}
        className="bg-foreground text-background text-sm font-bold py-3 rounded-lg disabled:opacity-50"
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
    else navigate({ to: "/app", replace: true });
  }

  return (
    <div className="grid gap-3">
      <input
        type="tel"
        placeholder="+34 600 000 000"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="border border-border rounded-lg px-4 py-3 text-sm bg-background"
      />
      {sent && (
        <input
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border border-border rounded-lg px-4 py-3 text-sm bg-background font-mono tracking-widest"
        />
      )}
      <button
        onClick={sent ? verify : sendCode}
        disabled={busy}
        className="bg-foreground text-background text-sm font-bold py-3 rounded-lg disabled:opacity-50"
      >
        {sent ? t("auth:verifyCode") : t("auth:sendCode")}
      </button>
    </div>
  );
}
