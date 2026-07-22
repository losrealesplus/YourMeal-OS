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
      className="group block surface-raised border border-border/60 rounded-3xl p-5 transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.995]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="meta-label">{order.weekLabel}</p>
          <p className="font-bold text-lg mt-1.5 leading-tight">
            <span className="font-mono tabular-nums">{order.meals}</span>{" "}
            <span className="text-muted-foreground font-semibold">{mealsLabel}</span>
          </p>
        </div>
        <StatusPill status={order.status} label={statusLabels[order.status]} />
      </div>
      <div className="mt-5 pt-4 border-t border-border/60 flex items-end justify-between">
        <span className="font-mono text-lg font-extrabold tabular-nums tracking-tight">
          {fmt.currency(order.totalCents / 100, { currency: order.currency })}
        </span>
        <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:text-primary group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
