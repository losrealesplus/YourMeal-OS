import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BOOTSTRAP_PROFILES, type BootstrapProfileId } from "./profiles";
import { setBootstrapProfile } from "./session-store";
import { homePathForRoles } from "@/lib/home-path";

/** Shown only when Bootstrap Mode is on and no profile is selected. */
export function BootstrapProfileSelector() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<BootstrapProfileId>("customer");

  function enter() {
    const profile = setBootstrapProfile(selected);
    const path = homePathForRoles(profile.roles);
    void navigate({ to: path as "/app", replace: true });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-secondary/40 p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">
          Development only
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
          Development Bootstrap
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Temporary identity for RI-001 / Day-0 navigation. Does not use Supabase
          Auth. Never enable in production.
        </p>

        <fieldset className="mt-6 grid gap-2">
          <legend className="sr-only">Profile</legend>
          {BOOTSTRAP_PROFILES.map((p) => (
            <label
              key={p.id}
              className={
                "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors " +
                (selected === p.id
                  ? "border-foreground bg-muted/60"
                  : "border-border hover:bg-muted/40")
              }
            >
              <input
                type="radio"
                name="bootstrap-profile"
                value={p.id}
                checked={selected === p.id}
                onChange={() => setSelected(p.id)}
                className="size-4"
              />
              <span className="font-medium">{p.label}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {p.roles.join(", ")}
              </span>
            </label>
          ))}
        </fieldset>

        <button
          type="button"
          onClick={enter}
          className="mt-6 w-full rounded-xl bg-foreground py-3 text-sm font-bold text-background hover:opacity-90"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
