import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentCustomerId } from "@/hooks/use-current-customer-id";
import { useFmt } from "@/i18n/localization-provider";
import { ScreenHeader, EmptyState } from "@/components/consumer";

/**
 * Screen: Customer · Payment Methods
 * - Objetivo operacional: consultar método de facturación acordado con EatClean
 *   y ver el historial de facturas (pago fuera de app en esta etapa).
 * - Capability: profile.manage · billing.read-own
 * - Core Object(s): Invoice · Payment
 */
export const Route = createFileRoute("/_authenticated/app/payment-methods")({
  component: PaymentMethodsPage,
});

type InvoiceRow = {
  id: string;
  amount: number;
  status: "pending" | "paid" | "overdue" | "void";
  billing_period: string | null;
  created_at: string;
};

function PaymentMethodsPage() {
  const { t } = useTranslation(["customer", "common"]);
  const { tenantId } = useAuth();
  const fmt = useFmt();
  const customerQuery = useCurrentCustomerId();
  const customerId = customerQuery.data ?? null;

  const invoices = useQuery({
    queryKey: ["customer-invoices", tenantId, customerId],
    enabled: Boolean(tenantId && customerId),
    queryFn: async (): Promise<InvoiceRow[]> => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, amount, status, billing_period, created_at")
        .eq("tenant_id", tenantId!)
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw new Error(error.message);
      return (data ?? []) as InvoiceRow[];
    },
  });

  const list = invoices.data ?? [];
  const outstanding = list
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  return (
    <div className="flex-1 flex flex-col pb-6">
      <ScreenHeader
        backTo="/app/settings"
        overline={t("customer:settings")}
        title={t("customer:payment")}
      />

      <div className="px-6 space-y-6">
        <div className="surface-raised border border-border/60 rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center size-10 rounded-xl bg-secondary text-muted-foreground">
              <CreditCard className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-sm">
                {t("customer:paymentMethodBilledByTenant")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("customer:paymentMethodHint")}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="meta-label">{t("customer:invoices")}</p>
            {outstanding > 0 && (
              <span className="text-xs font-bold text-destructive">
                {t("customer:paymentOutstanding", {
                  amount: fmt.currency(outstanding),
                })}
              </span>
            )}
          </div>

          {invoices.isLoading || customerQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              {t("common:loading")}
            </p>
          ) : list.length === 0 ? (
            <EmptyState
              icon={<FileText className="size-6" />}
              title={t("customer:invoicesEmptyTitle")}
              hint={t("customer:invoicesEmptyHint")}
            />
          ) : (
            <div className="surface-raised border border-border/60 rounded-3xl overflow-hidden divide-y divide-border/60">
              {list.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center gap-3">
                  <span className="grid place-items-center size-9 rounded-xl bg-secondary text-muted-foreground shrink-0">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">
                      {inv.billing_period ?? fmt.date(inv.created_at)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t(`customer:status_${inv.status}`)} ·{" "}
                      {fmt.date(inv.created_at)}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold">
                    {fmt.currency(Number(inv.amount || 0))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          to="/app/orders"
          className="block text-center text-sm font-semibold text-primary py-2"
        >
          {t("customer:orderHistory")} →
        </Link>
      </div>
    </div>
  );
}
