import { isBootstrapMode } from "./flag";

/**
 * Permanent top banner whenever Bootstrap Mode is enabled.
 * Prevents screenshots / reviews from being mistaken for Supabase Auth sessions.
 */
export function BootstrapModeBanner() {
  if (!isBootstrapMode()) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[110] border-b border-amber-600/50 bg-amber-500 px-3 py-2 text-center text-[11px] font-semibold leading-snug text-amber-950 shadow-sm"
    >
      <span className="mr-1" aria-hidden>
        ⚠
      </span>
      Bootstrap Mode — Identity Source:{" "}
      <span className="font-bold">BootstrapIdentityProvider</span>
      <span className="mx-1.5 opacity-70">·</span>
      Not Supabase Auth — navigation / FCR only
    </div>
  );
}
