/** OAuth attributes are suggestions only, never evidence of CRM ownership. */
export function customerOnboardingPrefill(metadata: unknown) {
  const m = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : {};
  const raw =
    typeof m.full_name === "string" ? m.full_name : typeof m.name === "string" ? m.name : "";
  return { displayName: raw.trim().length <= 200 ? raw.trim() : "" };
}
export function isApplePrivateRelay(email: string | undefined | null) {
  return typeof email === "string" && /^[^@\s]+@privaterelay\.appleid\.com$/i.test(email.trim());
}
export function resolveCustomerOnboarding(input: {
  membershipApproved: boolean;
  staff: boolean;
  customerId: string | null;
  pendingLink: boolean;
}) {
  if (!input.membershipApproved) return "membership_required" as const;
  if (input.customerId) return "ready" as const;
  if (input.staff) return "staff_no_automatic_customer" as const;
  if (input.pendingLink) return "assisted_link_pending" as const;
  return "explicit_choice_required" as const;
}
