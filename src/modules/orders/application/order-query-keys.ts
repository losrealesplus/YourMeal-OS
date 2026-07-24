export const orderKeys = {
  all: (tenantId: string) => ["orders", tenantId] as const,
  drafts: (tenantId: string) => [...orderKeys.all(tenantId), "draft"] as const,
  list: (tenantId: string, userId: string) =>
    [...orderKeys.all(tenantId), "list", userId] as const,
  detail: (tenantId: string, orderId: string) =>
    [...orderKeys.all(tenantId), "detail", orderId] as const,
};
