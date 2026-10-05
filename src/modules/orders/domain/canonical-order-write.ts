import { z } from "zod";
import { DomainError } from "@/domain/errors";

const uuid = z.string().uuid();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  });
const profile = z
  .object({
    allergens: z.array(z.string()).optional(),
    customAllergens: z.array(z.string()).optional(),
    restrictions: z.array(z.string()).optional(),
    preferences: z.array(z.string()).optional(),
    dietaryNotes: z.string().max(2000).nullable().optional(),
  })
  .strict();
const customer = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("existing"), id: uuid }).strict(),
  z
    .object({
      kind: z.literal("new"),
      displayName: z.string().trim().min(1),
      phone: z.string().trim().min(1),
      email: z.string().email().optional(),
      street: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      deliveryNotes: z.string().nullable().optional(),
      dietaryProfile: profile.optional(),
    })
    .strict(),
]);
const decimal = z.string().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,4})?$/);
export const canonicalDishLineSchema = z
  .object({
    kind: z.literal("dish"),
    lineId: uuid.optional(),
    dishId: uuid,
    dayDate: date,
    qty: z.number().int().positive().max(2147483647),
    comment: z.string().max(2000).nullable().optional(),
    unitPriceOverride: decimal.optional(),
    unitPriceOverrideReason: z.string().trim().min(1).max(2000).optional(),
    explicitZeroConfirmed: z.boolean().optional(),
  })
  .strict();
const common = {
  weekStart: date,
  lines: z.array(canonicalDishLineSchema).min(1),
  orderNotes: z.string().max(2000).nullable().optional(),
  deliveryAddressId: uuid.nullable().optional(),
  demandChannel: z.enum(["individual", "company"]).optional(),
  companyId: uuid.nullable().optional(),
  siteId: uuid.nullable().optional(),
  organizationalUnitId: uuid.nullable().optional(),
  deliveryGroupId: uuid.nullable().optional(),
  dietaryOverride: profile
    .extend({ overrideReason: z.string().max(2000).optional() })
    .strict()
    .nullable()
    .optional(),
};
export const canonicalOrderCommandSchema = z
  .discriminatedUnion("operation", [
    z
      .object({
        ...common,
        operation: z.literal("capture"),
        customer,
        autoConfirm: z.boolean().optional(),
      })
      .strict(),
    z
      .object({
        ...common,
        operation: z.literal("modify"),
        orderId: uuid,
        expectedRevision: z.number().int().nonnegative(),
      })
      .strict(),
  ])
  .superRefine((command, ctx) => {
    if (
      command.demandChannel === "company" ||
      command.companyId != null ||
      command.siteId != null ||
      command.organizationalUnitId != null ||
      command.deliveryGroupId != null
    )
      ctx.addIssue({ code: "custom", message: "Company delivery requires its canonical writer" });
    if (new Date(`${command.weekStart}T00:00:00Z`).getUTCDay() !== 1)
      ctx.addIssue({ code: "custom", message: "Week must begin Monday" });
    const first = Date.parse(`${command.weekStart}T00:00:00Z`);
    const ids = new Set<string>();
    for (const line of command.lines) {
      if (line.unitPriceOverride !== undefined && !line.unitPriceOverrideReason)
        ctx.addIssue({ code: "custom", message: "Price override needs an explicit audit reason" });
      const day = Date.parse(`${line.dayDate}T00:00:00Z`);
      if (day < first || day > first + 6 * 86400000)
        ctx.addIssue({ code: "custom", message: "Day outside order week" });
      if (line.lineId) {
        if (ids.has(line.lineId))
          ctx.addIssue({ code: "custom", message: "Duplicate line identity" });
        ids.add(line.lineId);
      }
      if (command.operation === "capture" && line.lineId)
        ctx.addIssue({ code: "custom", message: "Capture cannot claim an existing item" });
      if (
        line.unitPriceOverride !== undefined &&
        /^0(?:\.0{1,4})?$/.test(line.unitPriceOverride) &&
        line.explicitZeroConfirmed !== true
      )
        ctx.addIssue({ code: "custom", message: "Explicit zero needs confirmation" });
    }
  });
export type CanonicalOrderCommand = z.infer<typeof canonicalOrderCommandSchema>;
export type CanonicalDishLine = z.infer<typeof canonicalDishLineSchema>;
export type CanonicalCaptureInput = Omit<
  Extract<CanonicalOrderCommand, { operation: "capture" }>,
  "operation"
> & { requestId: string };
export type CanonicalModifyInput = Omit<
  Extract<CanonicalOrderCommand, { operation: "modify" }>,
  "operation"
> & { requestId: string };
export function parseCanonicalOrderWrite(
  requestId: unknown,
  command: unknown,
): { requestId: string; command: CanonicalOrderCommand } {
  const id = uuid.safeParse(requestId);
  const parsed = canonicalOrderCommandSchema.safeParse(command);
  if (!id.success || !parsed.success)
    throw new DomainError("INVALID_STATE", "Invalid canonical dish-only order command");
  return { requestId: id.data, command: parsed.data };
}

export function parseCanonicalOrderEnvelope(
  operation: "capture" | "modify",
  input: unknown,
): { requestId: string; command: CanonicalOrderCommand } {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.hasOwn(input, "operation")
  )
    throw new DomainError("INVALID_STATE", "Invalid canonical dish-only order command");
  const { requestId, ...command } = input as Record<string, unknown>;
  return parseCanonicalOrderWrite(requestId, { ...command, operation });
}
