import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/use-auth";
import { homePathForRoles } from "@/lib/home-path";
import { ensurePlatformOwnerSession } from "@/lib/ensure-platform-owner-session";

/** Load roles for the current user and return the post-login home path. */
export async function resolveHomePath(userId: string): Promise<string> {
  // OP-002: Platform Owners receive saas_admin + company_admin on first login.
  await ensurePlatformOwnerSession();

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const roles = (data ?? []).map((r) => r.role as AppRole);
  return homePathForRoles(roles);
}
