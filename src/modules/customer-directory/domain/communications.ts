/**
 * Communications architecture — common engine (model only).
 * External channel senders (WhatsApp / Email / Push / SMS providers) are NOT wired yet.
 *
 * Shared spine:
 *   Communication → Channel → Recipient → Template → Campaign → Delivery → Result
 *
 * Audience always resolves against Customer Directory (single source of truth).
 * UI label today: Atención al Cliente. Domain evolution: Customer Success.
 */

export type CommunicationChannel =
  | "app"
  | "push"
  | "whatsapp"
  | "email"
  | "sms";

export type DeliveryStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "opened"
  | "clicked"
  | "unsubscribed";

export type CampaignKind =
  | "promotion"
  | "novelty"
  | "reminder"
  | "inactive_reactivation"
  | "company"
  | "individual";

export type SegmentDimension =
  | "customer_kind"
  | "company"
  | "frequency"
  | "habitual_purchase_day"
  | "order_count"
  | "average_ticket"
  | "status"
  | "city"
  | "zone"
  | "last_order_at"
  | "created_at"
  | "employee"
  | "tags";

/** Recipient = Customer Directory id (individual or company contact). */
export type CommunicationRecipient = {
  customerId: string;
  companyId?: string | null;
  channelAddress?: string | null;
};

export type MessageTemplateDraft = {
  id: string;
  name: string;
  channel: CommunicationChannel;
  subject?: string | null;
  body: string;
};

export type AudienceSegmentDraft = {
  id: string;
  name: string;
  dimensions: Partial<Record<SegmentDimension, string | number | boolean>>;
  channelHints: CommunicationChannel[];
};

export type CampaignDraft = {
  id: string;
  kind: CampaignKind;
  title: string;
  body: string;
  templateId: string | null;
  channels: CommunicationChannel[];
  segmentId: string | null;
  status: "draft" | "scheduled" | "sent" | "cancelled";
};

export type DeliveryDraft = {
  id: string;
  campaignId: string;
  recipientCustomerId: string;
  channel: CommunicationChannel;
  status: DeliveryStatus;
  resultDetail?: string | null;
};

/**
 * Catalog of planned channels — UI may list these; senders stay unimplemented.
 * Any future channel plugs into the same Communication → Delivery → Result motor.
 */
export const PLANNED_COMMUNICATION_CHANNELS: ReadonlyArray<{
  id: CommunicationChannel;
  label: string;
  integrationReady: boolean;
}> = [
  { id: "app", label: "App (in-product)", integrationReady: false },
  { id: "push", label: "Push", integrationReady: false },
  { id: "whatsapp", label: "WhatsApp", integrationReady: false },
  { id: "email", label: "Email", integrationReady: false },
  { id: "sms", label: "SMS", integrationReady: false },
];

export const PLANNED_CAMPAIGN_KINDS: ReadonlyArray<{
  id: CampaignKind;
  label: string;
}> = [
  { id: "promotion", label: "Promociones" },
  { id: "novelty", label: "Novedades" },
  { id: "reminder", label: "Recordatorios" },
  { id: "inactive_reactivation", label: "Clientes inactivos" },
  { id: "company", label: "Empresas" },
  { id: "individual", label: "Particulares" },
];

/** Engine stages — documentation + future service boundaries. */
export const COMMUNICATION_ENGINE_STAGES = [
  "Communication",
  "Channel",
  "Recipient",
  "Template",
  "Campaign",
  "Delivery",
  "Result",
] as const;
