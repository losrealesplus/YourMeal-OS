import { z } from "zod";

const uuid = z.string().uuid();
const revision = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const name = z.string().trim().min(1).max(200);
const text = (max: number) => z.string().trim().max(max).nullable();
const profilePatch = z
  .object({
    displayName: name.optional(),
    email: z.string().trim().max(254).email().nullable().optional(),
    phone: text(64).optional(),
    street: z.string().trim().min(1).max(500).optional(),
    city: text(200).optional(),
  })
  .strict();
const addressPatch = z
  .object({
    label: text(100).optional(),
    street: z.string().trim().min(1).max(500).optional(),
    city: text(200).optional(),
    zip: text(32).optional(),
  })
  .strict();
const aggregate = { customerId: uuid, expectedRevision: revision };
export const customerCommandSchema = z.discriminatedUnion("operation", [
  z
    .object({
      operation: z.literal("onboard"),
      declaration: z.literal("new"),
      displayName: name,
      phone: text(64).optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("create_staff"),
      displayName: name,
      kind: z.enum(["individual", "company_employee"]).optional(),
      email: text(254).optional(),
      phone: text(64).optional(),
      street: z.string().trim().min(1).max(500).optional(),
      city: text(200).optional(),
    })
    .strict(),
  z.object({ operation: z.literal("request_link") }).strict(),
  z
    .object({
      operation: z.literal("close_conflicted_link"),
      linkRequestId: uuid,
      reason: z.literal("REVISION_CONFLICT"),
    })
    .strict(),
  z
    .object({
      operation: z.literal("approve_link"),
      ...aggregate,
      linkRequestId: uuid,
      verified: z.literal(true),
    })
    .strict(),
  z
    .object({
      operation: z.literal("confirm_link"),
      ...aggregate,
      linkRequestId: uuid,
      confirmed: z.literal(true),
    })
    .strict(),
  z.object({ operation: z.literal("profile"), ...aggregate, patch: profilePatch }).strict(),
  z
    .object({
      operation: z.literal("address_create"),
      ...aggregate,
      patch: addressPatch.extend({ street: z.string().trim().min(1).max(500) }),
    })
    .strict(),
  z
    .object({
      operation: z.literal("address_edit"),
      ...aggregate,
      addressId: uuid,
      patch: addressPatch,
    })
    .strict(),
  z
    .object({
      operation: z.literal("address_archive"),
      ...aggregate,
      addressId: uuid,
      replacementAddressId: uuid.optional(),
    })
    .strict(),
  z.object({ operation: z.literal("address_restore"), ...aggregate, addressId: uuid }).strict(),
  z.object({ operation: z.literal("address_default"), ...aggregate, addressId: uuid }).strict(),
  z.object({ operation: z.literal("customer_archive"), ...aggregate }).strict(),
]);
export const customerRequestSchema = z
  .object({ tenantId: uuid, requestId: uuid, command: customerCommandSchema })
  .strict();
export type CustomerCommand = z.infer<typeof customerCommandSchema>;
export type CustomerRequest = z.infer<typeof customerRequestSchema>;
export type CustomerAddress = {
  id: string;
  label: string | null;
  street: string;
  city: string | null;
  zip: string | null;
  isDefault: boolean;
  archived: boolean;
};
export type CustomerSelfProfile = {
  customerId: string;
  tenantId: string;
  revision: number;
  displayName: string;
  email: string | null;
  phone: string | null;
  kind: string;
  addresses: CustomerAddress[];
};
export type IdentityRequest = {
  id: string;
  userId: string;
  customerId: string | null;
  state: "requested" | "approved" | "consumed" | "expired" | "closed";
  displayName?: string | null;
  revision: number | null;
  expiresAt: string | null;
};
