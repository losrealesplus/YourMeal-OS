/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ServiceContext } from "@/services/types";
import { AuditService } from "@/services/audit-service";
import { DomainError, permissionDenied } from "@/domain/errors";
import {
  evaluateCustomerQuality,
  type CustomerQualityEvaluation,
  type CustomerImprovementAlert,
  type CustomerQualityDismissalRecord,
  type CustomerEvaluationInput,
  type DismissReason,
  type QualityAlertCode,
  type QualityAlertSeverity,
} from "../domain/customer-quality";

function assertTenant(ctx: ServiceContext): void {
  if (!ctx.tenantId || !ctx.userId) {
    throw new DomainError("PERMISSION_DENIED", "Tenant and user required");
  }
}

function assertCanReadCustomers(ctx: ServiceContext): void {
  if (!ctx.capabilities.has("customers.read") && !ctx.capabilities.has("support.read")) {
    throw permissionDenied("customers.read");
  }
}

function assertCanWriteAlerts(ctx: ServiceContext): void {
  if (!ctx.capabilities.has("customers.write") && !ctx.capabilities.has("support.write")) {
    throw permissionDenied("customers.write");
  }
}

export type DismissAlertInput = {
  customerId: string;
  alertType: QualityAlertCode;
  dismissReason: DismissReason;
  targetCustomerId?: string | null;
  notes?: string | null;
};

export type ListAlertFilters = {
  customerId?: string;
  alertType?: QualityAlertCode;
  severity?: QualityAlertSeverity;
  status?: "open" | "dismissed" | "all";
};

/**
 * Customer Quality Application Service.
 *
 * Implements Phase 2: Dynamic evaluation of quality signals, duplicate hypotheses,
 * and persisted human dismissal/override decisions.
 *
 * Core Invariant: DETECCIÓN ≠ DECISIÓN
 * Evaluates in-memory; NEVER mutates or merges customer records automatically.
 */
export const CustomerQualityService = {
  /**
   * Load dismissal records for a tenant (and optionally a specific customer).
   */
  async loadDismissals(
    ctx: ServiceContext,
    customerId?: string,
  ): Promise<CustomerQualityDismissalRecord[]> {
    assertTenant(ctx);
    assertCanReadCustomers(ctx);
    const db = ctx.supabase as any;

    let query = db
      .from("customer_quality_dismissals")
      .select("id, tenant_id, customer_id, alert_type, dismiss_reason, target_customer_id, dismissed_by, dismissed_at, notes")
      .eq("tenant_id", ctx.tenantId);

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      customerId: row.customer_id,
      alertType: row.alert_type as QualityAlertCode,
      dismissReason: row.dismiss_reason as DismissReason,
      targetCustomerId: row.target_customer_id ?? null,
      dismissedBy: row.dismissed_by ?? null,
      dismissedAt: row.dismissed_at,
      notes: row.notes ?? null,
    }));
  },

  /**
   * Load raw customer inputs needed for quality evaluation across tenant.
   */
  async loadEvaluationInputs(
    ctx: ServiceContext,
  ): Promise<CustomerEvaluationInput[]> {
    assertTenant(ctx);
    assertCanReadCustomers(ctx);
    const db = ctx.supabase as any;

    const [custRes, phoneRes, addrRes] = await Promise.all([
      db
        .from("customers")
        .select("id, display_name, email, kind, deleted_at")
        .eq("tenant_id", ctx.tenantId)
        .is("deleted_at", null),
      db
        .from("customer_phones")
        .select("id, customer_id, phone, is_primary, deleted_at")
        .eq("tenant_id", ctx.tenantId)
        .is("deleted_at", null),
      db
        .from("customer_addresses")
        .select("id, customer_id, street, city, zip, label, is_default, deleted_at")
        .eq("tenant_id", ctx.tenantId)
        .is("deleted_at", null),
    ]);

    if (custRes.error) throw custRes.error;
    if (phoneRes.error) throw phoneRes.error;
    if (addrRes.error) throw addrRes.error;

    const phonesByCust = new Map<string, any[]>();
    for (const p of phoneRes.data ?? []) {
      const list = phonesByCust.get(p.customer_id) ?? [];
      list.push(p);
      phonesByCust.set(p.customer_id, list);
    }

    const addrsByCust = new Map<string, any[]>();
    for (const a of addrRes.data ?? []) {
      const list = addrsByCust.get(a.customer_id) ?? [];
      list.push(a);
      addrsByCust.set(a.customer_id, list);
    }

    return (custRes.data ?? []).map((c: any) => ({
      id: c.id,
      displayName: c.display_name,
      email: c.email,
      kind: c.kind,
      phones: (phonesByCust.get(c.id) ?? []).map((p: any) => ({
        id: p.id,
        phone: p.phone,
        isPrimary: p.is_primary,
      })),
      addresses: (addrsByCust.get(c.id) ?? []).map((a: any) => ({
        id: a.id,
        street: a.street,
        city: a.city,
        zip: a.zip,
        label: a.label,
        isDefault: a.is_default,
      })),
    }));
  },

  /**
   * Evaluate a single customer by ID against directory context.
   */
  async evaluateCustomer(
    ctx: ServiceContext,
    customerId: string,
  ): Promise<CustomerQualityEvaluation> {
    assertTenant(ctx);
    assertCanReadCustomers(ctx);

    const [allCustomers, dismissals] = await Promise.all([
      this.loadEvaluationInputs(ctx),
      this.loadDismissals(ctx, customerId),
    ]);

    const target = allCustomers.find((c) => c.id === customerId);
    if (!target) {
      throw new DomainError("NOT_FOUND", `Customer ${customerId} not found`);
    }

    return evaluateCustomerQuality(target, {
      allCustomers,
      dismissals,
    });
  },

  /**
   * Evaluates quality for all customers in the tenant directory.
   */
  async evaluateTenantDirectory(
    ctx: ServiceContext,
  ): Promise<Map<string, CustomerQualityEvaluation>> {
    assertTenant(ctx);
    assertCanReadCustomers(ctx);

    const [allCustomers, dismissals] = await Promise.all([
      this.loadEvaluationInputs(ctx),
      this.loadDismissals(ctx),
    ]);

    const resultMap = new Map<string, CustomerQualityEvaluation>();

    for (const customer of allCustomers) {
      const custDismissals = dismissals.filter(
        (d) => d.customerId === customer.id,
      );
      const evalResult = evaluateCustomerQuality(customer, {
        allCustomers,
        dismissals: custDismissals,
      });
      resultMap.set(customer.id, evalResult);
    }

    return resultMap;
  },

  /**
   * List customer improvement alerts across the tenant or for a specific customer.
   */
  async listAlerts(
    ctx: ServiceContext,
    filters: ListAlertFilters = {},
  ): Promise<CustomerImprovementAlert[]> {
    assertTenant(ctx);
    assertCanReadCustomers(ctx);

    const evaluations = await this.evaluateTenantDirectory(ctx);
    const alerts: CustomerImprovementAlert[] = [];

    for (const evalResult of evaluations.values()) {
      if (filters.customerId && evalResult.customerId !== filters.customerId) {
        continue;
      }
      for (const alert of evalResult.alerts) {
        if (filters.alertType && alert.alertType !== filters.alertType) {
          continue;
        }
        if (filters.severity && alert.severity !== filters.severity) {
          continue;
        }
        if (filters.status && filters.status !== "all") {
          if (alert.status !== filters.status) continue;
        }
        alerts.push(alert);
      }
    }

    return alerts;
  },

  /**
   * Persist a human decision / dismissal for an alert (e.g., "not_now" or "not_same_customer").
   */
  async dismissAlert(
    ctx: ServiceContext,
    input: DismissAlertInput,
  ): Promise<CustomerQualityDismissalRecord> {
    assertTenant(ctx);
    assertCanWriteAlerts(ctx);

    if (!input.customerId) {
      throw new DomainError("INVALID_STATE", "customerId is required");
    }
    if (!input.alertType) {
      throw new DomainError("INVALID_STATE", "alertType is required");
    }
    if (!input.dismissReason) {
      throw new DomainError("INVALID_STATE", "dismissReason is required");
    }

    const db = ctx.supabase as any;

    const row = {
      tenant_id: ctx.tenantId,
      customer_id: input.customerId,
      alert_type: input.alertType,
      dismiss_reason: input.dismissReason,
      target_customer_id: input.targetCustomerId ?? null,
      dismissed_by: ctx.userId,
      dismissed_at: new Date().toISOString(),
      notes: input.notes?.trim() || null,
    };

    const { data, error } = await db
      .from("customer_quality_dismissals")
      .insert(row)
      .select()
      .single();

    if (error) throw error;

    const record: CustomerQualityDismissalRecord = {
      id: data.id,
      tenantId: data.tenant_id,
      customerId: data.customer_id,
      alertType: data.alert_type as QualityAlertCode,
      dismissReason: data.dismiss_reason as DismissReason,
      targetCustomerId: data.target_customer_id ?? null,
      dismissedBy: data.dismissed_by ?? null,
      dismissedAt: data.dismissed_at,
      notes: data.notes ?? null,
    };

    await AuditService.write(ctx, {
      entityType: "customer_quality_dismissal",
      entityId: record.id,
      action: "create",
      newData: {
        customerId: record.customerId,
        alertType: record.alertType,
        dismissReason: record.dismissReason,
        targetCustomerId: record.targetCustomerId,
        notes: record.notes,
      },
    });

    return record;
  },

  /**
   * Reopen a dismissed alert by removing the dismissal record.
   */
  async reopenAlert(ctx: ServiceContext, dismissalId: string): Promise<void> {
    assertTenant(ctx);
    assertCanWriteAlerts(ctx);

    const db = ctx.supabase as any;

    const { data: existing, error: fetchErr } = await db
      .from("customer_quality_dismissals")
      .select("*")
      .eq("id", dismissalId)
      .eq("tenant_id", ctx.tenantId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!existing) {
      throw new DomainError("NOT_FOUND", `Dismissal ${dismissalId} not found`);
    }

    const { error: delErr } = await db
      .from("customer_quality_dismissals")
      .delete()
      .eq("id", dismissalId)
      .eq("tenant_id", ctx.tenantId);

    if (delErr) throw delErr;

    await AuditService.write(ctx, {
      entityType: "customer_quality_dismissal",
      entityId: dismissalId,
      action: "archive",
      oldData: {
        customerId: existing.customer_id,
        alertType: existing.alert_type,
        dismissReason: existing.dismiss_reason,
      },
    });
  },
};
