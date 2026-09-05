/**
 * Customer Data Quality & Customer Improvement Alerts Domain Engine.
 *
 * Core Principle: DETECCIÓN ≠ DECISIÓN
 * The engine evaluates data quality, profile completeness, and duplicate hypotheses
 * in a deterministic, pure runtime fashion. It NEVER merges, modifies, or deletes
 * customer records automatically. All interventions require explicit human action.
 *
 * @see docs/adr/0100-customer-data-quality-and-improvement-alerts.md
 */

export type CustomerQualityStatus = "complete" | "improver" | "needs_attention";

export type QualityAlertCode =
  | "missing_phone"
  | "missing_address"
  | "missing_delivery_instructions"
  | "variable_location_without_instruction"
  | "incomplete_profile"
  | "duplicate_phone"
  | "duplicate_email"
  | "possible_duplicate";

export type QualityAlertSeverity = "info" | "warning" | "critical";

export type QualityAlertStatus = "open" | "resolved" | "dismissed";

export type DismissReason = "not_now" | "not_same_customer" | "not_relevant" | "other";

export type QualitySignalEvidence = {
  ruleCode: string;
  field: string;
  detectedValue?: string | number | boolean | null;
  conflictingCustomerId?: string | null;
  conflictingCustomerName?: string | null;
  rationale: string;
};

export type CustomerImprovementAlert = {
  id: string;
  customerId: string;
  customerName: string | null;
  alertType: QualityAlertCode;
  severity: QualityAlertSeverity;
  status: QualityAlertStatus;
  title: string;
  description: string;
  evidence: QualitySignalEvidence;
  dismissedAt?: string | null;
  dismissedBy?: string | null;
  dismissReason?: DismissReason | null;
  targetCustomerId?: string | null;
  createdAt: string;
};

export type CustomerQualityEvaluation = {
  customerId: string;
  status: CustomerQualityStatus;
  completenessPercentage: number;
  alerts: CustomerImprovementAlert[];
  activeAlertCount: number;
  hasCriticalAlerts: boolean;
  evaluatedAt: string;
};

export type CustomerQualityDismissalRecord = {
  id: string;
  tenantId: string;
  customerId: string;
  alertType: QualityAlertCode;
  dismissReason: DismissReason;
  targetCustomerId?: string | null;
  dismissedBy?: string | null;
  dismissedAt: string;
  notes?: string | null;
};

export type CustomerPhoneItem = {
  id?: string;
  phone: string;
  isPrimary?: boolean;
};

export type CustomerAddressItem = {
  id?: string;
  street?: string | null;
  city?: string | null;
  zip?: string | null;
  label?: string | null;
  isDefault?: boolean;
  notes?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type CustomerEvaluationInput = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  phones?: (string | CustomerPhoneItem)[];
  addresses?: (string | CustomerAddressItem)[];
  notes?: string | null;
  kind?: string;
  deletedAt?: string | null;
};

export type QualityEvaluationContext = {
  allCustomers?: CustomerEvaluationInput[];
  dismissals?: CustomerQualityDismissalRecord[];
  nowIso?: string;
};

/**
 * Normalizes phone numbers to standard digit strings.
 * For Spanish phones (+34 / 0034 / local), extracts the canonical digits.
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let cleaned = phone.trim();
  if (cleaned.startsWith("+34")) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith("0034")) {
    cleaned = cleaned.slice(4);
  }
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.length >= 9) {
    return digits.slice(-9);
  }
  if (digits.length >= 7) {
    return digits;
  }
  return null;
}

/**
 * Normalizes email address to trimmed lowercase.
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

const VARIABLE_LOCATION_REGEX = /\b(variable|ubicaci[oó]n\s+variable|se\s+mueve|cambia\s+de\s+sitio|itinerante)\b/i;

/**
 * Checks whether text signals variable location.
 */
export function isVariableLocationText(text: string | null | undefined): boolean {
  if (!text) return false;
  return VARIABLE_LOCATION_REGEX.test(text);
}

/**
 * Pure evaluator: evaluates customer data quality and improvement alerts.
 * GUARANTEE: Never modifies or mutates customer input.
 */
export function evaluateCustomerQuality(
  customer: CustomerEvaluationInput,
  context: QualityEvaluationContext = {},
): CustomerQualityEvaluation {
  const evaluatedAt = context.nowIso ?? new Date().toISOString();
  const alerts: CustomerImprovementAlert[] = [];
  const dismissals = context.dismissals ?? [];
  const allCustomers = context.allCustomers ?? [];

  const displayName = customer.displayName?.trim() || null;
  const rawPhones = customer.phones ?? [];
  const rawAddresses = customer.addresses ?? [];
  const customerNotes = customer.notes?.trim() || null;

  // Extract valid phone strings
  const phoneList: string[] = [];
  for (const p of rawPhones) {
    if (typeof p === "string") {
      if (p.trim()) phoneList.push(p.trim());
    } else if (p && typeof p === "object" && p.phone?.trim()) {
      phoneList.push(p.phone.trim());
    }
  }

  // Extract address strings
  const addressList: { street: string; city: string | null; notes: string | null }[] = [];
  for (const a of rawAddresses) {
    if (typeof a === "string") {
      if (a.trim()) addressList.push({ street: a.trim(), city: null, notes: null });
    } else if (a && typeof a === "object") {
      const street = a.street?.trim();
      if (street) {
        addressList.push({
          street,
          city: a.city?.trim() || null,
          notes: a.notes?.trim() || null,
        });
      }
    }
  }

  // --- Rule 1: Display Name / Profile ---
  if (!displayName) {
    alerts.push({
      id: `${customer.id}:incomplete_profile`,
      customerId: customer.id,
      customerName: null,
      alertType: "incomplete_profile",
      severity: "critical",
      status: "open",
      title: "Nombre no registrado",
      description: "El cliente no tiene nombre o identificación registrada en el sistema.",
      evidence: {
        ruleCode: "RULE_NAME_REQUIRED",
        field: "displayName",
        detectedValue: null,
        rationale: "displayName is null or whitespace",
      },
      createdAt: evaluatedAt,
    });
  }

  // --- Rule 2: Phone ---
  if (phoneList.length === 0) {
    alerts.push({
      id: `${customer.id}:missing_phone`,
      customerId: customer.id,
      customerName: displayName,
      alertType: "missing_phone",
      severity: "warning",
      status: "open",
      title: "Falta número de teléfono",
      description: "El cliente no tiene teléfono de contacto principal.",
      evidence: {
        ruleCode: "RULE_PHONE_REQUIRED",
        field: "phones",
        detectedValue: 0,
        rationale: "No active phone records found for customer",
      },
      createdAt: evaluatedAt,
    });
  } else {
    // Check if any phone is malformed / incomplete
    const normalizedPhones = phoneList.map(normalizePhone);
    const hasValidPhone = normalizedPhones.some((n) => n !== null);
    if (!hasValidPhone) {
      alerts.push({
        id: `${customer.id}:missing_phone`,
        customerId: customer.id,
        customerName: displayName,
        alertType: "missing_phone",
        severity: "warning",
        status: "open",
        title: "Teléfono incompleto o inválido",
        description: "El número de teléfono registrado parece estar incompleto o no es válido.",
        evidence: {
          ruleCode: "RULE_PHONE_FORMAT",
          field: "phones",
          detectedValue: phoneList.join(", "),
          rationale: "Provided phone numbers cannot be normalized to standard digits",
        },
        createdAt: evaluatedAt,
      });
    }
  }

  // --- Rule 3: Address ---
  if (addressList.length === 0) {
    alerts.push({
      id: `${customer.id}:missing_address`,
      customerId: customer.id,
      customerName: displayName,
      alertType: "missing_address",
      severity: "warning",
      status: "open",
      title: "Falta dirección de entrega",
      description: "El cliente no tiene ninguna dirección de entrega registrada.",
      evidence: {
        ruleCode: "RULE_ADDRESS_REQUIRED",
        field: "addresses",
        detectedValue: 0,
        rationale: "No active address records found for customer",
      },
      createdAt: evaluatedAt,
    });
  }

  // --- Rule 4: Variable location without instructions ---
  const hasVariableLocation =
    isVariableLocationText(customerNotes) ||
    addressList.some((a) => isVariableLocationText(a.street) || isVariableLocationText(a.notes));

  if (hasVariableLocation) {
    const hasDetailedInstructions =
      (customerNotes && customerNotes.length > 15 && !isVariableLocationText(customerNotes)) ||
      addressList.some((a) => (a.notes && a.notes.length > 10) || (a.street && a.street.length > 25));

    if (!hasDetailedInstructions) {
      alerts.push({
        id: `${customer.id}:variable_location_without_instruction`,
        customerId: customer.id,
        customerName: displayName,
        alertType: "variable_location_without_instruction",
        severity: "warning",
        status: "open",
        title: "Ubicación variable sin instrucciones",
        description:
          "El cliente está marcado con ubicación variable pero no cuenta con instrucciones claras de entrega.",
        evidence: {
          ruleCode: "RULE_VARIABLE_LOCATION_INSTRUCTIONS",
          field: "delivery_notes",
          detectedValue: customerNotes ?? "variable",
          rationale: "Customer marked with variable location lacks specific delivery instructions",
        },
        createdAt: evaluatedAt,
      });
    }
  }

  // --- Rule 5: Duplicate phone hypotheses ---
  const currentNormalizedPhones = phoneList
    .map(normalizePhone)
    .filter((p): p is string => p !== null);

  if (currentNormalizedPhones.length > 0 && allCustomers.length > 0) {
    for (const other of allCustomers) {
      if (other.id === customer.id || other.deletedAt) continue;
      const otherPhones = (other.phones ?? [])
        .map((p) => (typeof p === "string" ? p : p?.phone))
        .filter(Boolean)
        .map(normalizePhone)
        .filter((p): p is string => p !== null);

      const matchingPhone = currentNormalizedPhones.find((p) => otherPhones.includes(p));
      if (matchingPhone) {
        alerts.push({
          id: `${customer.id}:duplicate_phone:${other.id}`,
          customerId: customer.id,
          customerName: displayName,
          alertType: "duplicate_phone",
          severity: "info",
          status: "open",
          title: "Teléfono compartido con otro cliente",
          description: `El número ${matchingPhone} también está registrado en ${other.displayName || "otro cliente"}.`,
          evidence: {
            ruleCode: "RULE_DUPLICATE_PHONE",
            field: "phone",
            detectedValue: matchingPhone,
            conflictingCustomerId: other.id,
            conflictingCustomerName: other.displayName || null,
            rationale: `Exact phone match detected with customer ${other.id}`,
          },
          targetCustomerId: other.id,
          createdAt: evaluatedAt,
        });
      }
    }
  }

  // --- Rule 6: Duplicate email hypotheses ---
  const currentNormalizedEmail = normalizeEmail(customer.email);
  if (currentNormalizedEmail && allCustomers.length > 0) {
    for (const other of allCustomers) {
      if (other.id === customer.id || other.deletedAt) continue;
      const otherEmail = normalizeEmail(other.email);
      if (otherEmail && otherEmail === currentNormalizedEmail) {
        alerts.push({
          id: `${customer.id}:duplicate_email:${other.id}`,
          customerId: customer.id,
          customerName: displayName,
          alertType: "duplicate_email",
          severity: "info",
          status: "open",
          title: "Email compartido con otro cliente",
          description: `El email ${currentNormalizedEmail} también está registrado en ${other.displayName || "otro cliente"}.`,
          evidence: {
            ruleCode: "RULE_DUPLICATE_EMAIL",
            field: "email",
            detectedValue: currentNormalizedEmail,
            conflictingCustomerId: other.id,
            conflictingCustomerName: other.displayName || null,
            rationale: `Exact email match detected with customer ${other.id}`,
          },
          targetCustomerId: other.id,
          createdAt: evaluatedAt,
        });
      }
    }
  }

  // Apply dismissals to alerts
  for (const alert of alerts) {
    const match = dismissals.find((d) => {
      if (d.customerId !== alert.customerId || d.alertType !== alert.alertType) {
        return false;
      }
      if (alert.targetCustomerId) {
        return d.targetCustomerId === alert.targetCustomerId;
      }
      return true;
    });

    if (match) {
      alert.status = "dismissed";
      alert.dismissedAt = match.dismissedAt;
      alert.dismissedBy = match.dismissedBy;
      alert.dismissReason = match.dismissReason;
    }
  }

  // Calculate completeness percentage (0 to 100)
  let scorePoints = 0;
  if (displayName) scorePoints += 25;
  if (phoneList.length > 0 && phoneList.some((p) => normalizePhone(p) !== null)) scorePoints += 35;
  if (addressList.length > 0) scorePoints += 30;
  if (!hasVariableLocation || (hasVariableLocation && customerNotes)) scorePoints += 10;
  const completenessPercentage = Math.min(100, Math.max(0, scorePoints));

  const activeAlerts = alerts.filter((a) => a.status === "open");
  const activeAlertCount = activeAlerts.length;
  const hasCriticalAlerts = activeAlerts.some((a) => a.severity === "critical");

  // Derive CustomerQualityStatus
  let status: CustomerQualityStatus;
  const hasValidPhone = phoneList.some((p) => normalizePhone(p) !== null);
  const hasValidEmail = normalizeEmail(customer.email) !== null;

  if (hasCriticalAlerts || (!hasValidPhone && !hasValidEmail) || (hasVariableLocation && activeAlerts.some((a) => a.alertType === "variable_location_without_instruction"))) {
    status = "needs_attention";
  } else if (activeAlertCount === 0 && completenessPercentage >= 90) {
    status = "complete";
  } else {
    status = "improver";
  }

  return {
    customerId: customer.id,
    status,
    completenessPercentage,
    alerts,
    activeAlertCount,
    hasCriticalAlerts,
    evaluatedAt,
  };
}
