import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/app/menu")({
  component: MenuPage,
});

function MenuPage() {
  const { t } = useTranslation(["customer", "common"]);
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 pt-10 pb-4">
        <p className="meta-label">{t("common:tenant")}</p>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1">
          {t("customer:weeklyMenu")}
        </h1>
      </header>
      <div className="px-6 flex gap-2 overflow-x-auto pb-4">
        {days.map((d, i) => (
          <button
            key={d}
            className={
              "size-12 rounded-xl border border-border font-bold text-sm shrink-0 " +
              (i === 0 ? "bg-foreground text-background" : "bg-card")
            }
          >
            {d}
          </button>
        ))}
      </div>
      <div className="px-6 space-y-3 pb-6">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="bg-card border border-border rounded-2xl p-4 flex gap-4"
          >
            <div className="size-20 rounded-xl bg-secondary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="meta-label">Course {n}</p>
              <p className="font-bold truncate">{t("common:comingSoon")}</p>
              <p className="text-xs text-muted-foreground mt-1">— kcal</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
