import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { BOOTSTRAP_PROFILES, type BootstrapProfileId } from "./profiles";
import {
  clearBootstrapProfile,
  getActiveBootstrapProfile,
  setBootstrapProfile,
} from "./session-store";
import { homePathForRoles } from "@/lib/home-path";
import { isBootstrapMode } from "./flag";

/** Floating DEV panel — rendered only when Bootstrap Mode is active. */
export function BootstrapDevPanel() {
  const { roles, profile } = useAuth();
  const navigate = useNavigate();
  const active = getActiveBootstrapProfile();

  if (!isBootstrapMode() || !active) return null;

  function switchProfile(id: BootstrapProfileId) {
    const next = setBootstrapProfile(id);
    void navigate({ to: homePathForRoles(next.roles) as "/app", replace: true });
  }

  function exit() {
    clearBootstrapProfile();
    void navigate({ to: "/", replace: true });
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-56 rounded-2xl border border-amber-500/40 bg-amber-50/95 p-3 text-xs text-amber-950 shadow-lg backdrop-blur">
      <p className="font-bold tracking-wide uppercase text-[10px] text-amber-800">
        DEV MODE
      </p>
      <p className="mt-1 font-semibold truncate">
        {active.label}
        {profile?.fullName ? ` · ${profile.fullName}` : null}
      </p>
      <p className="text-[10px] text-amber-800/80 truncate">
        {roles.join(", ") || "(no roles)"}
      </p>

      <label className="mt-3 block">
        <span className="text-[10px] font-medium text-amber-900">Cambiar perfil</span>
        <select
          className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-xs"
          value={active.id}
          onChange={(e) => switchProfile(e.target.value as BootstrapProfileId)}
        >
          {BOOTSTRAP_PROFILES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={exit}
        className="mt-3 w-full rounded-lg border border-amber-400 bg-white py-1.5 font-semibold text-amber-900 hover:bg-amber-100"
      >
        Salir
      </button>
    </div>
  );
}
