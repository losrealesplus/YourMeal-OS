import type { ServiceContext } from "@/services/types";
import { DomainError } from "@/domain/errors";
import type { CustomerProfileRecord, UpdateCustomerProfileInput } from "../domain/customer-profile";
import {
  type CustomerProfileRepository,
  createCustomerProfileRepository,
} from "../infrastructure/customer-profile-repository";

function assertTenantAndUser(ctx: ServiceContext): void {
  if (!ctx.tenantId || !ctx.userId) {
    throw new DomainError("PERMISSION_DENIED", "Tenant and user required");
  }
}

export class CustomerProfileService {
  private repository: CustomerProfileRepository;

  constructor(repository?: CustomerProfileRepository) {
    this.repository = repository ?? null!;
  }

  private getRepo(ctx: ServiceContext): CustomerProfileRepository {
    return this.repository || createCustomerProfileRepository(ctx.supabase);
  }

  async getProfile(
    ctx: ServiceContext,
    options?: {
      fallbackUserMetadata?: { full_name?: string; phone?: string; email?: string };
    },
  ): Promise<CustomerProfileRecord> {
    assertTenantAndUser(ctx);
    const repo = this.getRepo(ctx);

    const customer = await repo.getCustomerByUserId(ctx.tenantId, ctx.userId);
    if (!customer) {
      // Graceful unmaterialized fallback for first-time Google OAuth logins before row exists
      return {
        id: "",
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        displayName: options?.fallbackUserMetadata?.full_name || "",
        email: options?.fallbackUserMetadata?.email || "",
        phone: options?.fallbackUserMetadata?.phone || null,
        phoneId: null,
        createdAt: new Date().toISOString(),
      };
    }

    const primaryPhone = await repo.getPrimaryPhone(ctx.tenantId, customer.id);

    const displayName = customer.display_name || options?.fallbackUserMetadata?.full_name || "";

    const phone = primaryPhone?.phone || options?.fallbackUserMetadata?.phone || null;

    return {
      id: customer.id,
      tenantId: customer.tenant_id,
      userId: customer.user_id || ctx.userId,
      displayName,
      email: customer.email || options?.fallbackUserMetadata?.email || "",
      phone,
      phoneId: primaryPhone?.id || null,
      createdAt: customer.created_at,
    };
  }

  async updateProfile(
    ctx: ServiceContext,
    input: UpdateCustomerProfileInput & { email?: string },
  ): Promise<CustomerProfileRecord> {
    assertTenantAndUser(ctx);
    const repo = this.getRepo(ctx);

    let customer = await repo.getCustomerByUserId(ctx.tenantId, ctx.userId);
    if (!customer) {
      // Auto-provisioning: If customer record does not exist yet (first-time OAuth user saving profile),
      // materialize row cleanly via ensureCustomer
      customer = await repo.ensureCustomer(
        ctx.tenantId,
        ctx.userId,
        input.displayName.trim(),
        input.email,
      );
    } else {
      customer = await repo.updateDisplayName(
        ctx.tenantId,
        customer.id,
        ctx.userId,
        input.displayName.trim(),
      );
    }

    let phoneRecord = null;
    if (input.phone && input.phone.trim().length > 0) {
      phoneRecord = await repo.upsertPrimaryPhone(ctx.tenantId, customer.id, input.phone.trim());
    }

    return {
      id: customer.id,
      tenantId: customer.tenant_id,
      userId: customer.user_id || ctx.userId,
      displayName: customer.display_name || input.displayName,
      email: customer.email || input.email || "",
      phone: phoneRecord?.phone || null,
      phoneId: phoneRecord?.id || null,
      createdAt: customer.created_at,
    };
  }
}
