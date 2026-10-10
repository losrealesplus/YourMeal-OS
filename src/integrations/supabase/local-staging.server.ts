/** Server-only synthetic service credential. No production credential access. */
import { localStagingFromEnvironment } from "../../lib/local-staging-runtime";
export const LOCAL_STAGING_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJwMzQtbG9jYWwtc3ludGhldGljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.H-u0zeK1y7UAPyz6FlNUnvKmgEoY9H6gfVTQ0B7ZMKI";
export function serverLocalStaging(env: Record<string, string | undefined>): boolean {
  const config = localStagingFromEnvironment(env);
  if (
    config &&
    env.SUPABASE_SERVICE_ROLE_KEY !== undefined &&
    env.SUPABASE_SERVICE_ROLE_KEY !== LOCAL_STAGING_SERVICE_KEY
  )
    throw new Error("SECURITY_VIOLATION: Mixed staging service credential.");
  return Boolean(config);
}
