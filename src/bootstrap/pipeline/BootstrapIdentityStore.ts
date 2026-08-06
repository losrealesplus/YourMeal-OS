/**
 * Shared identity snapshot published by Session/Tenant stages.
 * Providers subscribe — they do not load roles/profile/tenant themselves.
 */

import type { ActiveTenant, AppRole, UserProfile } from "@/hooks/use-auth-types";

export type BootstrapIdentitySnapshot = {
  userId: string | null;
  roles: AppRole[];
  profile: UserProfile | null;
  tenant: ActiveTenant | null;
  homePath: string | null;
  status: "idle" | "loading" | "ready" | "cleared";
  updatedAt: number;
};

const IDLE: BootstrapIdentitySnapshot = {
  userId: null,
  roles: [],
  profile: null,
  tenant: null,
  homePath: null,
  status: "idle",
  updatedAt: 0,
};

let snapshot: BootstrapIdentitySnapshot = { ...IDLE };
const listeners = new Set<(s: BootstrapIdentitySnapshot) => void>();

export function getBootstrapIdentitySnapshot(): BootstrapIdentitySnapshot {
  return snapshot;
}

export function publishBootstrapIdentitySnapshot(
  next: Partial<BootstrapIdentitySnapshot> &
    Pick<BootstrapIdentitySnapshot, "status">,
): BootstrapIdentitySnapshot {
  snapshot = {
    ...snapshot,
    ...next,
    updatedAt: Date.now(),
  };
  for (const listener of [...listeners]) {
    try {
      listener(snapshot);
    } catch {
      /* observe-only */
    }
  }
  return snapshot;
}

export function clearBootstrapIdentitySnapshot(): void {
  snapshot = { ...IDLE, status: "cleared", updatedAt: Date.now() };
  for (const listener of [...listeners]) {
    try {
      listener(snapshot);
    } catch {
      /* ignore */
    }
  }
}

export function subscribeBootstrapIdentitySnapshot(
  listener: (s: BootstrapIdentitySnapshot) => void,
): () => void {
  listeners.add(listener);
  listener(snapshot);
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper */
export function resetBootstrapIdentitySnapshot(): void {
  snapshot = { ...IDLE };
  listeners.clear();
}
