import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  User as UserIcon,
  MapPin,
  Heart,
  Bell,
  CreditCard,
  History,
  Building,
  Sparkles,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { signOut as authSignOut } from "@/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCustomerSelfProfile } from "@/hooks/use-customer-self-profile";
import { LanguageSelector } from "@/components/language-selector";
import { ScreenHeader, PrimaryCTA } from "@/components/consumer";
import { cn } from "@/lib/utils";

/**
 * Screen: Customer · Account / Profile Hub — CX-01B Warm Premium
 * - Reusable design tokens, zero dead buttons, crystal-clear routing.
 * - Core Objects: CustomerProfile, CustomerAddresses
 */
export const Route = createFileRoute("/_authenticated/app/settings/")({
  component: SettingsPage,
});

interface SettingsItem {
  key: string;
  label: string;
  description: string;
  icon: typeof UserIcon;
  to: string;
}

interface SettingsGroup {
  title: string;
  items: SettingsItem[];
}

function SettingsPage() {
  const { t } = useTranslation(["customer", "common"]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { profile: profileQuery } = useCustomerSelfProfile();
  const profile = profileQuery.data;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await authSignOut();
    navigate({ to: "/auth", replace: true });
  }

  // Pure functional routes only — no dead buttons
  const groups: SettingsGroup[] = [
    {
      title: "Cuenta y Perfil",
      items: [
        {
          key: "profile",
          label: "Datos personales",
          description: "Nombre, correo y teléfono de contacto",
          icon: UserIcon,
          to: "/app/settings/profile",
        },
        {
          key: "addresses",
          label: "Direcciones de entrega",
          description: "Direcciones guardadas para tus repartos",
          icon: MapPin,
          to: "/app/addresses",
        },
        {
          key: "companyPortal",
          label: "Portal de empresa",
          description: "Gestión de ventajas y centros de trabajo",
          icon: Building,
          to: "/app/company",
        },
      ],
    },
    {
      title: "Alimentación y Menú",
      items: [
        {
          key: "allergies",
          label: "Alergias y preferencias",
          description: "Alérgenos declarados y notas para cocina",
          icon: Heart,
          to: "/app/settings/dietary",
        },
        {
          key: "favorites",
          label: "Platos favoritos",
          description: "Tus comidas preferidas de la carta",
          icon: Sparkles,
          to: "/app/favorites",
        },
      ],
    },
    {
      title: "Pedidos y Pagos",
      items: [
        {
          key: "orderHistory",
          label: "Historial de pedidos",
          description: "Seguimiento y resumen de tus semanas",
          icon: History,
          to: "/app/orders",
        },
        {
          key: "payment",
          label: "Métodos de pago",
          description: "Información de facturación y pagos",
          icon: CreditCard,
          to: "/app/payment-methods",
        },
      ],
    },
    {
      title: "Preferencias de la App",
      items: [
        {
          key: "notifications",
          label: "Notificaciones",
          description: "Avisos de reparto y recordatorios de menú",
          icon: Bell,
          to: "/app/notifications",
        },
      ],
    },
  ];

  const profileName = profile?.displayName?.trim();
  const authName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ??
    user?.email?.split("@")[0] ??
    "";
  const displayName = profileName || authName || "Usuario";
  const email = profile?.email || user?.email || "";
  const phone = profile?.phone || "";
  const activeAddresses = profile?.addresses?.filter((a) => !a.archived) ?? [];
  const addressCount = activeAddresses.length;

  return (
    <div className="flex-1 flex flex-col pb-8">
      <ScreenHeader
        overline={t("common:tenant", "EatClean")}
        title={t("customer:settings", "Mi cuenta")}
      />

      {/* Profile Overview Card */}
      <div className="px-6">
        <Link
          to="/app/settings/profile"
          className="surface-raised border border-border/60 rounded-3xl p-5 flex items-center gap-4 transition-all hover:border-primary/40 active:scale-[0.99] group shadow-sm"
        >
          <div className="grid place-items-center size-14 rounded-2xl hero-emerald text-primary-foreground text-xl font-extrabold shrink-0 shadow-sm">
            {(displayName || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-extrabold text-base text-foreground truncate">{displayName}</p>
              <ShieldCheck className="size-4 text-primary shrink-0" aria-label="Cuenta activa" />
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{email}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {phone ? (
                <span className="inline-flex items-center text-[10px] font-bold text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-md">
                  {phone}
                </span>
              ) : null}
              <span className="inline-flex items-center text-[10px] font-bold text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-md">
                {addressCount === 1 ? "1 dirección" : `${addressCount} direcciones`}
              </span>
            </div>
          </div>
          <ChevronRight className="size-5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 shrink-0" />
        </Link>
      </div>

      {/* Settings Navigation Groups */}
      <div className="px-6 space-y-6 mt-6">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="h-3 w-0.5 rounded-full bg-primary" aria-hidden />
              <p className="meta-label">{group.title}</p>
            </div>
            <div className="surface-raised border border-border/60 rounded-3xl overflow-hidden divide-y divide-border/50 shadow-sm">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-secondary/40 active:bg-secondary/60 group"
                  >
                    <span className="grid place-items-center size-9 rounded-xl bg-primary/10 text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Language Selector */}
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="h-3 w-0.5 rounded-full bg-primary" aria-hidden />
            <p className="meta-label">{t("customer:language", "Idioma")}</p>
          </div>
          <div className="surface-raised border border-border/60 rounded-3xl p-4 flex items-center justify-between shadow-sm">
            <span className="text-sm font-semibold text-foreground">
              {t("common:selectLanguage", "Idioma de la app")}
            </span>
            <LanguageSelector />
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="pt-2">
          <PrimaryCTA
            variant="outline"
            onClick={signOut}
            className="!h-13 !rounded-2xl flex items-center justify-center gap-2 border-destructive/30 hover:bg-destructive/10 text-destructive"
          >
            <LogOut className="size-4" />
            <span className="font-bold">{t("common:signOut", "Cerrar sesión")}</span>
          </PrimaryCTA>
        </div>
      </div>
    </div>
  );
}
