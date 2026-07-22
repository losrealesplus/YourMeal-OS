import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { MockOrder } from "@/lib/mock-catalog";
import { useFmt } from "@/i18n/localization-provider";
import { StatusPill } from "./status-pill";

export function OrderCard({
  order,
  statusLabels,
  mealsLabel,
}: {
  order: MockOrder;
  statusLabels: Record<string, string>;
  mealsLabel: string;
}) {
  const fmt = useFmt();
  return (
    <Link
      to="/app/orders/$orderId"
      params={{ orderId: order.id }}
      className="block bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="meta-label">{order.weekLabel}</p>
          <p className="font-bold text-lg mt-1">
            {order.meals} {mealsLabel}
          </p>
        </div>
        <StatusPill status={order.status} label={statusLabels[order.status]} />
      </div>
      <div className="flex items-end justify-between mt-4">
        <span className="font-mono text-lg font-extrabold tabular-nums">
          {fmt.currency(order.totalCents / 100, { currency: order.currency })}
        </span>
        <ChevronRight className="size-5 text-muted-foreground" />
      </div>
    </Link>
  );
}
