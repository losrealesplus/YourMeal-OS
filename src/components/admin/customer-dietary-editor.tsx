import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  EU_ALLERGENS,
  STANDARD_RESTRICTIONS,
  STANDARD_PREFERENCES,
  CONSTITUTIONAL_DIETARY_DISCLAIMER,
  type CustomerDietaryProfile,
} from "@/types/dietary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, AlertTriangle, Sparkles, Plus, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerDietaryEditorProps {
  customerId: string;
  canWrite: boolean;
  onSaved?: () => void;
}

export function CustomerDietaryEditor({
  customerId,
  canWrite,
  onSaved,
}: CustomerDietaryEditorProps) {
  const { user, tenantId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [allergens, setAllergens] = useState<string[]>([]);
  const [customAllergens, setCustomAllergens] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [dietaryNotes, setDietaryNotes] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadDietaryProfile() {
      if (!tenantId || !customerId) return;
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchErr } = await (supabase as any)
          .from("customer_dietary_profiles")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("customer_id", customerId)
          .maybeSingle();

        if (fetchErr) {
          throw new Error(fetchErr.message);
        }

        if (!isCancelled) {
          if (data) {
            setAllergens(Array.isArray(data.allergens) ? data.allergens : []);
            setCustomAllergens(Array.isArray(data.custom_allergens) ? data.custom_allergens : []);
            setRestrictions(Array.isArray(data.restrictions) ? data.restrictions : []);
            setPreferences(Array.isArray(data.preferences) ? data.preferences : []);
            setDietaryNotes(data.dietary_notes || "");
          } else {
            setAllergens([]);
            setCustomAllergens([]);
            setRestrictions([]);
            setPreferences([]);
            setDietaryNotes("");
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Error al cargar el perfil dietético.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadDietaryProfile();

    return () => {
      isCancelled = true;
    };
  }, [tenantId, customerId]);

  function toggleAllergen(id: string) {
    if (!canWrite) return;
    setAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function addCustomAllergen() {
    if (!canWrite || !customTagInput.trim()) return;
    const tag = customTagInput.trim().toLowerCase();
    if (!customAllergens.includes(tag)) {
      setCustomAllergens((prev) => [...prev, tag]);
    }
    setCustomTagInput("");
  }

  function removeCustomAllergen(tag: string) {
    if (!canWrite) return;
    setCustomAllergens((prev) => prev.filter((t) => t !== tag));
  }

  function toggleRestriction(id: string) {
    if (!canWrite) return;
    setRestrictions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  function togglePreference(id: string) {
    if (!canWrite) return;
    setPreferences((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (!canWrite || !tenantId || !customerId) return;
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        tenant_id: tenantId,
        customer_id: customerId,
        allergens,
        custom_allergens: customAllergens,
        restrictions,
        preferences,
        dietary_notes: dietaryNotes.trim() ? dietaryNotes.trim() : null,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await (supabase as any)
        .from("customer_dietary_profiles")
        .upsert(payload, { onConflict: "tenant_id,customer_id" });

      if (upsertErr) {
        throw new Error(upsertErr.message);
      }

      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Error al guardar el perfil dietético.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 border rounded-lg bg-card/50">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
        <span className="text-xs text-muted-foreground">Cargando perfil dietético…</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <h4 className="text-sm font-semibold tracking-tight text-foreground">
              Perfil Dietético & Alérgenos
            </h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Configuración que se sincronizará e inmutabilizará automáticamente en cada pedido.
          </p>
        </div>
        {saveSuccess && (
          <Badge className="bg-emerald-600 text-white text-[10px] gap-1 animate-in fade-in">
            <Check className="w-3 h-3" /> Guardado
          </Badge>
        )}
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Constitutional Food Safety Disclaimer */}
      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-start gap-2 text-xs text-amber-200/90">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-amber-300">Aviso legal y de seguridad: </strong>
          {CONSTITUTIONAL_DIETARY_DISCLAIMER}
        </p>
      </div>

      {/* 1. EU-14 Mandatory Allergens */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          Alérgenos de Declaración Obligatoria (UE 14)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
          {EU_ALLERGENS.map((allergen) => {
            const isSelected = allergens.includes(allergen.id);
            return (
              <button
                type="button"
                key={allergen.id}
                onClick={() => toggleAllergen(allergen.id)}
                disabled={!canWrite}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium border text-left transition-colors",
                  isSelected
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60"
                )}
              >
                <span>{allergen.label}</span>
                {isSelected && <Check className="w-3 h-3 ml-1 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Custom Allergens */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-semibold text-foreground">
          Otros Alérgenos o Alergias Específicas
        </label>
        <div className="flex gap-2">
          <Input
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomAllergen();
              }
            }}
            placeholder="Ej. kiwi, fresa, aguacate…"
            className="h-8 text-xs"
            disabled={!canWrite}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addCustomAllergen}
            disabled={!canWrite || !customTagInput.trim()}
            className="h-8 px-2.5 text-xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir
          </Button>
        </div>
        {customAllergens.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {customAllergens.map((tag) => (
              <Badge
                key={tag}
                variant="destructive"
                className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-xs gap-1 pl-2 pr-1 py-0.5"
              >
                {tag}
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => removeCustomAllergen(tag)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 3. Restrictions & Regimes */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Restricciones y Regímenes Alimentarios
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STANDARD_RESTRICTIONS.map((res) => {
            const isSelected = restrictions.includes(res.id);
            return (
              <button
                type="button"
                key={res.id}
                onClick={() => toggleRestriction(res.id)}
                disabled={!canWrite}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  isSelected
                    ? "bg-amber-500/20 text-amber-300 border-amber-500 font-semibold"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60"
                )}
              >
                {res.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Culinary Preferences */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          Preferencias y Exclusiones Culinarias
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STANDARD_PREFERENCES.map((pref) => {
            const isSelected = preferences.includes(pref.id);
            return (
              <button
                type="button"
                key={pref.id}
                onClick={() => togglePreference(pref.id)}
                disabled={!canWrite}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  isSelected
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500 font-semibold"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60"
                )}
              >
                {pref.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Free-form Dietary Notes */}
      <div className="space-y-1.5 pt-1">
        <label className="text-xs font-semibold text-foreground">
          Instrucciones para Cocina / Notas Libres
        </label>
        <Textarea
          value={dietaryNotes}
          onChange={(e) => setDietaryNotes(e.target.value)}
          placeholder="Ej. Cuidado extremo con trazas de nuez. No añadir aliños con mostaza."
          rows={2}
          className="text-xs resize-none"
          disabled={!canWrite}
        />
      </div>

      {canWrite && (
        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs h-8 gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Guardando…
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                Guardar Perfil Dietético
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
