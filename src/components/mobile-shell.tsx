import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Home, UtensilsCrossed, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-card flex flex-col relative pb-20">
        <div className="flex-1 flex flex-col">{children}</div>
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
    <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] h-20 border-t border-border bg-card/90 backdrop-blur-md flex justify-around items-center px-8">
      {items.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? pathname === to : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
