import { supabase } from "@/integrations/supabase/client";
import type { EconomicOpportunity } from "../domain/types";
import { isValidUuid } from "../domain/uuid";
import type {
  IngestionReport,
  MarketCatalogIngestionService,
} from "./market-catalog-ingestion-service";

export interface PersistDecisionIntentParams {
  supabaseClient?: typeof supabase;
  tenantId: string;
  userId?: string;
  userName?: string;
  activeScenarioId?: string | null;
  onScenarioCreated?: (scenarioId: string) => void;
  opportunity: EconomicOpportunity;
  ingredientsCount: number;
  dishesCount: number;
  intentType: string;
  targetPrice: string;
  targetDate: string;
  intentRationale: string;
}

export async function persistDecisionIntent({
  supabaseClient = supabase,
  tenantId,
  userId,
  userName = "Gerente",
  activeScenarioId = null,
  onScenarioCreated,
  opportunity: op,
  ingredientsCount,
  dishesCount,
  intentType,
  targetPrice,
  targetDate,
  intentRationale,
}: PersistDecisionIntentParams): Promise<NonNullable<EconomicOpportunity["recordedDecision"]>> {
  if (!tenantId) {
    throw new Error("Falta tenantId para registrar la decisión.");
  }
  if (!intentRationale.trim()) {
    throw new Error("Describe la justificación de la decisión antes de guardar.");
  }

  const targetNum =
    targetPrice.trim().length > 0 && !Number.isNaN(Number(targetPrice))
      ? Number(targetPrice)
      : (op.benchmarkPriceExTax ?? undefined);

  let resolvedScenarioId = activeScenarioId || null;

  if (!resolvedScenarioId) {
    const { data: latestScenario, error: lookupError } = await supabaseClient
      .from("cost_simulation_scenarios")
      .select("id")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      throw new Error(`No se pudo consultar el escenario activo: ${lookupError.message}`);
    }

    if (latestScenario?.id) {
      resolvedScenarioId = latestScenario.id;
      onScenarioCreated?.(latestScenario.id);
    } else {
      const baselinePayload = {
        snapshotId: `baseline-${tenantId}-${Date.now()}`,
        capturedAt: new Date().toISOString(),
        tenantId,
        source: "market_intelligence_command_center",
        ingredientsCount,
        dishesCount,
      };

      const { data: createdScenario, error: createScenarioErr } = await supabaseClient
        .from("cost_simulation_scenarios")
        .insert({
          tenant_id: tenantId,
          name: `Baseline Market Intelligence (${new Date().toISOString().slice(0, 10)})`,
          preset_type: "custom",
          baseline_snapshot_id: baselinePayload.snapshotId,
          baseline_snapshot: baselinePayload,
          applied_variables: { ingredientId: op.ingredientId },
          status: "simulated",
          created_by: isValidUuid(userId) ? userId : null,
        })
        .select("id")
        .single();

      if (createScenarioErr || !createdScenario?.id) {
        throw new Error(
          `No se pudo crear el escenario base requerido: ${createScenarioErr?.message || "Sin respuesta"}`,
        );
      }

      resolvedScenarioId = createdScenario.id;
      onScenarioCreated?.(createdScenario.id);
    }
  }

  const allowedIntentType =
    intentType === "renegotiate_supplier" ||
    intentType === "adjust_menu_price" ||
    intentType === "reformulate_recipe" ||
    intentType === "accept_margin_compression" ||
    intentType === "other"
      ? intentType
      : "other";

  const formattedRationale =
    targetNum !== undefined
      ? `[${op.ingredientName} @ ${targetNum.toFixed(2)} €/${op.unit}] ${intentRationale.trim()}`
      : `[${op.ingredientName}] ${intentRationale.trim()}`;

  const { data: persistedIntent, error: insertError } = await supabaseClient
    .from("cost_decision_intents")
    .insert({
      tenant_id: tenantId,
      scenario_id: resolvedScenarioId,
      intent_type: allowedIntentType,
      target_entity_type: "ingredient",
      target_entity_id: isValidUuid(op.ingredientId) ? op.ingredientId : null,
      rationale: formattedRationale,
      planned_effective_date: targetDate || null,
      status: "pending_action",
      recorded_by: isValidUuid(userId) ? userId : null,
    })
    .select("id, recorded_at")
    .single();

  if (insertError || !persistedIntent) {
    throw new Error(insertError?.message || "No se pudo persistir la decisión en Supabase.");
  }

  return {
    id: persistedIntent.id,
    intentType: allowedIntentType,
    targetPriceExTax: targetNum,
    plannedEffectiveDate: targetDate,
    rationale: intentRationale.trim(),
    authorName: userName,
    createdAt: persistedIntent.recorded_at || new Date().toISOString(),
  };
}

export interface ExecuteCatalogCsvIngestionParams {
  ingestionService: MarketCatalogIngestionService;
  csvContent: string;
  fileName: string;
  userId?: string;
  selectedSourceId?: string;
  visibilityScope: "public" | "private";
  tenantId?: string;
  canPublishPublic?: boolean;
}

export async function executeCatalogCsvIngestion({
  ingestionService,
  csvContent,
  fileName,
  userId,
  selectedSourceId,
  visibilityScope,
  tenantId,
  canPublishPublic = false,
}: ExecuteCatalogCsvIngestionParams): Promise<IngestionReport> {
  if (!csvContent.trim()) {
    throw new Error("Por favor, introduce o sube el contenido CSV/TSV del catálogo.");
  }

  if (!isValidUuid(userId)) {
    throw new Error("Se requiere una sesión autenticada válida (UUID) para auditar la ingesta.");
  }

  if (visibilityScope === "public" && !canPublishPublic) {
    throw new Error(
      "Solo administradores de plataforma pueden publicar observaciones públicas globales; selecciona tarifa privada del tenant.",
    );
  }

  return ingestionService.ingestCsv(csvContent, {
    fileName,
    importedBy: userId,
    defaultSourceId: selectedSourceId || undefined,
    ownerTenantId: visibilityScope === "private" && tenantId ? tenantId : null,
  });
}
