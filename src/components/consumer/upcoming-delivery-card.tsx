/**
 * EP-002A.1 — Próxima entrega card (Customer Home).
 * No business logic: renders UpcomingDeliveryResult from the service.
 */
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  ChefHat,
  Package,
  Truck,
  CalendarDays,
} from "lucide-react";
import { useFmt } from "@/i18n/localization-provider";
import { cn } from "@/lib/utils";
import { PrimaryCTA } from "@/components/consumer/primary-cta";
import type {
  UpcomingDelivery,
  UpcomingDeliveryAction,
  UpcomingDeliveryPhase,
  UpcomingDeliveryResult,
} from "@/modules/orders/domain/upcoming-delivery";

const phaseIcon: Record<
  Exclude<UpcomingDeliveryPhase, "none">,
  typeof Package
> = {
  scheduled: CalendarDays,
  confirmed: Package,
  preparing: ChefHat,
  ready: Package,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
};

const phaseTone: Record<Exclude<UpcomingDeliveryPhase, "none">, string> = {
  scheduled: "bg-secondary text-secondary-foreground",
  confirmed: "bg-primary/12 text-primary",
  preparing: "bg-warn/15 text-[oklch(0.45_0.12_75)]",
  ready: "bg-chart-2/15 text-chart-2",
  out_for_delivery: "bg-chart-2/20 text-chart-2",
  delivered: "bg-primary/12 text-primary",
};

function phaseLabelKey(phase: UpcomingDeliveryPhase): string {
  switch (phase) {
    case "scheduled":
      return "upcomingPhaseScheduled";
    case "confirmed":
      return "upcomingPhaseConfirmed";
    case "preparing":
      return "upcomingPhasePreparing";
    case "ready":
      return "upcomingPhaseReady";
    case "out_for_delivery":
      return "upcomingPhaseOut";
    case "delivered":
      return "upcomingPhaseDelivered";
    default:
      return "upcomingPhaseScheduled";
  }
}

function actionLabelKey(action: UpcomingDeliveryAction): string {
  switch (action) {
    case "program":
      return "upcomingActionProgram";
    case "view":
      return "upcomingActionView";
    case "modify":
      return "upcomingActionModify";
    case "track":
      return "upcomingActionTrack";
    case "summary":
      return "upcomingActionSummary";
    case "repeat":
      return "upcomingActionRepeat";
  }
}

function actionTo(action: UpcomingDeliveryAction, orderId: string) {
  switch (action) {
    case "program":
      return { to: "/app/menu" as const };
    case "modify":
      return { to: "/app/schedule" as const };
    case "view":
    case "track":
    case "summary":
      return {
        to: "/app/orders/$orderId" as const,
        params: { orderId },
      };
    case "repeat":
      return { to: "/app/menu" as const };
  }
}

function formatAddress(delivery: UpcomingDelivery): string | null {
  if (!delivery.address) return null;
  const { label, line, city } = delivery.address;
  const head = label || line;
  if (label && city) return `${label} · ${city}`;
  if (label && line) return `${label} · ${line}`;
  if (city) return `${head} · ${city}`;
  return head;
}

export function UpcomingDeliveryCard({
  result,
  isLoading,
}: {
  result: UpcomingDeliveryResult | undefined;
  isLoading?: boolean;
}) {
  const { t } = useTranslation("customer");
  const fmt = useFmt();

  if (isLoading) {
    return (
      <div className="rounded-[1.25rem] border border-border/70 bg-card p-5 animate-pulse">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="mt-4 h-6 w-40 rounded bg-muted" />
        <div className="mt-3 h-4 w-full rounded bg-muted" />
      </div>
    );
  }

  if (!result || result.kind === "none") {
    return (
      <section className="rounded-[1.25rem] border border-border/70 bg-card p-5 space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t("nextDelivery")}
        </p>
        <p className="text-[15px] font-semibold leading-snug text-pretty">
          {t("upcomingEmptyTitle")}
        </p>
        <Link to="/app/menu" className="block">
          <PrimaryCTA className="!h-12 !text-sm !rounded-2xl">
            {t("upcomingActionProgram")}
          </PrimaryCTA>
        </Link>
      </section>
    );
  }

  const { delivery } = result;
  const phase = delivery.phase as Exclude<UpcomingDeliveryPhase, "none">;
  const Icon = phaseIcon[phase];
  const addressLabel = formatAddress(delivery);
  const primary = delivery.actions[0];
  const secondary = delivery.actions[1];

  return (
    <section className="rounded-[1.25rem] border border-border/70 bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t("nextDelivery")}
          </p>
          <p className="mt-2 text-lg font-extrabold tracking-tight">
            {fmt.date(`${delivery.deliveryDate}T12:00:00.000Z`, "long")}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
            phaseTone[phase],
          )}
        >
          <Icon className="size-3.5" strokeWidth={2.25} aria-hidden />
          {t(phaseLabelKey(phase))}
        </span>
      </div>

      <dl className="space-y-2 text-sm">
        {delivery.timeWindowLabel ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("upcomingWindow")}</dt>
            <dd className="font-semibold tabular-nums text-right">
              {delivery.timeWindowLabel}
            </dd>
          </div>
        ) : null}
        {addressLabel ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("upcomingAddress")}</dt>
            <dd className="font-semibold text-right text-pretty max-w-[60%]">
              {addressLabel}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t("upcomingDishes")}</dt>
          <dd className="font-semibold tabular-nums">
            {t("upcomingDishCount", { count: delivery.itemCount })}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t("upcomingTotal")}</dt>
          <dd className="font-extrabold tabular-nums">
            {fmt.currency(delivery.total, { currency: delivery.currency })}
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2 pt-1">
        {primary ? (
          <ActionButton
            action={primary}
            orderId={delivery.orderId}
            primary
            label={t(actionLabelKey(primary))}
          />
        ) : null}
        {secondary ? (
          <ActionButton
            action={secondary}
            orderId={delivery.orderId}
            label={t(actionLabelKey(secondary))}
          />
        ) : null}
      </div>
    </section>
  );
}

function ActionButton({
  action,
  orderId,
  label,
  primary,
}: {
  action: UpcomingDeliveryAction;
  orderId: string;
  label: string;
  primary?: boolean;
}) {
  const dest = actionTo(action, orderId);
  if (dest.to === "/app/orders/$orderId") {
    return (
      <Link
        to="/app/orders/$orderId"
        params={dest.params}
        className={cn(
          "flex h-12 items-center justify-center rounded-2xl text-sm font-bold transition",
          primary
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-background text-foreground",
        )}
      >
        {label}
      </Link>
    );
  }
  return (
    <Link
      to={dest.to}
      className={cn(
        "flex h-12 items-center justify-center rounded-2xl text-sm font-bold transition",
        primary
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-background text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
