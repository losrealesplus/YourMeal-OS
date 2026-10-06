import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseOfferCommitRequest, parseOfferWriteRequest } from "./offer-write-input";

/** SSR-only trusted issuer. Browser supplies selection identity, never price/actor claims. */
export const quoteOfferOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseOfferWriteRequest)
  .handler(async ({ context, data }) => {
    const { runVerifiedOfferWrite } = await import("../server/offer-write.server");
    return runVerifiedOfferWrite({ supabase: context.supabase, userId: context.userId }, data);
  });

/** Current policy evaluated on server; one SQL transaction performs all business writes. */
export const commitOfferOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseOfferCommitRequest)
  .handler(async ({ context, data }) => {
    const { runVerifiedOfferWrite } = await import("../server/offer-write.server");
    const { quoteId, ...request } = data;
    return runVerifiedOfferWrite(
      { supabase: context.supabase, userId: context.userId },
      request,
      quoteId,
    );
  });

/** Offline foundation entry; SQL activation stays closed until a separate human gate. */
export const commitCustomOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parseOfferWriteRequest)
  .handler(async ({ context, data }) => {
    const { runVerifiedOfferWrite } = await import("../server/offer-write.server");
    return runVerifiedOfferWrite(
      { supabase: context.supabase, userId: context.userId },
      data,
      undefined,
      undefined,
      true,
    );
  });
