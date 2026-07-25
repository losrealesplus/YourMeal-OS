/**
 * OP-002 · Permanent Platform Owner emails.
 *
 * Source of truth for grants remains the DB function
 * `public.is_platform_owner_email`. This list is only a client-side
 * short-circuit so non-owners skip the session RPC.
 */
export const PLATFORM_OWNER_EMAILS = [
  "alex1409h@gmail.com",
  "alexhdezmtinez@gmail.com",
] as const;

export function isPlatformOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (PLATFORM_OWNER_EMAILS as readonly string[]).includes(
    email.trim().toLowerCase(),
  );
}
