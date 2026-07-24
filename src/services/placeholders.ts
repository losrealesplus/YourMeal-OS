/**
 * Placeholder stubs — call throws until the module is implemented.
 * @see docs/08-business-rules/README.md
 */

import { unimplemented } from "@/domain/errors";

function stub(name: string) {
  return new Proxy(
    {},
    {
      get() {
        throw unimplemented(name);
      },
    },
  );
}

export const InventoryService = stub("InventoryService");
export const AccountingService = stub("AccountingService");
export const NotificationService = stub("NotificationService");
export const ProductionService = stub("ProductionService");
export const PurchasingService = stub("PurchasingService");
