import type { AuthChangeEvent, Session, Subscription } from "@supabase/supabase-js";
import { getAuthClient } from "./client";
import { isBootstrapMode } from "@/bootstrap/flag";
import {
  clearBootstrapProfile,
  getActiveBootstrapSession,
  subscribeBootstrapAuth,
} from "@/bootstrap/session-store";

/**
 * Session API — identity origin.
 * When VITE_BOOTSTRAP_MODE=true and a bootstrap profile is selected,
 * returns the synthetic session. Otherwise unchanged Supabase Auth.
 */

export async function getSession() {
  if (isBootstrapMode()) {
    const session = getActiveBootstrapSession();
    if (session) {
      return { data: { session }, error: null };
    }
  }
  return getAuthClient().auth.getSession();
}

export async function getUser() {
  if (isBootstrapMode()) {
    const session = getActiveBootstrapSession();
    if (session?.user) {
      return { data: { user: session.user }, error: null };
    }
  }
  return getAuthClient().auth.getUser();
}

export async function refreshSession() {
  if (isBootstrapMode()) {
    const session = getActiveBootstrapSession();
    if (session) {
      return { data: { session, user: session.user }, error: null };
    }
  }
  return getAuthClient().auth.refreshSession();
}

export async function signOut() {
  if (isBootstrapMode()) {
    clearBootstrapProfile();
    return { error: null };
  }
  return getAuthClient().auth.signOut();
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): { data: { subscription: Subscription } } {
  if (isBootstrapMode()) {
    const unsubscribe = subscribeBootstrapAuth(callback);
    const subscription = {
      id: "bootstrap-auth",
      callback,
      unsubscribe,
    } as unknown as Subscription;
    return { data: { subscription } };
  }
  return getAuthClient().auth.onAuthStateChange(callback);
}
