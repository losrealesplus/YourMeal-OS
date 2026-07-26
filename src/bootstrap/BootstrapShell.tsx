import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isBootstrapMode } from "./flag";
import { BootstrapModeBanner } from "./BootstrapModeBanner";
import { BootstrapProfileSelector } from "./BootstrapProfileSelector";
import { BootstrapDevPanel } from "./BootstrapDevPanel";

/**
 * When Bootstrap Mode is on:
 * - always show the permanent Bootstrap Mode banner
 * - if no profile → selector
 * - else → app + DEV panel
 */
export function BootstrapShell({ children }: { children: ReactNode }) {
  if (!isBootstrapMode()) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <BootstrapModeBanner />
      <div className="flex-1 min-h-0">
        <BootstrapShellActive>{children}</BootstrapShellActive>
      </div>
    </div>
  );
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
