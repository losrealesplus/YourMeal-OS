/**
 * YOURMEAL OS — DATA ONBOARDING ENGINE CONTRACT & TYPES
 *
 * Generic, tenant-isolated data onboarding engine designed to ingest,
 * extract, normalize, semantically map, validate, preview, and reconcile
 * external datasets (Excel / PDF / CSV) into structured operational entities.
 */

export type OnboardingFileStatus =
  | "RECEIVED"
  | "PROCESSING"
  | "EXTRACTED"
  | "MAPPED"
  | "VALIDATION_REQUIRED"
  | "READY"
  | "IMPORTING"
  | "IMPORTED"
  | "RECONCILED"
  | "FAILED";

export type OnboardingEntityType =
  | "customers"
  | "companies"
  | "dishes"
  | "weekly_menus"
  | "orders";

export type ValidationSeverity = "GREEN" | "YELLOW" | "RED";

export type RowReconciliationStatus =
  | "CREATED"
  | "UPDATED"
  | "SKIPPED"
  | "DUPLICATE"
  | "REJECTED"
  | "FAILED";

export interface OnboardingFileRecord {
  id: string;
  tenantId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  source: "web_upload" | "sftp" | "api";
  uploadedBy: string;
  uploadedAt: string;
  status: OnboardingFileStatus;
  detectedEntityType?: OnboardingEntityType;
  totalRows?: number;
  storageBucket: string;
  storagePath: string;
}

export interface ExtractedCell {
  columnName: string;
  columnIndex: number;
  rawValue: string | number | boolean | null;
  cellType: "string" | "number" | "boolean" | "date" | "formula" | "empty";
}

export interface ExtractedRow {
  rowIndex: number;
  sheetName: string;
  cells: Record<string, ExtractedCell>;
}

export interface NormalizedField {
  sourceColumn: string;
  rawValue: unknown;
  normalizedValue: unknown;
  dataType: "string" | "number" | "boolean" | "date_iso" | "phone_e164" | "email" | "currency_cents";
  isValid: boolean;
  normalizationErrors?: string[];
}

export interface SemanticMappingProposal {
  sourceColumn: string;
  targetField: string;
  targetEntityType: OnboardingEntityType;
  confidence: number; // 0.00 to 1.00
  evidence: string;
  isConfirmed: boolean;
  manualOverride?: string;
}

export interface RowValidationResult {
  rowIndex: number;
  severity: ValidationSeverity;
  issues: Array<{
    field: string;
    message: string;
    suggestedFix?: string;
  }>;
  potentialDuplicates?: Array<{
    existingEntityId: string;
    matchedOn: string[];
    similarityScore: number; // 0.00 to 1.00
  }>;
}

export interface HumanApprovalDecision {
  fileId: string;
  rowIndex: number;
  action: "CONFIRM" | "CHANGE" | "REJECT";
  correctedData?: Record<string, unknown>;
  approvedBy: string;
  approvedAt: string;
  rejectionReason?: string;
}

export interface RowReconciliationRecord {
  fileId: string;
  sheetName: string;
  rowIndex: number;
  sourceRowHash: string;
  status: RowReconciliationStatus;
  targetEntityId?: string;
  targetEntityType: OnboardingEntityType;
  auditTrailId: string;
  errorMessage?: string;
}

export interface ReconciliationReport {
  fileId: string;
  tenantId: string;
  totalSourceRows: number;
  processedRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  duplicateCount: number;
  rejectedCount: number;
  failedCount: number;
  is100PercentReconciled: boolean;
  startedAt: string;
  completedAt: string;
}

export interface ImportAuditTrailRecord {
  id: string;
  tenantId: string;
  fileId: string;
  fileName: string;
  sheetOrPage: string;
  rowPosition: number;
  sourceValues: Record<string, unknown>;
  mappedTarget: Record<string, unknown>;
  approvedBy: string;
  approvedAt: string;
  entityId: string;
  entityType: OnboardingEntityType;
  action: RowReconciliationStatus;
  timestamp: string;
}
