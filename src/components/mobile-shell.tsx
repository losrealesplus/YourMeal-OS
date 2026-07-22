import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Home, UtensilsCrossed, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-background flex flex-col relative pb-24">
        <div className="flex-1 flex flex-col animate-fade-in">{children}</div>
        <BottomNav />
      </div>
    </div>
  );
}

function BottomNav() {
  const { t } = useTranslation("customer");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/app", label: t("home"), icon: Home, exact: true },
    { to: "/app/menu", label: t("menu"), icon: UtensilsCrossed, exact: false },
    { to: "/app/orders", label: t("orders"), icon: ClipboardList, exact: false },
    { to: "/app/settings", label: t("settings"), icon: User, exact: false },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] border-t border-border/70 bg-card/85 backdrop-blur-xl safe-bottom"
      style={{ paddingTop: "0.5rem" }}
    >
      <ul className="flex justify-around items-stretch px-3">
        {items.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "group relative flex flex-col items-center gap-1 py-2 rounded-2xl transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid place-items-center size-9 rounded-xl transition-all duration-200",
                    active
                      ? "bg-primary/12 scale-100"
                      : "bg-transparent scale-95 group-active:scale-90",
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-tighter transition-opacity",
                    active ? "opacity-100" : "opacity-80",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
