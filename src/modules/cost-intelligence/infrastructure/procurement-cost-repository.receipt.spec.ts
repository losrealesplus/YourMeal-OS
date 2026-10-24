import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseProcurementCostRepository } from "./procurement-cost-repository";

it("maps partial receipt lines to the SQL contract without falling back to full receipt", async () => {
  const rpc = vi
    .fn()
    .mockResolvedValue({
      data: {
        success: true,
        invoice_id: "invoice",
        status: "partially_received",
        receipt_id: "key",
        summary: {},
        processed_lines: [],
      },
      error: null,
    });
  const repo = new SupabaseProcurementCostRepository({ rpc } as unknown as SupabaseClient);
  await repo.receiveInvoiceAtomic({
    tenantId: "tenant",
    invoiceId: "invoice",
    receiptId: "key",
    receivedLines: [{ lineId: "line", quantity: 2 }],
  });
  expect(rpc).toHaveBeenCalledWith(
    "receive_purchase_invoice_v1",
    expect.objectContaining({ p_received_lines: [{ line_id: "line", quantity: 2 }] }),
  );
  await repo.receiveInvoiceAtomic({ tenantId: "tenant", invoiceId: "invoice", receivedLines: [] });
  expect(rpc.mock.calls[1][1].p_received_lines).toEqual([]);
  await repo.receiveInvoiceAtomic({ tenantId: "tenant", invoiceId: "invoice" });
  expect(rpc.mock.calls[2][1].p_received_lines).toBeNull();
});
