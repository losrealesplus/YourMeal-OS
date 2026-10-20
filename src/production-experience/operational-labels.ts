import type { AllergenSnapshotState } from "@/modules/orders/domain/order-item-read-model";
import type { ProductionReportModel } from "@/modules/operations";
import { isCustomOperationalItem, operationalItemIdentity } from "./operational-item-identity";

export type OperationalLabelRow = {
  key: string;
  orderId: string;
  customerName: string;
  dishName: string;
  allergens: string[];
  allergenState?: AllergenSnapshotState;
  note: string | null;
  isCustom: boolean;
  itemIdentity: string;
  nativeCustom: boolean;
  companyName?: string | null;
  siteName?: string | null;
  deliveryAddress?: string | null;
  portionIndex: number;
  totalPortions: number;
  deliveryDate?: string;
};

/** Portion labels retain each captured line's declaration; a Dish aggregate is not a snapshot. */
export function buildOperationalLabels(report: ProductionReportModel): OperationalLabelRow[] {
  return report.packingByCustomer.flatMap((customer) =>
    customer.items.flatMap((item, sourceIndex) =>
      Array.from({ length: item.qty }, (_, portionIndex) => ({
        key: `${operationalItemIdentity(item)}:${customer.orderId}:${customer.customerId}:${sourceIndex}:${portionIndex}`,
        orderId: customer.orderId,
        customerName: customer.customerName,
        dishName: item.dishName,
        allergens: isCustomOperationalItem(item) ? [] : [...item.allergens],
        allergenState: isCustomOperationalItem(item) ? ("UNKNOWN" as const) : item.allergenState,
        note: item.comment,
        isCustom: isCustomOperationalItem(item) || Boolean(item.comment?.trim()),
        itemIdentity: operationalItemIdentity(item),
        nativeCustom: isCustomOperationalItem(item),
        companyName: customer.companyName ?? null,
        siteName: customer.siteName ?? null,
        deliveryAddress: customer.deliveryAddress ?? null,
        portionIndex: portionIndex + 1,
        totalPortions: item.qty,
        deliveryDate: report.deliveryDate,
      })),
    ),
  );
}
