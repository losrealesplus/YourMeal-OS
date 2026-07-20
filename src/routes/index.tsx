import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/language-selector";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YourMeal OS — The Operating System for Meal Prep & Catering" },
      {
        name: "description",
        content:
          "Every customer order automatically generates the full operational plan for every department. Kitchen, purchasing, inventory, production, routes and accounting — one source of truth.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useTranslation("common");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-2">
          <div className="size-6 bg-foreground rounded" />
          <span className="font-extrabold tracking-tighter">YourMeal OS</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Link
            to="/auth"
            className="text-xs font-bold uppercase tracking-widest bg-foreground text-background px-4 py-2 rounded-lg"
          >
            {t("signIn")}
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 lg:px-12 pt-16 pb-24">
        <p className="meta-label">Meal-prep operating system</p>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mt-4 text-balance">
          {t("tagline")}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl text-pretty">
          One source of truth for kitchen, purchasing, inventory, production and
          delivery routes. Every customer order automatically generates the
          full operational plan. No Excel. No WhatsApp coordination. No duplicated
          data.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="bg-foreground text-background text-sm font-bold px-6 py-3 rounded-lg"
          >
            {t("signIn")}
          </Link>
          <a
            href="#modules"
            className="border border-border bg-card text-sm font-bold px-6 py-3 rounded-lg"
          >
            {t("exploreModules")}
          </a>
        </div>

        <section id="modules" className="mt-24 grid gap-4 md:grid-cols-3">
          {[
            ["Kitchen", "Real-time production plan from tomorrow's orders."],
            ["Purchasing", "Auto-calculated shopping list, sorted by supplier."],
            ["Inventory", "Shared stock. Waste, thawing, remaining — always live."],
            ["Production", "Individual labels per customer. Allergies applied."],
            ["Routes", "Google Maps optimized deliveries and driver tracking."],
            ["Accounting", "Grouped company billing, invoices, payments."],
          ].map(([title, body]) => (
            <div
              key={title}
              className="bg-card border border-border ring-1 ring-black/[0.03] rounded-2xl p-6"
            >
              <p className="meta-label">Module</p>
              <h3 className="text-lg font-bold mt-2">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center meta-label">
        YourMeal OS · Multi-tenant · Built for {t("tenant")}
      </footer>
    </div>
  );
}
