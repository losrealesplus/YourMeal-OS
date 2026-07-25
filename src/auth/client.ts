/**
 * Single entry to the browser Supabase client for the auth layer.
 * UI and feature modules must not import `@supabase/supabase-js` auth APIs directly.
 */
import { supabase } from "@/integrations/supabase/client";

export type AuthClient = typeof supabase;

/** Shared Supabase client — sessions persist in localStorage (browser). */
export function getAuthClient(): AuthClient {
  return supabase;
}
