import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Camera, PenLine } from "lucide-react";
import { KpiCard, PanelCard, StatusChip } from "@/components/admin";
import { MOCK_DELIVERY_ATTEMPTS, type MockAttemptOutcome } from "@/lib/mock-admin";
import { useFmt } from "@/i18n/localization-provider";

/**
 * ADMIN · Delivery · Attempt Delivery
 * Objetivo operacional: Registrar cada intento de entrega con prueba (foto/firma)
 * Capability:            delivery.attempt.record
 * Core Object:           DeliveryAttempt
 */
export const Route = createFileRoute("/_authenticated/admin/routes/attempt")({
  component: AttemptPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Intentos de entrega" },
      { name: "description", content: "Registro de intentos de entrega con evidencia." },
    ],
  }),
});

function outcomeTone(o: MockAttemptOutcome) {
  if (o === "delivered" || o === "left_at_door") return "positive" as const;
  if (o === "no_answer") return "warning" as const;
  return "danger" as const;
}

function AttemptPage() {
  const { t } = useTranslation("admin");
  const fmt = useFmt();

  const successful = MOCK_DELIVERY_ATTEMPTS.filter(
    (a) => a.outcome === "delivered" || a.outcome === "left_at_door",
  ).length;
  const retries = MOCK_DELIVERY_ATTEMPTS.filter((a) => a.outcome === "no_answer").length;
  const problems = MOCK_DELIVERY_ATTEMPTS.filter(
    (a) => a.outcome === "wrong_address" || a.outcome === "refused" || a.outcome === "damaged",
  ).length;

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <KpiCard label={t("attemptTotal", { defaultValue: "Attempts" })} value={String(MOCK_DELIVERY_ATTEMPTS.length)} />
        <KpiCard label={t("attemptSuccess", { defaultValue: "Successful" })} value={String(successful)} trend="up" />
        <KpiCard label={t("attemptRetries", { defaultValue: "Retry needed" })} value={String(retries)} />
        <KpiCard label={t("attemptProblems", { defaultValue: "Problems" })} value={String(problems)} trend={problems > 0 ? "down" : "flat"} />
      </div>

      <PanelCard title={t("attemptTimeline", { defaultValue: "Attempt timeline" })}>
        <ul className="space-y-5">
          {MOCK_DELIVERY_ATTEMPTS.map((a) => (
            <li key={a.id} className="grid gap-2">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{a.stopCode}</p>
                  <p className="font-semibold truncate">{a.customer}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t("attemptNumber", { defaultValue: "Attempt" })} #{a.attempt}
                  </span>
                  <StatusChip
                    tone={outcomeTone(a.outcome)}
                    label={t(`attemptOutcomes.${a.outcome}`, { defaultValue: a.outcome })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className={a.photo ? "text-foreground" : "opacity-40"}>
                    <Camera className="size-3.5 inline mr-1" />
                    {t("attemptPhoto", { defaultValue: "Photo" })}
                  </span>
                  <span className={a.signature ? "text-foreground" : "opacity-40"}>
                    <PenLine className="size-3.5 inline mr-1" />
                    {t("attemptSignature", { defaultValue: "Signature" })}
                  </span>
                </div>
                <span>{fmt.dateTime(new Date(a.timestampIso))}</span>
              </div>
              {a.note && (
                <p className="text-xs text-muted-foreground border-l-2 border-border pl-3 italic">{a.note}</p>
              )}
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}
