export const orderKeys = {
  all: (tenantId: string) => ["orders", tenantId] as const,
  drafts: (tenantId: string) => [...orderKeys.all(tenantId), "draft"] as const,
  detail: (tenantId: string, orderId: string) =>
    [...orderKeys.all(tenantId), "detail", orderId] as const,
};
