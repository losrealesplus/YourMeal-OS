/**
 * ME005 — Zero Friction Publish & Preview (Experience only).
 *
 * Review the week → see readiness → fix → publish with confidence.
 * The week becomes ready for Orders and Production.
 */

import { useEffect, useMemo, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { StatusChip } from "@/components/admin";
import {
  assessWeekReadiness,
  prioritizeIssues,
  type ReadinessIssue,
} from "@/menu-experience/week-readiness";
import {
  formatWeekLabel,
  type WeekPlan,
} from "@/menu-experience/week-plan";
import { cn } from "@/lib/utils";

type Props = {
  plan: WeekPlan;
  canWrite: boolean;
  publishing?: boolean;
  onBack: () => void;
  onPublish: () => void | Promise<void>;
  onFixIssue?: (issue: ReadinessIssue) => void;
  onDuplicateDay?: (dayDate: string) => void;
  onReplaceDish?: (dayDate: string, slotId: string) => void;
};

function statusLabel(status: WeekPlan["status"]): string {
  switch (status) {
    case "published_durable":
      return "Publicado · durable";
    case "published_session":
      return "Publicado · sesión";
    case "preview":
      return "Vista previa";
    default:
      return "Borrador";
  }
}

function confidenceTone(
  c: "high" | "medium" | "low",
): "positive" | "warning" | "info" {
  if (c === "high") return "positive";
  if (c === "medium") return "warning";
  return "warning";
}

export function MenuPublishPreviewPanel({
  plan,
  canWrite,
  publishing = false,
  onBack,
  onPublish,
  onFixIssue,
  onDuplicateDay,
  onReplaceDish,
}: Props) {
  const publishRef = useRef<HTMLButtonElement>(null);
  const readiness = useMemo(() => assessWeekReadiness(plan), [plan]);
  const topIssues = useMemo(
    () => prioritizeIssues(readiness.issues, 12),
    [readiness.issues],
  );

  useEffect(() => {
    window.setTimeout(() => publishRef.current?.focus(), 0);
  }, [plan.weekStart]);

  const alreadyPublished =
    plan.status === "published_durable" || plan.status === "published_session";

  return (
    <section className="space-y-4" aria-labelledby="me-publish">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="me-publish" className="text-sm font-semibold tracking-wide">
            Publicar y previsualizar
          </h2>
          <p className="text-lg font-medium">
            {formatWeekLabel(plan.weekStart)}
          </p>
          <p className="text-xs text-muted-foreground">
            Revisar · validar · publicar con confianza
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs underline-offset-2 hover:underline"
        >
          Volver a editar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusChip
          tone={
            alreadyPublished
              ? "positive"
              : readiness.canPublish
                ? "info"
                : "warning"
          }
          label={statusLabel(plan.status)}
        />
        <StatusChip
          tone="info"
          label={`${readiness.activeCount} platos · ${readiness.daysCovered}/${readiness.daysTotal} días`}
        />
        <StatusChip
          tone={confidenceTone(readiness.confidence)}
          label={`Confianza ${readiness.confidence}`}
        />
        {readiness.macroGaps > 0 ? (
          <StatusChip
            tone="warning"
            label={`Macros · ${readiness.macroGaps} huecos`}
          />
        ) : (
          <StatusChip tone="positive" label="Macros · ok" />
        )}
        {readiness.allergenGaps > 0 ? (
          <StatusChip
            tone="warning"
            label={`Alérgenos · ${readiness.allergenGaps} huecos`}
          />
        ) : (
          <StatusChip tone="positive" label="Alérgenos · ok" />
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">
          Semana · por día
        </p>
        <ul className="space-y-3">
          {readiness.daySummaries.map((day) => (
            <li
              key={day.dayDate}
              className={cn(
                "rounded-md border border-border/60 px-3 py-2",
                day.empty && "border-dashed opacity-80",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {day.label}{" "}
                  <span className="font-normal text-muted-foreground">
                    {day.dayDate}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {day.empty ? (
                    <StatusChip tone="warning" label="Hueco" />
                  ) : (
                    <StatusChip
                      tone="info"
                      label={`${day.activeCount} plato(s)`}
                    />
                  )}
                  {onDuplicateDay && !day.empty ? (
                    <button
                      type="button"
                      disabled={!canWrite}
                      onClick={() => onDuplicateDay(day.dayDate)}
                      className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
                    >
                      Duplicar día
                    </button>
                  ) : null}
                  {onFixIssue && day.empty ? (
                    <button
                      type="button"
                      disabled={!canWrite}
                      onClick={() =>
                        onFixIssue({
                          code: "missing_day",
                          severity: "warn",
                          message: "missing",
                          dayDate: day.dayDate,
                        })
                      }
                      className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
                    >
                      Corregir
                    </button>
                  ) : null}
                </div>
              </div>
              <ul className="mt-1 space-y-1">
                {day.slots.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center gap-2 text-sm"
                  >
                    <span className="font-medium">{s.dishLabel}</span>
                    {!s.macrosHint ? (
                      <span className="text-xs text-muted-foreground">
                        · macros ?
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        · {s.macrosHint}
                      </span>
                    )}
                    {!s.allergenHint ? (
                      <span className="text-xs text-muted-foreground">
                        · alérgenos ?
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        · {s.allergenHint}
                      </span>
                    )}
                    {onReplaceDish ? (
                      <button
                        type="button"
                        disabled={!canWrite}
                        onClick={() => onReplaceDish(day.dayDate, s.id)}
                        className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
                      >
                        Reemplazar
                      </button>
                    ) : null}
                  </li>
                ))}
                {day.empty ? (
                  <li className="text-xs text-muted-foreground">Sin platos</li>
                ) : null}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      {topIssues.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Listos para publicar · avisos
          </p>
          <ul className="space-y-2">
            {topIssues.map((issue, idx) => (
              <li
                key={`${issue.code}-${issue.slotId ?? issue.dayDate ?? idx}`}
                className="flex flex-wrap items-start justify-between gap-2 text-sm"
              >
                <div>
                  <StatusChip
                    tone={
                      issue.severity === "block"
                        ? "warning"
                        : issue.severity === "warn"
                          ? "warning"
                          : "info"
                    }
                    label={issue.severity}
                  />{" "}
                  <span>{issue.message}</span>
                  {issue.fixHint ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {issue.fixHint}
                    </p>
                  ) : null}
                </div>
                {onFixIssue &&
                (issue.severity === "block" || issue.severity === "warn") ? (
                  <button
                    type="button"
                    disabled={!canWrite}
                    onClick={() => onFixIssue(issue)}
                    className="text-xs underline-offset-2 hover:underline disabled:opacity-40"
                  >
                    Corregir
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Los avisos no bloquean sin motivo. Publica cuando la operación esté
            clara.
          </p>
        </div>
      ) : null}

      <div className="space-y-2 rounded-md border border-border px-3 py-3">
        <p className="text-sm font-medium">Después de publicar</p>
        <p className="text-xs text-muted-foreground">
          La semana queda lista para{" "}
          <span className="font-medium text-foreground">Orders</span> y{" "}
          <span className="font-medium text-foreground">Production</span> —
          una semana operativa, no un menú suelto.
        </p>
        {readiness.readyForOrders ? (
          <div className="flex flex-wrap gap-2">
            <StatusChip tone="positive" label="Listo para Orders" />
            <StatusChip tone="positive" label="Listo para Production" />
          </div>
        ) : (
          <StatusChip tone="info" label="Pendiente de publicación" />
        )}
      </div>

      <button
        ref={publishRef}
        type="button"
        disabled={!canWrite || !readiness.canPublish || publishing}
        onClick={() => void onPublish()}
        className="min-h-12 w-full rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
      >
        {alreadyPublished
          ? "Republicar semana"
          : publishing
            ? "Publicando…"
            : "Publicar semana"}
      </button>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>Programar publicación → Future</span>
        <span>Rollback última publicación → Future</span>
        <Link
          to="/admin/order-capture"
          search={{
            mode: "search",
            customerId: undefined,
            kind: undefined,
          }}
          className="underline-offset-2 hover:underline"
        >
          Ir a Orders
        </Link>
      </div>
    </section>
  );
}
