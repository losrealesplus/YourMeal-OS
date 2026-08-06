/**
 * IdentityFacade — sole public operational entry for identity (ADR 0055 Phase 2).
 *
 * Composes AuthState + BootstrapIdentityStore + branding provenance.
 * Does not call Supabase. Does not own loading (Bootstrap does).
 *
 * Operational Modules consume this API — never auth/session facades directly.
 */

import {
  getBootstrapIdentitySnapshot,
  subscribeBootstrapIdentitySnapshot,
  type BootstrapIdentitySnapshot,
} from "@/bootstrap/pipeline/BootstrapIdentityStore";
import { getBootstrapOrchestrator } from "@/bootstrap/pipeline/BootstrapOrchestrator";
import type { AuthState } from "@/hooks/use-auth-types";
import { composeIdentity } from "./composeIdentity";
import { emitIdentityLifecycle } from "./IdentityEvents";
import type { IdentityContext } from "./IdentityContext";
import type { IdentityResult } from "./IdentityResult";
import type { BrandingContext } from "./IdentityContext";

export type IdentityFacadeView = {
  readonly currentUser: IdentityContext["currentUser"];
  readonly session: { present: boolean; userId: string | null };
  readonly tenant: IdentityContext["tenant"];
  readonly branding: IdentityContext["branding"];
  readonly permissions: IdentityContext["permissions"];
  readonly workspace: IdentityContext["workspace"];
  readonly locale: IdentityContext["locale"];
  readonly flags: IdentityContext["flags"];
  readonly preferences: IdentityContext["preferences"];
  readonly membership: IdentityContext["membership"];
  readonly operational: IdentityContext["operational"];
  readonly state: IdentityContext["state"];
  readonly result: IdentityResult;
  readonly context: IdentityContext;
  isOperationalReady(): boolean;
};

function toView(result: IdentityResult): IdentityFacadeView {
  const { context } = result;
  return {
    currentUser: context.currentUser,
    session: {
      present: context.sessionPresent,
      userId: context.sessionUserId,
    },
    tenant: context.tenant,
    branding: context.branding,
    permissions: context.permissions,
    workspace: context.workspace,
    locale: context.locale,
    flags: context.flags,
    preferences: context.preferences,
    membership: context.membership,
    operational: context.operational,
    state: context.state,
    result,
    context,
    isOperationalReady: () =>
      context.state === "operational_ready" || context.state === "active",
  };
}

function brandProvenanceFromBootstrap(): BrandingContext["provenance"] {
  const boot = getBootstrapOrchestrator().getResult();
  return boot?.brandProvenance ?? "fallback";
}

export class IdentityFacade {
  private last: IdentityResult | null = null;
  private lastState: IdentityContext["state"] | null = null;
  private readonly listeners = new Set<(view: IdentityFacadeView) => void>();

  /**
   * Compose from AuthState (React) + optional snapshot override.
   * Bootstrap remains owner of loading; this only exposes.
   */
  compose(
    auth: AuthState,
    snapshot?: BootstrapIdentitySnapshot | null,
  ): IdentityFacadeView {
    const result = composeIdentity({
      auth,
      snapshot: snapshot ?? getBootstrapIdentitySnapshot(),
      brandProvenance: brandProvenanceFromBootstrap(),
    });
    this.publish(result);
    return toView(result);
  }

  /** Last composed view — null until first compose. */
  getView(): IdentityFacadeView | null {
    return this.last ? toView(this.last) : null;
  }

  getResult(): IdentityResult | null {
    return this.last;
  }

  getContext(): IdentityContext | null {
    return this.last?.context ?? null;
  }

  isOperationalReady(): boolean {
    const s = this.last?.state;
    return s === "operational_ready" || s === "active";
  }

  subscribe(listener: (view: IdentityFacadeView) => void): () => void {
    this.listeners.add(listener);
    if (this.last) listener(toView(this.last));
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Observe bootstrap identity store; caller still supplies AuthState via compose. */
  observeStore(getAuth: () => AuthState | null): () => void {
    return subscribeBootstrapIdentitySnapshot(() => {
      const auth = getAuth();
      if (auth) this.compose(auth);
    });
  }

  clear(): void {
    this.last = null;
    this.lastState = null;
    emitIdentityLifecycle("anonymous", { cleared: true });
  }

  /** Test helper */
  reset(): void {
    this.last = null;
    this.lastState = null;
    this.listeners.clear();
  }

  private publish(result: IdentityResult): void {
    this.last = result;
    if (this.lastState !== result.state) {
      this.lastState = result.state;
      emitIdentityLifecycle(result.state, {
        userId: result.context.userId,
        tenantId: result.context.tenant?.id ?? null,
      });
    }
    const view = toView(result);
    for (const listener of [...this.listeners]) {
      try {
        listener(view);
      } catch {
        /* ignore */
      }
    }
  }
}

let singleton: IdentityFacade | null = null;

export function getIdentityFacade(): IdentityFacade {
  if (!singleton) singleton = new IdentityFacade();
  return singleton;
}

/** Test helper */
export function resetIdentityFacade(): void {
  singleton?.reset();
  singleton = null;
}
