import type { AuthChangeEvent, Session, Subscription } from "@supabase/supabase-js";
import { getAuthClient } from "./client";

export async function getSession() {
  return getAuthClient().auth.getSession();
}

export async function getUser() {
  return getAuthClient().auth.getUser();
}

export async function refreshSession() {
  return getAuthClient().auth.refreshSession();
}

export async function signOut() {
  return getAuthClient().auth.signOut();
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): { data: { subscription: Subscription } } {
  return getAuthClient().auth.onAuthStateChange(callback);
}
