import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock,
  Heart,
  MapPin,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  PrimaryCTA,
  DashboardSkeleton,
  DashboardError,
  OfflineBanner,
  DashboardStateSwitcher,
  UpcomingDeliveryCard,
  dashboardStateIds,
  isDashboardState,
  type DashboardStateId,
} from "@/components/consumer";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { BrandLeafMark } from "@/components/tenant/brand-leaf-mark";
import { PoweredByLine } from "@/components/tenant/tenant-brand-scope";
import { useWeeklyMenu } from "@/hooks/use-weekly-menu";
import { useUpcomingDelivery } from "@/hooks/use-upcoming-delivery";
import { useCustomerOrders } from "@/hooks/use-customer-orders";
import { useCustomerSelfProfile } from "@/hooks/use-customer-self-profile";
import { useTenantActiveWeek } from "@/hooks/use-tenant-active-week";
import { utcWeekStartMonday, utcWeekDates } from "@/modules/weekly-menu/application/week-dates";
import { cn } from "@/lib/utils";
import dishPhoto from "@/assets/eatclean-hero.jpg";

/**
 * SCR-005 · Customer Home — CX-01A Warm Premium Experience
 * "La tecnología trabaja detrás. El bienestar se siente delante"
 */
export const Route = createFileRoute("/_authenticated/app/")({
  validateSearch: (search: Record<string, unknown>): { state?: DashboardStateId } => ({
    state: isDashboardState(search.state) ? search.state : undefined,
  }),
  component: CustomerHome,
});

export type CustomerHomeState =
  | "new_profile"
  | "missing_address"
  | "unprogrammed"
  | "draft_pending"
  | "confirmed_delivery";

export interface CustomerHomeContextData {
  hasProfile: boolean;
  hasAddress: boolean;
  totalPortions: number;
  hasUpcomingConfirmed: boolean;
  hasDraftOrder?: boolean;
}

export function getTimeOfDayGreeting(now: Date = new Date()): {
  greeting: string;
  emoji: string;
} {
  const hour = now.getHours();
  if (hour >= 6 && hour < 13) {
    return { greeting: "¡Buenos días", emoji: "☀️" };
  } else if (hour >= 13 && hour < 21) {
    return { greeting: "¡Buenas tardes", emoji: "🌤️" };
  } else {
    return { greeting: "¡Buenas noches", emoji: "🌙" };
  }
}

export function resolveCustomerHomeState(data: CustomerHomeContextData): CustomerHomeState {
  if (!data.hasProfile) {
    return "new_profile";
  }
  if (!data.hasAddress) {
    return "missing_address";
  }
  if (data.totalPortions > 0 || data.hasUpcomingConfirmed) {
    return "confirmed_delivery";
  }
  if (data.hasDraftOrder) {
    return "draft_pending";
  }
  return "unprogrammed";
}

export function getAdaptiveCTA(state: CustomerHomeState) {
  switch (state) {
    case "new_profile":
      return {
        headline: "Tu alimentación, organizada",
        subtitle: "Empecemos por tus preferencias para personalizar tus menús y recomendaciones.",
        ctaLabel: "Configurar mi perfil",
        ctaTo: "/app/settings/profile" as const,
        ctaIcon: Sparkles,
      };
    case "missing_address":
      return {
        headline: "Añade tu dirección",
        subtitle: "Para planificar tus entregas semanales necesitamos saber dónde llevar tu comida.",
        ctaLabel: "Añadir dirección de entrega",
        ctaTo: "/app/addresses" as const,
        ctaIcon: MapPin,
      };
    case "draft_pending":
      return {
        headline: "Tienes un pedido pendiente",
        subtitle: "Confirma tu selección para asegurar tus platos de la semana antes del cierre de pedidos.",
        ctaLabel: "Completar mi pedido",
        ctaTo: "/app/orders" as const,
        ctaIcon: ClipboardList,
      };
    case "unprogrammed":
      return {
        headline: "Tu semana está por organizar",
        subtitle: "¿Elegimos tus platos? Elige las raciones y los días que mejor se adapten a tu ritmo.",
        ctaLabel: "Elegir mis platos",
        ctaTo: "/app/schedule" as const,
        ctaIcon: UtensilsCrossed,
      };
    case "confirmed_delivery":
      return {
        headline: "Todo bajo control",
        subtitle: "Tu próxima entrega está en marcha. Disfruta de una alimentación cuidada sin complicaciones.",
        ctaLabel: "Revisar mi semana",
        ctaTo: "/app/orders" as const,
        ctaIcon: CalendarDays,
      };
  }
}

function CustomerHome() {
  const { t } = useTranslation(["customer", "common"]);
  const { isStaff } = useAuth();
  const navigate = useNavigate({ from: "/app" });
  const search = Route.useSearch();
  const state: DashboardStateId = search.state ?? "default";

  const stateOptions = dashboardStateIds.map((id) => ({
    id,
    label: t(`customer:state${id.charAt(0).toUpperCase()}${id.slice(1)}` as const),
  }));

  return (
    <div className="flex-1 flex flex-col">
      {isStaff ? (
        <div className="opacity-40 hover:opacity-100 transition-opacity">
          <DashboardStateSwitcher
            states={stateOptions}
            current={state}
            onSelect={(id) =>
              navigate({
                search: () => ({
                  state: id === "default" ? undefined : (id as DashboardStateId),
                }),
              })
            }
            label={t("customer:dashboardState")}
          />
        </div>
      ) : null}
      <HomeBody state={state} />
    </div>
  );
}

function HomeBody({ state }: { state: DashboardStateId }) {
  const { t } = useTranslation("customer");
  const { user, isStaff } = useAuth();
  const navigate = useNavigate({ from: "/app" });
  const activeWeek = useTenantActiveWeek();
  const weekStart = activeWeek.weekStart;

  // Primary data sources for Customer Experience
  const {
    data: upcoming,
    isLoading: upcomingLoading,
    refetch: refetchUpcoming,
  } = useUpcomingDelivery();
  const {
    data: customerOrders,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useCustomerOrders();
  const { profile: profileQuery } = useCustomerSelfProfile();
  // Fetch weekly menu for catalog awareness
  useWeeklyMenu(weekStart);

  if (state === "loading") {
    return <DashboardSkeleton label={t("loadingDashboard")} />;
  }

  if (state === "error") {
    return (
      <DashboardError
        title={t("errorTitle")}
        hint={t("errorHint")}
        retryLabel={t("retry")}
        onRetry={() => navigate({ search: () => ({ state: undefined }) })}
      />
    );
  }

  // 1. Initial loading shimmer: protect against displaying "semana sin organizar" while data is still loading
  const isInitialLoading =
    (profileQuery.isLoading && !profileQuery.data) ||
    (ordersLoading && customerOrders === undefined) ||
    (upcomingLoading && upcoming === undefined);

  if (isInitialLoading && state === "default") {
    return <DashboardSkeleton label={t("loadingDashboard")} />;
  }

  // 2. Query error handling: do not interpret query failure as confirmed absence of orders
  const hasQueryError =
    (Boolean(profileQuery.error) && !profileQuery.data) ||
    (Boolean(ordersError) && customerOrders === undefined);

  if (hasQueryError && state === "default") {
    return (
      <DashboardError
        title="No pudimos cargar tus pedidos"
        hint="Comprueba tu conexión e inténtalo de nuevo para ver el estado de tu semana."
        retryLabel={t("retry")}
        onRetry={() => {
          void refetchOrders();
          void refetchUpcoming();
        }}
      />
    );
  }

  // 3. Resolve Customer Name
  const profileName = profileQuery.data?.displayName?.trim();
  const authName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ??
    (user?.user_metadata?.name as string | undefined)?.trim() ??
    user?.email?.split("@")[0] ??
    "";
  const fullName = profileName || authName || "";
  const firstName = fullName.split(" ")[0] || "";

  // 4. Daytime Greeting
  const { greeting, emoji } = getTimeOfDayGreeting();
  const greetingText = firstName ? `${greeting}, ${firstName}!` : `${greeting}!`;

  // 5. Addresses & Profile completeness
  const activeAddresses = profileQuery.data?.addresses?.filter((a) => !a.archived) ?? [];
  const hasProfile = Boolean(profileName);
  const hasAddress = activeAddresses.length > 0;
  const hasUpcomingConfirmed =
    upcoming?.kind === "upcoming" && upcoming.delivery.phase !== "scheduled";

  // 6. Weekly schedule computation without data invention
  // Filter active week orders (excluding cancelled)
  const activeWeekOrders = (customerOrders ?? []).filter(
    (o) => o.weekStart === weekStart && o.status !== "cancelled",
  );

  // Strictly differentiate confirmed vs draft orders
  const confirmedWeekOrders = activeWeekOrders.filter((o) => o.status !== "draft");
  const draftWeekOrders = activeWeekOrders.filter((o) => o.status === "draft");

  let totalPortions = 0;
  const scheduledDayDates = new Set<string>();
  for (const order of confirmedWeekOrders) {
    totalPortions += order.itemCount;
    if (order.dayDates && order.dayDates.length > 0) {
      for (const d of order.dayDates) {
        scheduledDayDates.add(d);
      }
    } else if (order.deliveryDate) {
      scheduledDayDates.add(order.deliveryDate);
    }
  }

  let draftPortions = 0;
  for (const order of draftWeekOrders) {
    draftPortions += order.itemCount;
  }

  const scheduledDays = scheduledDayDates.size;
  // Accurately labeled metric: confirmed orders count (never equating orders with deliveries)
  const confirmedOrdersCount = confirmedWeekOrders.length;
  const hasDraftOrder = draftWeekOrders.length > 0;

  // 7. Contextual State Resolution
  let resolvedState: CustomerHomeState;
  if (state === "empty") {
    resolvedState = "unprogrammed";
  } else if (state === "confirmed" || state === "withOrders") {
    resolvedState = "confirmed_delivery";
  } else if (profileQuery.isSuccess && !hasProfile) {
    resolvedState = "new_profile";
  } else if (profileQuery.isSuccess && !hasAddress) {
    resolvedState = "missing_address";
  } else if (totalPortions > 0 || hasUpcomingConfirmed) {
    resolvedState = "confirmed_delivery";
  } else if (hasDraftOrder) {
    resolvedState = "draft_pending";
  } else {
    resolvedState = "unprogrammed";
  }

  const adaptive = getAdaptiveCTA(resolvedState);
  const CTAIcon = adaptive.ctaIcon;

  // 7-day strip calculation (Monday to Sunday)
  const weekDates = utcWeekDates(weekStart);
  const DAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div className="flex-1 flex flex-col px-6 pt-6 pb-12">
      {state === "offline" ? (
        <div className="mb-4">
          <OfflineBanner title={t("offlineTitle")} hint={t("offlineHint")} />
        </div>
      ) : null}

      {/* Brand Identity */}
      <div className="flex justify-center">
        <TenantLogo height={42} />
      </div>

      {/* Hero Greeting & Status */}
      <header className="mt-8 text-center space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          {greetingText} <span className="inline-block" role="img" aria-label="saludo">{emoji}</span>
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-balance text-foreground">
          {adaptive.headline}
        </h1>
        <p className="text-sm font-medium leading-relaxed text-muted-foreground text-pretty max-w-[22rem] mx-auto">
          {adaptive.subtitle}
        </p>
      </header>

      {/* Adaptive Primary CTA */}
      <div className="mt-6">
        <Link to={adaptive.ctaTo} className="block w-full">
          <PrimaryCTA className="!h-14 !text-base !rounded-2xl flex items-center justify-center gap-2.5 shadow-sm">
            <CTAIcon className="size-5" />
            <span>{adaptive.ctaLabel}</span>
          </PrimaryCTA>
        </Link>
      </div>

      {/* Next Delivery Card */}
      <div className="mt-8">
        <UpcomingDeliveryCard result={upcoming} isLoading={upcomingLoading} />
      </div>

      {/* Weekly Progress Strip (Ritmo semanal) */}
      <div className="mt-6">
        {totalPortions > 0 ? (
          <section className="surface-raised rounded-3xl border border-border/70 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Ritmo semanal
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                <span>{scheduledDays} {scheduledDays === 1 ? "día activo" : "días activos"}</span>
              </div>
            </div>

            {/* Metric Pills */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-secondary/50 border border-border/40">
                <span className="text-[11px] text-muted-foreground font-medium">Días</span>
                <span className="text-lg font-extrabold text-foreground tabular-nums">{scheduledDays}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-secondary/50 border border-border/40">
                <span className="text-[11px] text-muted-foreground font-medium">Raciones</span>
                <span className="text-lg font-extrabold text-foreground tabular-nums">{totalPortions}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-secondary/50 border border-border/40">
                <span className="text-[11px] text-muted-foreground font-medium">Pedidos</span>
                <span className="text-lg font-extrabold text-foreground tabular-nums">{confirmedOrdersCount}</span>
              </div>
            </div>

            {/* Notice for additional draft orders if any */}
            {hasDraftOrder && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Clock className="size-4 shrink-0 text-amber-600" />
                  <span>
                    {draftWeekOrders.length === 1
                      ? "1 pedido adicional en borrador"
                      : `${draftWeekOrders.length} pedidos adicionales en borrador`}
                  </span>
                </div>
                <Link
                  to="/app/orders"
                  className="font-bold text-amber-900 dark:text-amber-100 underline hover:no-underline text-xs"
                >
                  Ver
                </Link>
              </div>
            )}

            {/* 7-Day Visual Strip */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {weekDates.map((dateStr, idx) => {
                const isScheduled = scheduledDayDates.has(dateStr);
                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "flex flex-col items-center justify-center py-2.5 rounded-xl transition-all",
                      isScheduled
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "bg-secondary/40 text-muted-foreground/70 font-medium",
                    )}
                  >
                    <span className="text-[11px] uppercase tracking-wider">{DAY_LETTERS[idx]}</span>
                    <span
                      className={cn(
                        "size-1.5 rounded-full mt-1.5",
                        isScheduled ? "bg-primary-foreground" : "bg-transparent",
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ) : hasDraftOrder ? (
          <section className="surface-raised rounded-3xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Ritmo semanal · Borrador
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <Clock className="size-3.5" />
                <span>Pendiente de confirmar</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] text-muted-foreground font-medium">Raciones elegidas</span>
                <span className="text-lg font-extrabold text-foreground tabular-nums">{draftPortions}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] text-muted-foreground font-medium">Borradores</span>
                <span className="text-lg font-extrabold text-foreground tabular-nums">{draftWeekOrders.length}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Tus platos seleccionados no están confirmados todavía. Finaliza tu pedido para asegurar la elaboración en cocina.
            </p>
            <Link
              to="/app/orders"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <span>Completar pedido ahora</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </section>
        ) : (
          <section className="surface-raised rounded-3xl border border-border/70 bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Ritmo semanal
              </p>
              <span className="text-xs text-muted-foreground">0 raciones esta semana</span>
            </div>

            {/* Neutral 7-Day Strip */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {weekDates.map((dateStr, idx) => (
                <div
                  key={dateStr}
                  className="flex flex-col items-center justify-center py-2.5 rounded-xl bg-secondary/30 text-muted-foreground/60 font-medium"
                >
                  <span className="text-[11px] uppercase tracking-wider">{DAY_LETTERS[idx]}</span>
                  <span className="size-1.5 rounded-full mt-1.5 bg-transparent" />
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              Planifica de 1 a 7 días según tu ritmo de vida. Tú decides cuándo y cuántas comidas recibir.
            </p>
          </section>
        )}
      </div>

      {/* Editorial Gastro Card */}
      <section className="mt-8 overflow-hidden rounded-3xl border border-border/70 bg-card surface-raised shadow-sm">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          <img
            src={dishPhoto}
            alt="Alimentación saludable EatClean"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-foreground shadow-sm">
              ✨ Bienestar diario
            </span>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <h3 className="text-base font-bold text-foreground leading-snug">
            Tu alimentación, organizada
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Consulta tus próximas comidas y disfruta de tu día con platos equilibrados preparados con ingredientes frescos.
          </p>
          <div className="pt-1">
            <Link
              to="/app/menu"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              <span>Explorar menú semanal</span>
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Actions Navigation Grid */}
      <section className="mt-8 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
          Accesos rápidos
        </p>
        <div className="grid grid-cols-1 gap-2.5">
          <Link
            to="/app/menu"
            className="flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card surface-raised transition-all active:scale-[0.99] hover:border-primary/40"
          >
            <div className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary shrink-0">
              <UtensilsCrossed className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Mi menú</p>
              <p className="text-xs text-muted-foreground truncate">
                Platos equilibrados de la semana
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/60 shrink-0" />
          </Link>

          <Link
            to="/app/orders"
            className="flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card surface-raised transition-all active:scale-[0.99] hover:border-primary/40"
          >
            <div className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary shrink-0">
              <ClipboardList className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Mis pedidos</p>
              <p className="text-xs text-muted-foreground truncate">
                Historial y seguimiento de entregas
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/60 shrink-0" />
          </Link>

          <Link
            to="/app/settings/dietary"
            className="flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card surface-raised transition-all active:scale-[0.99] hover:border-primary/40"
          >
            <div className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary shrink-0">
              <Heart className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Mis preferencias</p>
              <p className="text-xs text-muted-foreground truncate">
                Alergias, restricciones y estilo de vida
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/60 shrink-0" />
          </Link>
        </div>
      </section>

      {/* Footer / Ops Center Entry */}
      <footer className="mt-12 flex flex-col items-center gap-3 pb-2">
        {isStaff ? <BrandLeafMark /> : null}
        <PoweredByLine />
      </footer>
    </div>
  );
}
