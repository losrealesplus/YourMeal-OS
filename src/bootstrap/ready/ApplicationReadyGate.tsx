import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  getBootstrapOrchestrator,
  startBootstrapPipeline,
} from "@/bootstrap/pipeline";
import {
  getBootstrapIdentitySnapshot,
  subscribeBootstrapIdentitySnapshot,
} from "@/bootstrap/pipeline/BootstrapIdentityStore";
import type { BootstrapResult } from "@/bootstrap/pipeline/types";
import { emitApplicationLifecycle } from "./ApplicationLifecycleEvents";
import {
  deriveApplicationReadySnapshot,
  type ApplicationLifecycleState,
  type ApplicationReadySnapshot,
} from "./deriveApplicationReady";
import { ReadyContextProvider } from "./ReadyContext";

/**
 * Application Ready Gate — lifecycle infrastructure (ADR 0053).
 *
 * Observes BootstrapResult + identity snapshot.
 * Publishes application:* lifecycle events.
 * Renders children always (public/auth UI unchanged).
 * Product Core entry uses ensureApplicationReady / useApplicationReady().isReady.
 *
 * Does not modify Providers or invent a new loading UI.
 */
export function ApplicationReadyGate({ children }: { children: ReactNode }) {
  const [bootstrap, setBootstrap] = useState<BootstrapResult | null>(() =>
    getBootstrapOrchestrator().getResult(),
  );
  const [identity, setIdentity] = useState(() => getBootstrapIdentitySnapshot());
  const lastState = useRef<ApplicationLifecycleState | null>(null);

  useEffect(() => {
    void startBootstrapPipeline({ mode: "cold" });
    const unsubBoot = getBootstrapOrchestrator().subscribe(setBootstrap);
    const unsubId = subscribeBootstrapIdentitySnapshot(setIdentity);
    return () => {
      unsubBoot();
      unsubId();
    };
  }, []);

  const snapshot: ApplicationReadySnapshot = deriveApplicationReadySnapshot(
    bootstrap,
    identity,
  );

  useEffect(() => {
    if (lastState.current === snapshot.state) return;
    lastState.current = snapshot.state;
    emitApplicationLifecycle(snapshot.state, {
      bootstrapStatus: snapshot.bootstrap?.status ?? null,
      identityUserId: snapshot.identityUserId,
    });
  }, [snapshot.state, snapshot.bootstrap?.status, snapshot.identityUserId]);

  return (
    <ReadyContextProvider value={snapshot}>{children}</ReadyContextProvider>
  );
}
