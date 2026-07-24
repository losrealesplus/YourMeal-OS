export type {
  CustomerKind,
  CustomerActivityStatus,
  IndividualCustomerRecord,
  CompanyDirectoryRecord,
  SupportNoteRecord,
  CustomerOrderSummary,
  IndividualCustomerFilters,
  CompanyDirectoryFilters,
  CommercialDashboardMetrics,
  SupportStats,
} from "./domain/customer-directory";
export {
  INACTIVE_AFTER_DAYS,
  ACTIVE_WITHIN_DAYS,
  NEW_WITHIN_DAYS,
  RECURRING_MIN_ORDERS,
  deriveCustomerStatus,
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
export { CustomerDirectoryService } from "./application/customer-directory-service";
