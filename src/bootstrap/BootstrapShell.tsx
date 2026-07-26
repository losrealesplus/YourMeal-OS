import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isBootstrapMode } from "./flag";
import { BootstrapProfileSelector } from "./BootstrapProfileSelector";
import { BootstrapDevPanel } from "./BootstrapDevPanel";

/**
 * When Bootstrap Mode is on and no profile is selected, show the selector.
 * Otherwise render the app unchanged + DEV panel (if profile active).
 * Uses useAuth() so profile switches re-render without screen-level flags.
 */
export function BootstrapShell({ children }: { children: ReactNode }) {
  if (!isBootstrapMode()) {
    return <>{children}</>;
  }

  return <BootstrapShellActive>{children}</BootstrapShellActive>;
}

function BootstrapShellActive({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
        Loading bootstrap…
      </div>
    );
  }

  if (!user) {
    return <BootstrapProfileSelector />;
  }

  return (
    <>
      {children}
      <BootstrapDevPanel />
    </>
  );
}
