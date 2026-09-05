export type {
  CustomerKind,
  CustomerActivityStatus,
  IndividualCustomerRecord,
  CompanyDirectoryRecord,
  SupportNoteRecord,
  SupportNoteStatus,
  CustomerOrderSummary,
  IndividualCustomerFilters,
  UpdateIndividualCustomerInput,
  CompanyDirectoryFilters,
  CommercialDashboardMetrics,
  SupportStats,
} from "./domain/customer-directory";
export {
  INACTIVE_AFTER_DAYS,
  ACTIVE_WITHIN_DAYS,
  NEW_WITHIN_DAYS,
  RECURRING_MIN_ORDERS,
  SUPPORT_ISSUE_KINDS,
  deriveCustomerStatus,
  nextSupportNoteStatuses,
  canTransitionSupportNote,
} from "./domain/customer-directory";
export {
  PLANNED_COMMUNICATION_CHANNELS,
  PLANNED_CAMPAIGN_KINDS,
  COMMUNICATION_ENGINE_STAGES,
} from "./domain/communications";
export type {
  CommunicationChannel,
  CampaignKind,
  AudienceSegmentDraft,
  CampaignDraft,
  SegmentDimension,
  CommunicationRecipient,
  MessageTemplateDraft,
  DeliveryDraft,
  DeliveryStatus,
} from "./domain/communications";
export type {
  CustomerQualityStatus,
  QualityAlertCode,
  QualityAlertSeverity,
  QualityAlertStatus,
  DismissReason,
  QualitySignalEvidence,
  CustomerImprovementAlert,
  CustomerQualityEvaluation,
  CustomerQualityDismissalRecord,
  CustomerPhoneItem,
  CustomerAddressItem,
  CustomerEvaluationInput,
  QualityEvaluationContext,
} from "./domain/customer-quality";
export {
  normalizePhone,
  normalizeEmail,
  isVariableLocationText,
  evaluateCustomerQuality,
} from "./domain/customer-quality";
export { CustomerDirectoryService } from "./application/customer-directory-service";
export {
  CustomerQualityService,
  type DismissAlertInput,
  type ListAlertFilters,
} from "./application/customer-quality-service";
