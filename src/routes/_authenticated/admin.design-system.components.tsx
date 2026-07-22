import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PanelCard, KpiCard, StatusChip, DataTable } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * ADMIN · Design System · Components
 * Objetivo operacional: Catalogar componentes reutilizables
 * Capability:            platform.designSystem.components
 * Core Object:           Component
 */
export const Route = createFileRoute("/_authenticated/admin/design-system/components")({
  component: ComponentsPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Componentes" },
      { name: "description", content: "Componentes primitivos y de dominio." },
    ],
  }),
});

const SAMPLE_ROWS = [
  { id: "1", code: "R-001", name: "Route Norte",  stops: 12, status: "in_progress" as const },
  { id: "2", code: "R-002", name: "Route Sur",    stops:  9, status: "planned" as const },
  { id: "3", code: "R-003", name: "Route Centro", stops: 15, status: "completed" as const },
];

function ComponentsPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="space-y-6">
      <PanelCard title={t("dsKpiCards", { defaultValue: "KPI cards" })}>
        <div className="grid gap-3 md:grid-cols-4">
          <KpiCard label={t("dsKpiOrders", { defaultValue: "Orders" })} value="128" trend="up" />
          <KpiCard label={t("dsKpiRevenue", { defaultValue: "Revenue" })} value="€ 4.812" trend="up" />
          <KpiCard label={t("dsKpiIssues", { defaultValue: "Issues" })} value="3" trend="down" />
          <KpiCard label={t("dsKpiStock", { defaultValue: "Stock alerts" })} value="7" />
        </div>
      </PanelCard>

      <div className="grid gap-6 md:grid-cols-2">
        <PanelCard title={t("dsButtons", { defaultValue: "Buttons" })}>
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </div>
        </PanelCard>

        <PanelCard title={t("dsBadges", { defaultValue: "Badges" })}>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </PanelCard>

        <PanelCard title={t("dsInputs", { defaultValue: "Inputs" })}>
          <div className="space-y-3 max-w-sm">
            <Input placeholder="Email" />
            <Input placeholder="Disabled" disabled />
            <div className="flex items-center gap-3">
              <Switch id="sw" />
              <label htmlFor="sw" className="text-sm">Enable notifications</label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="ck" />
              <label htmlFor="ck" className="text-sm">Accept terms</label>
            </div>
          </div>
        </PanelCard>

        <PanelCard title={t("dsChips", { defaultValue: "Status chips" })}>
          <div className="flex flex-wrap gap-3">
            <StatusChip tone="positive" label="Delivered" />
            <StatusChip tone="info" label="In progress" />
            <StatusChip tone="warning" label="Pending" />
            <StatusChip tone="danger" label="Failed" />
            <StatusChip tone="neutral" label="Draft" />
          </div>
        </PanelCard>
      </div>

      <PanelCard title={t("dsDataTable", { defaultValue: "Data table" })}>
        <DataTable
          rows={SAMPLE_ROWS}
          columns={[
            { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
            { key: "name", header: "Name", render: (r) => <span className="font-semibold">{r.name}</span> },
            { key: "stops", header: "Stops", render: (r) => <span className="font-mono tabular-nums">{r.stops}</span> },
            {
              key: "status", header: "Status",
              render: (r) => (
                <StatusChip
                  tone={r.status === "completed" ? "positive" : r.status === "in_progress" ? "info" : "neutral"}
                  label={r.status}
                />
              ),
            },
          ]}
        />
      </PanelCard>
    </div>
  );
}
