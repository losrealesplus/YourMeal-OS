import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { isBootstrapMode } from "./flag";
import {
  getBootstrapProfile,
  type BootstrapProfile,
  type BootstrapProfileId,
} from "./profiles";

const STORAGE_KEY = "ymos_bootstrap_profile_id";

type Listener = (event: AuthChangeEvent, session: Session | null) => void;

const listeners = new Set<Listener>();

function readStoredId(): BootstrapProfileId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return (raw as BootstrapProfileId | null) ?? null;
  } catch {
    return null;
  }
}

function writeStoredId(id: BootstrapProfileId | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!id) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore quota / private mode */
  }
}

export function buildBootstrapUser(profile: BootstrapProfile): User {
  const now = new Date().toISOString();
  return {
    id: profile.userId,
    app_metadata: { provider: "bootstrap", providers: ["bootstrap"] },
    user_metadata: { full_name: profile.displayName },
    aud: "authenticated",
    created_at: now,
    email: profile.email,
    email_confirmed_at: now,
    phone: "",
    confirmed_at: now,
    last_sign_in_at: now,
    role: "authenticated",
    updated_at: now,
    identities: [],
    factors: [],
    is_anonymous: false,
  } as User;
}

export function buildBootstrapSession(profile: BootstrapProfile): Session {
  const user = buildBootstrapUser(profile);
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: `bootstrap.${profile.id}`,
    refresh_token: `bootstrap-refresh.${profile.id}`,
    token_type: "bearer",
    expires_in: 60 * 60 * 8,
    expires_at: now + 60 * 60 * 8,
    user,
  };
}

export function getActiveBootstrapProfile(): BootstrapProfile | null {
  if (!isBootstrapMode()) return null;
  return getBootstrapProfile(readStoredId());
}

export function getActiveBootstrapSession(): Session | null {
  const profile = getActiveBootstrapProfile();
  return profile ? buildBootstrapSession(profile) : null;
}

export function setBootstrapProfile(id: BootstrapProfileId): BootstrapProfile {
  if (!isBootstrapMode()) {
    throw new Error("Bootstrap session can only be set when VITE_BOOTSTRAP_MODE=true");
  }
  const profile = getBootstrapProfile(id);
  if (!profile) throw new Error(`Unknown bootstrap profile: ${id}`);
  writeStoredId(id);
  const session = buildBootstrapSession(profile);
  emit("SIGNED_IN", session);
  return profile;
}

export function clearBootstrapProfile(): void {
  if (!isBootstrapMode()) return;
  writeStoredId(null);
  emit("SIGNED_OUT", null);
}

function emit(event: AuthChangeEvent, session: Session | null): void {
  for (const listener of listeners) {
    listener(event, session);
  }
}

export function subscribeBootstrapAuth(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
