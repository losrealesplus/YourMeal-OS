import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  RefreshCw,
  Truck,
  WifiOff,
} from "lucide-react";
import type { MockOrder } from "@/lib/mock-catalog";
import { useFmt } from "@/i18n/localization-provider";
import { cn } from "@/lib/utils";

/**
 * Dashboard state primitives — presentational only.
 * Cover: loading, error, offline, confirmed order, pending order.
 * All variants are keyboard-reachable, announce via aria-live where relevant,
 * and use design-system tokens exclusively.
 */

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-2xl bg-secondary/60",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        className,
      )}
    />
  );
}

export function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className="px-6 space-y-4 animate-fade-in"
    >
      <SkeletonBlock className="h-40 rounded-3xl" />
      <SkeletonBlock className="h-24 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
      </div>
      <SkeletonBlock className="h-4 w-32" />
      <SkeletonBlock className="h-28 rounded-3xl" />
      <SkeletonBlock className="h-28 rounded-3xl" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function DashboardError({
  title,
  hint,
  retryLabel,
  onRetry,
}: {
  title: string;
  hint: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-6 surface-raised border border-destructive/30 rounded-3xl p-6 text-center flex flex-col items-center gap-3 animate-fade-in"
    >
      <div className="grid place-items-center size-12 rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-bold">{title}</p>
        <p className="text-xs text-muted-foreground max-w-[32ch] mx-auto leading-relaxed">
          {hint}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-foreground text-background text-xs font-bold uppercase tracking-widest transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <RefreshCw className="size-4" aria-hidden />
        {retryLabel}
      </button>
    </div>
  );
}

export function OfflineBanner({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-6 flex items-start gap-3 rounded-2xl border border-border bg-secondary/60 p-4"
    >
      <div className="grid place-items-center size-9 rounded-xl bg-background text-muted-foreground shrink-0">
        <WifiOff className="size-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {hint}
        </p>
      </div>
    </div>
  );
}

export function ConfirmedOrderHero({
  order,
  overline,
  title,
  mealsLabel,
  ctaLabel,
}: {
  order: MockOrder;
  overline: string;
  title: string;
  mealsLabel: string;
  ctaLabel: string;
}) {
  const fmt = useFmt();
  return (
    <Link
      to="/app/orders/$orderId"
      params={{ orderId: order.id }}
      className="group block surface-raised border border-primary/30 rounded-3xl p-5 transition-all duration-200 hover:border-primary/50 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start gap-3">
        <div className="grid place-items-center size-11 rounded-2xl bg-primary/12 shrink-0 text-primary">
          <CheckCircle2 className="size-5" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="meta-label text-primary">{overline}</p>
          <p className="font-bold mt-1 leading-tight text-balance">{title}</p>
          <p className="text-xs text-muted-foreground mt-1.5 font-mono tabular-nums">
            {fmt.dateTime(order.deliveryDateIso)}
          </p>
        </div>
        <span className="font-mono text-sm font-extrabold tabular-nums shrink-0">
          {order.meals}
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">
            {mealsLabel}
          </span>
        </span>
      </div>
      <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
        <span className="font-mono text-sm font-bold tabular-nums">
          {fmt.currency(order.totalCents / 100, { currency: order.currency })}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
          {ctaLabel} →
        </span>
      </div>
    </Link>
  );
}

export function PendingOrderHero({
  order,
  overline,
  title,
  hint,
  ctaLabel,
}: {
  order: MockOrder;
  overline: string;
  title: string;
  hint: string;
  ctaLabel: string;
}) {
  const fmt = useFmt();
  return (
    <Link
      to="/app/schedule"
      className="group block surface-raised border border-[oklch(0.85_0.10_75)] rounded-3xl p-5 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start gap-3">
        <div className="grid place-items-center size-11 rounded-2xl bg-warn/20 shrink-0 text-[oklch(0.5_0.12_75)]">
          <Clock className="size-5" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="meta-label text-[oklch(0.5_0.12_75)]">{overline}</p>
          <p className="font-bold mt-1 leading-tight text-balance">{title}</p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            {hint}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2 font-mono tabular-nums">
            {fmt.dateTime(order.deliveryDateIso)}
          </p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {order.weekLabel}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
          {ctaLabel} →
        </span>
      </div>
    </Link>
  );
}

export function DeliveryHero({
  order,
  overline,
  mealsLabel,
}: {
  order: MockOrder;
  overline: string;
  mealsLabel: string;
}) {
  const fmt = useFmt();
  return (
    <Link
      to="/app/orders/$orderId"
      params={{ orderId: order.id }}
      className="group block surface-raised border border-border/60 rounded-3xl p-5 transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-center gap-3">
        <div className="grid place-items-center size-11 rounded-2xl bg-primary/10 shrink-0">
          <Truck className="size-5 text-primary" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="meta-label">{overline}</p>
          <p className="font-bold mt-1 truncate">
            {fmt.dateTime(order.deliveryDateIso)}
          </p>
        </div>
        <span className="font-mono text-sm font-extrabold tabular-nums shrink-0">
          {order.meals}
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">
            {mealsLabel}
          </span>
        </span>
      </div>
    </Link>
  );
}

export function DashboardStateSwitcher({
  states,
  current,
  onSelect,
  label,
}: {
  states: ReadonlyArray<{ id: string; label: string }>;
  current: string;
  onSelect: (id: string) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="mx-6 mb-4 rounded-2xl border border-dashed border-border bg-secondary/40 p-2"
    >
      <p className="meta-label px-2 pt-1 pb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {states.map((s) => {
          const active = s.id === current;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              aria-pressed={active}
              className={cn(
                "h-8 px-3 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OnboardingHero({
  overline,
  title,
  hint,
  ctaLabel,
}: {
  overline: string;
  title: string;
  hint: string;
  ctaLabel: string;
}) {
  return (
    <Link
      to="/app/schedule"
      className="group block relative overflow-hidden hero-emerald text-primary-foreground rounded-3xl p-6 transition-transform duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className="absolute -right-8 -top-8 size-40 rounded-full bg-primary-foreground/10 blur-2xl pointer-events-none"
        aria-hidden
      />
      <div className="relative flex items-start gap-3">
        <div className="grid place-items-center size-11 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm shrink-0 ring-1 ring-primary-foreground/20">
          <CalendarClock className="size-5" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
            {overline}
          </p>
          <p className="font-extrabold text-xl leading-snug mt-1.5 text-balance">
            {title}
          </p>
          <p className="text-xs opacity-85 mt-1.5 leading-relaxed max-w-[32ch]">
            {hint}
          </p>
        </div>
      </div>
      <div className="relative mt-5 inline-flex items-center gap-2 bg-primary-foreground text-primary text-xs font-bold uppercase tracking-widest py-2.5 px-4 rounded-xl transition-transform duration-200 group-hover:translate-x-0.5">
        {ctaLabel}
      </div>
    </Link>
  );
}

/* Utility shimmer keyframe hook: define once in global CSS if missing. */
export const dashboardStateIds = [
  "default",
  "empty",
  "withOrders",
  "confirmed",
  "pending",
  "loading",
  "error",
  "offline",
] as const;
export type DashboardStateId = (typeof dashboardStateIds)[number];

export function isDashboardState(v: unknown): v is DashboardStateId {
  return typeof v === "string" && (dashboardStateIds as readonly string[]).includes(v);
}

// Small helper for accessible visually-hidden text
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
