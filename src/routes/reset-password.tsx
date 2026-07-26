import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { updatePassword } from "@/auth";
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

function ResetPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("auth:passwordUpdated"));
      navigate({ to: "/app", replace: true });
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-secondary/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-card border border-border rounded-3xl p-8 grid gap-4"
      >
        <p className="meta-label">Recovery</p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t("auth:resetPassword")}
        </h1>
        <input
          type="password"
          required
          placeholder={t("auth:newPassword")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-border rounded-lg px-4 py-3 text-sm bg-background"
        />
        <button
          disabled={busy}
          className="bg-foreground text-background text-sm font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {t("auth:updatePassword")}
        </button>
      </form>
    </div>
  );
}
