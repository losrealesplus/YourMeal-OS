import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSession, handleAuthCallback, updatePassword } from "@/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — YourMeal OS" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

type BootState = "loading" | "ready" | "invalid";

function ResetPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [boot, setBoot] = useState<BootState>("loading");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const href = window.location.href;
        const url = new URL(href);
        const hasCode = Boolean(url.searchParams.get("code"));
        const hasHashToken =
          url.hash.includes("access_token") || url.hash.includes("type=recovery");

        // Defensive: older emails may still redirect straight here with ?code= / hash.
        if (hasCode || hasHashToken) {
          await handleAuthCallback(href);
        }

        const { data, error } = await getSession();
        if (cancelled) return;
        if (error || !data.session?.user) {
          setBoot("invalid");
          return;
        }
        setBoot("ready");
      } catch {
        if (!cancelled) setBoot("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t("auth:passwordTooWeak"));
      return;
    }
    setBusy(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t("auth:passwordUpdated"));
      navigate({ to: "/auth", replace: true });
    } finally {
      setBusy(false);
    }
  }

  if (boot === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-secondary/40 p-4">
        <p className="text-sm text-muted-foreground">{t("auth:recoveryPreparing")}</p>
      </div>
    );
  }

  if (boot === "invalid") {
    return (
      <div className="min-h-screen grid place-items-center bg-secondary/40 p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 grid gap-4 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {t("auth:resetPassword")}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("auth:recoveryLinkInvalid")}
          </p>
          <Link
            to="/auth"
            className="bg-foreground text-background text-sm font-bold py-3 rounded-lg"
          >
            {t("common:signIn")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-secondary/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-card border border-border rounded-3xl p-8 grid gap-4"
      >
        <p className="meta-label">{t("auth:recoveryLabel")}</p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t("auth:resetPassword")}
        </h1>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder={t("auth:newPassword")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-border rounded-lg px-4 py-3 text-sm bg-background"
        />
        <button
          disabled={busy}
          className="bg-foreground text-background text-sm font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {busy ? t("common:loading") : t("auth:updatePassword")}
        </button>
      </form>
    </div>
  );
}
