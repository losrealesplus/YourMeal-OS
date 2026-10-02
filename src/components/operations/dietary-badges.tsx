import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldAlert, Sparkles, FileText } from "lucide-react";
import {
  type OrderDietarySnapshot,
  type CustomerDietaryProfile,
  resolveAllergenLabels,
  resolveRestrictionLabels,
  resolvePreferenceLabels,
  CONSTITUTIONAL_DIETARY_DISCLAIMER,
} from "@/types/dietary";
import { cn } from "@/lib/utils";

interface DietaryBadgesProps {
  snapshot?: OrderDietarySnapshot | CustomerDietaryProfile | null;
  compact?: boolean;
  showOverrides?: boolean;
  showNotes?: boolean;
  className?: string;
}

export function DietaryBadges({
  snapshot,
  compact = false,
  showOverrides = true,
  showNotes = true,
  className,
}: DietaryBadgesProps) {
  if (!snapshot) return null;

  const allergens = Array.isArray(snapshot.allergens) ? snapshot.allergens : [];
  const customAllergens = Array.isArray(snapshot.customAllergens) ? snapshot.customAllergens : [];
  const restrictions = Array.isArray(snapshot.restrictions) ? snapshot.restrictions : [];
  const preferences = Array.isArray(snapshot.preferences) ? snapshot.preferences : [];
  const notes = snapshot.dietaryNotes;

  const allergenLabels = resolveAllergenLabels(allergens, customAllergens);
  const restrictionLabels = resolveRestrictionLabels(restrictions);
  const preferenceLabels = resolvePreferenceLabels(preferences);

  const hasAllergens = allergenLabels.length > 0;
  const hasRestrictions = restrictionLabels.length > 0;
  const hasPreferences = preferenceLabels.length > 0;
  const hasNotes = Boolean(notes && notes.trim().length > 0);
  const isOverride = "isOverride" in snapshot ? Boolean(snapshot.isOverride) : false;
  const overrideReason = "overrideReason" in snapshot ? snapshot.overrideReason : null;

  if (!hasAllergens && !hasRestrictions && !hasPreferences && !hasNotes) {
    return null;
  }

  if (compact) {
    return (
      <div
        className={cn("inline-flex flex-wrap items-center gap-1.5", className)}
        title={CONSTITUTIONAL_DIETARY_DISCLAIMER}
      >
        {hasAllergens && (
          <Badge
            variant="destructive"
            className="h-5 px-1.5 text-[10px] font-bold tracking-wide uppercase bg-rose-600/90 text-white flex items-center gap-1 shadow-sm"
          >
            <ShieldAlert className="w-3 h-3 text-white" />
            <span>{allergenLabels.join(", ")}</span>
          </Badge>
        )}
        {hasRestrictions && (
          <Badge
            variant="outline"
            className="h-5 px-1.5 text-[10px] font-medium bg-amber-500/10 text-amber-300 border-amber-500/30 flex items-center gap-1"
          >
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            <span>{restrictionLabels.join(", ")}</span>
          </Badge>
        )}
        {hasPreferences && (
          <Badge
            variant="outline"
            className="h-5 px-1.5 text-[10px] font-normal bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
          >
            {preferenceLabels.join(", ")}
          </Badge>
        )}
        {isOverride && (
          <Badge
            variant="outline"
            className="h-5 px-1.5 text-[9px] font-semibold bg-purple-500/15 text-purple-300 border-purple-500/30"
          >
            Override
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2 rounded-lg border border-border/50 bg-card/40 p-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-primary" />
          Perfil Dietético & Alérgenos
        </span>
        {isOverride && showOverrides && (
          <Badge
            variant="secondary"
            className="text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
          >
            Personalizado para este pedido
            {overrideReason ? `: ${overrideReason}` : ""}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {/* Tier 1: Allergens */}
        {allergenLabels.map((lbl) => (
          <Badge
            key={`allergen-${lbl}`}
            variant="destructive"
            className="px-2 py-0.5 text-xs font-bold uppercase bg-rose-600/90 hover:bg-rose-600 text-white flex items-center gap-1 shadow-sm"
          >
            <ShieldAlert className="w-3 h-3 text-white" />
            {lbl}
          </Badge>
        ))}

        {/* Tier 2: Restrictions */}
        {restrictionLabels.map((lbl) => (
          <Badge
            key={`restriction-${lbl}`}
            variant="outline"
            className="px-2 py-0.5 text-xs font-medium bg-amber-500/15 text-amber-300 border-amber-500/40 flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            {lbl}
          </Badge>
        ))}

        {/* Tier 3: Preferences */}
        {preferenceLabels.map((lbl) => (
          <Badge
            key={`pref-${lbl}`}
            variant="outline"
            className="px-2 py-0.5 text-xs font-normal bg-emerald-500/10 text-emerald-300 border-emerald-500/30 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            {lbl}
          </Badge>
        ))}
      </div>

      {showNotes && hasNotes && (
        <div className="mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded flex items-start gap-2 border border-border/40">
          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <span className="italic">{notes}</span>
        </div>
      )}

      {/* Constitutional Food Safety Disclaimer */}
      <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground/80 flex items-start gap-1 leading-tight">
        <span>* {CONSTITUTIONAL_DIETARY_DISCLAIMER}</span>
      </div>
    </div>
  );
}
