/**
 * Communications architecture (EP-001) — model only.
 * External channel integrations (Push / WhatsApp / Email providers) are NOT wired yet.
 * Channels are first-class so Atención al Cliente can segment and draft campaigns
 * against the same Customer Directory repository.
 */

export type CommunicationChannel = "app" | "push" | "whatsapp" | "email";

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
  channels: CommunicationChannel[];
  segmentId: string | null;
  status: "draft" | "scheduled" | "sent" | "cancelled";
};

/**
 * Catalog of planned channels — UI may list these; senders stay unimplemented.
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
