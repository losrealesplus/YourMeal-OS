import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Users, LifeBuoy, CalendarDays, BookOpen, Factory,
  ShoppingCart, Boxes, Truck, Wallet, BarChart3, Megaphone, Settings, Palette,
  Home, Utensils, Package, User, Bell, Search, Plus, Minus, Check, X,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, ArrowRight, ArrowLeft,
  Clock, MapPin, Phone, Mail, Star, Heart, Filter, Download, Upload,
  AlertTriangle, Info, CheckCircle2, XCircle,
} from "lucide-react";
import { PanelCard } from "@/components/admin";

/**
 * ADMIN · Design System · Iconography
 * Objetivo operacional: Catalogar iconografía y reglas de uso
 * Capability:            platform.designSystem.iconography
 * Core Object:           Icon
 */
export const Route = createFileRoute("/_authenticated/admin/design-system/iconography")({
  component: IconographyPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Iconografía" },
      { name: "description", content: "Sistema de iconos Lucide y patrones de uso." },
    ],
  }),
});

const NAV_ICONS = [
  { c: LayoutDashboard, n: "LayoutDashboard" }, { c: Users, n: "Users" },
  { c: LifeBuoy, n: "LifeBuoy" }, { c: CalendarDays, n: "CalendarDays" },
  { c: BookOpen, n: "BookOpen" }, { c: Factory, n: "Factory" },
  { c: ShoppingCart, n: "ShoppingCart" }, { c: Boxes, n: "Boxes" },
  { c: Truck, n: "Truck" }, { c: Wallet, n: "Wallet" },
  { c: BarChart3, n: "BarChart3" }, { c: Megaphone, n: "Megaphone" },
  { c: Settings, n: "Settings" }, { c: Palette, n: "Palette" },
  { c: Home, n: "Home" }, { c: Utensils, n: "Utensils" },
  { c: Package, n: "Package" }, { c: User, n: "User" },
];

const ACTION_ICONS = [
  { c: Bell, n: "Bell" }, { c: Search, n: "Search" }, { c: Plus, n: "Plus" },
  { c: Minus, n: "Minus" }, { c: Check, n: "Check" }, { c: X, n: "X" },
  { c: ChevronRight, n: "ChevronRight" }, { c: ChevronLeft, n: "ChevronLeft" },
  { c: ChevronDown, n: "ChevronDown" }, { c: ChevronUp, n: "ChevronUp" },
  { c: ArrowRight, n: "ArrowRight" }, { c: ArrowLeft, n: "ArrowLeft" },
  { c: Filter, n: "Filter" }, { c: Download, n: "Download" }, { c: Upload, n: "Upload" },
];

const CONTEXT_ICONS = [
  { c: Clock, n: "Clock" }, { c: MapPin, n: "MapPin" }, { c: Phone, n: "Phone" },
  { c: Mail, n: "Mail" }, { c: Star, n: "Star" }, { c: Heart, n: "Heart" },
];

const STATUS_ICONS = [
  { c: CheckCircle2, n: "CheckCircle2", cls: "text-primary" },
  { c: AlertTriangle, n: "AlertTriangle", cls: "text-[oklch(0.68_0.16_75)]" },
  { c: XCircle, n: "XCircle", cls: "text-destructive" },
  { c: Info, n: "Info", cls: "text-chart-2" },
];

function IconGrid({ icons }: { icons: { c: React.ComponentType<{ className?: string }>; n: string; cls?: string }[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
      {icons.map(({ c: Icon, n, cls }) => (
        <div key={n} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors">
          <Icon className={`size-5 ${cls ?? "text-foreground"}`} />
          <p className="font-mono text-[10px] text-muted-foreground truncate w-full text-center">{n}</p>
        </div>
      ))}
    </div>
  );
}

function IconographyPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <PanelCard title={t("dsIconRules", { defaultValue: "Rules" })}>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li>• {t("dsIconRule1", { defaultValue: "Librería única: lucide-react. Nunca mezclar sets." })}</li>
          <li>• {t("dsIconRule2", { defaultValue: "Tamaños canónicos: size-4 (nav/inline), size-5 (acciones), size-6 (hero)." })}</li>
          <li>• {t("dsIconRule3", { defaultValue: "Color por currentColor. Tokens semánticos para estado (primary/warn/destructive)." })}</li>
          <li>• {t("dsIconRule4", { defaultValue: "Nunca decorativos sin propósito. Acompañan siempre a un label semántico." })}</li>
        </ul>
      </PanelCard>

      <PanelCard title={t("dsIconNav", { defaultValue: "Navigation" })}><IconGrid icons={NAV_ICONS} /></PanelCard>
      <PanelCard title={t("dsIconActions", { defaultValue: "Actions" })}><IconGrid icons={ACTION_ICONS} /></PanelCard>
      <PanelCard title={t("dsIconContext", { defaultValue: "Context" })}><IconGrid icons={CONTEXT_ICONS} /></PanelCard>
      <PanelCard title={t("dsIconStatus", { defaultValue: "Status" })}><IconGrid icons={STATUS_ICONS} /></PanelCard>
    </div>
  );
}
