import type { ServiceContext } from "@/services/types";
import { createOrderRepository, type OrderRow } from "../infrastructure/order-repository";
import { RepeatOrderService } from "./repeat-order-service";
export type CustomCaptureSourceOrder = OrderRow;

/** Tenant-scoped read facade for the canonical editor; no persistence. */
export async function loadCustomCaptureSource(ctx: ServiceContext, orderId: string) {
  return createOrderRepository(ctx.supabase, ctx.tenantId).findByIdWithItems(orderId);
}
export async function previewCustomCaptureRepeat(
  ctx: ServiceContext,
  orderId: string,
  week: string,
) {
  return RepeatOrderService.preview(ctx, orderId, week);
}

import {
  parseOfferWriteRequest,
  type OfferWriteRequest,
} from "@/modules/weekly-menu/application/offer-write-input";
import {
  parseCanonicalOrderWriteResult,
  type CanonicalOrderWriteResult,
} from "../infrastructure/canonical-order-write-repository";
import type { CanonicalOrderCommand } from "../domain/canonical-order-write";

type QuoteLine = { dishId: string; dayDate: string; qty: number; unitPrice: string };
export type CaptureReview = {
  request: OfferWriteRequest;
  quoteId?: string;
  total?: string;
  quoteLines?: QuoteLine[];
  attempted: boolean;
};
export type CaptureTransport = {
  quote: (
    request: OfferWriteRequest,
  ) => Promise<{ quoteId: string; total: string; lines?: QuoteLine[] }>;
  custom: (request: OfferWriteRequest) => Promise<CanonicalOrderWriteResult>;
  mixed: (request: OfferWriteRequest & { quoteId: string }) => Promise<CanonicalOrderWriteResult>;
};

/** Application orchestration only. Persistence is exclusively the existing SSR services. */
export function createCustomCaptureSession(
  transport: CaptureTransport,
  uuid: () => string = () => crypto.randomUUID(),
) {
  let review: CaptureReview | undefined;
  let fingerprint: string | undefined;
  let inFlight = false;
  return {
    get review() {
      return review;
    },
    async prepare(tenantId: string, command: CanonicalOrderCommand): Promise<CaptureReview> {
      if (inFlight) throw new Error("La solicitud ya está en curso.");
      const next = JSON.stringify({ tenantId, command });
      if (review?.attempted && next !== fingerprint)
        throw new Error(
          "Resultado pendiente: reintenta exactamente el pedido anterior antes de modificarlo.",
        );
      if (review && next === fingerprint) return review;
      const request = parseOfferWriteRequest({ tenantId, requestId: uuid(), command });
      inFlight = true;
      try {
        const quote = request.command.lines.some((line) => line.kind === "dish")
          ? await transport.quote(request)
          : undefined;
        review = {
          request,
          ...(quote ? { quoteId: quote.quoteId, total: quote.total, quoteLines: quote.lines } : {}),
          attempted: false,
        };
        fingerprint = next;
        return review;
      } finally {
        inFlight = false;
      }
    },
    async commit(): Promise<CanonicalOrderWriteResult> {
      if (!review || inFlight) throw new Error("Revisa el pedido antes de confirmar.");
      inFlight = true;
      review.attempted = true;
      try {
        return review.quoteId
          ? await transport.mixed({ ...review.request, quoteId: review.quoteId })
          : await transport.custom(review.request);
      } catch (error) {
        // These typed rejections prove the transaction did not publish. Unknown outcomes
        // remain frozen and can only retry the same request.
        if (
          error instanceof Error &&
          [
            "CUSTOM_NOT_ENABLED",
            "PRICE_CHANGED",
            "QUOTE_INPUT_MISMATCH",
            "REVISION_CONFLICT",
            "STALE_REVISION",
            "PERMISSION_DENIED",
            "ORDER_CLOSED",
            "PRICE_UNAVAILABLE",
            "OFFER_NOT_FOUND",
          ].includes(error.message)
        )
          review.attempted = false;
        throw error;
      } finally {
        inFlight = false;
      }
    },
    discard() {
      if (inFlight || review?.attempted)
        throw new Error("Reintenta la publicación pendiente con la misma identidad.");
      review = undefined;
      fingerprint = undefined;
    },
  };
}

export async function customCaptureTransport(): Promise<CaptureTransport> {
  const { quoteOfferOrder, commitOfferOrder, commitCustomOrder } =
    await import("@/modules/weekly-menu/application/offer-write.functions");
  return {
    quote: async (request) => {
      const result = await quoteOfferOrder({ data: request });
      if (!("quoteId" in result)) throw new Error("Invalid quote response");
      return result;
    },
    mixed: async (request) =>
      parseCanonicalOrderWriteResult(
        await commitOfferOrder({ data: request }),
        request.tenantId,
        request.command,
      ),
    custom: async (request) =>
      parseCanonicalOrderWriteResult(
        await commitCustomOrder({ data: request }),
        request.tenantId,
        request.command,
      ),
  };
}
