import { z } from "zod";

export interface CustomerProfileRecord {
  id: string;
  tenantId: string;
  userId: string;
  displayName: string;
  email: string;
  phone: string | null;
  phoneId: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateCustomerProfileInput {
  displayName: string;
  phone?: string | null;
}

export const customerProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[0-9\s\-()]{7,20}$/, "Introduce un número de teléfono válido")
    .optional()
    .or(z.literal("")),
});

export type CustomerProfileFormValues = z.infer<typeof customerProfileSchema>;
