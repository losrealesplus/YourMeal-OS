import { useEffect, useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { BrandingService } from "@/modules/branding/application/branding-service";
import {
  isValidHex,
  validateLogoFile,
  LOGO_ALLOWED_MIME,
} from "@/modules/branding/domain/tenant-brand";
import { useTenantBrand, tenantBrandQueryKey } from "@/hooks/use-tenant-brand";
import { TenantLogo } from "@/components/tenant/tenant-logo";
import { DomainError } from "@/domain/errors";

/**
 * /admin/branding — Tenant Brand Management surface.
 *
 * Capability: brand.manage (company_admin, saas_admin)
 * Core Object: Tenant (branding facet)
 * Services: BrandingService (colors + logo, audit)
 * State: Connected + Tenant-Managed v1
 */
export const Route = createFileRoute("/_authenticated/admin/branding")({
  beforeLoad: ({ context }) => {
    const roles = (context as { roles?: string[] }).roles ?? [];
    const allowed =
      roles.includes("saas_admin") || roles.includes("company_admin");
    if (!allowed) {
      throw redirect({ to: "/admin" });
    }
  },
  component: AdminBrandingPage,
  head: () => ({
    meta: [
      { title: "YourMeal OS — Marca" },
      {
        name: "description",
        content:
          "Personaliza el logo y los colores de marca para toda tu organización.",
      },
    ],
  }),
});

const DEFAULT_PRIMARY = "#059669";
const DEFAULT_PRIMARY_FG = "#ffffff";
const DEFAULT_ACCENT = "#eff4f1";

function AdminBrandingPage() {
  const { t } = useTranslation("branding");
  const { tenantId, user, roles } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const { colors, logoUrl, isLoading } = useTenantBrand();

  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [primaryFg, setPrimaryFg] = useState(DEFAULT_PRIMARY_FG);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState<string | null>(
    null,
  );
  const [removeLogoRequested, setRemoveLogoRequested] = useState(false);

  useEffect(() => {
    if (colors.primary) setPrimary(colors.primary);
    if (colors.primaryForeground) setPrimaryFg(colors.primaryForeground);
    if (colors.accent) setAccent(colors.accent);
  }, [colors.primary, colors.primaryForeground, colors.accent]);

  const displayedLogo = pendingLogoPreview
    ? pendingLogoPreview
    : removeLogoRequested
      ? null
      : logoUrl;

  const primaryValid = isValidHex(primary);
  const primaryFgValid = isValidHex(primaryFg);
  const accentValid = isValidHex(accent);
  const allValid = primaryValid && primaryFgValid && accentValid;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!tenantId || !userId) throw new Error("No auth context");
      const ctx = await createServiceContext({
        supabase,
        userId,
        tenantId,
        roles,
      });
      return BrandingService.updateBrand(ctx, {
        colors: {
          primary,
          primaryForeground: primaryFg,
          accent,
        },
        logoFile: pendingLogo ?? (removeLogoRequested ? null : undefined),
      });
    },
    onSuccess: () => {
      toast.success(t("actions.saved"));
      setPendingLogo(null);
      if (pendingLogoPreview) URL.revokeObjectURL(pendingLogoPreview);
      setPendingLogoPreview(null);
      setRemoveLogoRequested(false);
      queryClient.invalidateQueries({
        queryKey: tenantBrandQueryKey(tenantId),
      });
    },
    onError: (err: unknown) => {
      const message =
        err instanceof DomainError
          ? err.message
          : err instanceof Error
            ? err.message
            : t("errors.unknown");
      toast.error(t("errors.unknown"), { description: message });
    },
  });

  function handlePickLogo(file: File | null) {
    if (!file) return;
    const err = validateLogoFile(file);
    if (err) {
      toast.error(
        err.kind === "too_large" ? t("errors.tooLarge") : t("errors.invalidType"),
      );
      return;
    }
    if (pendingLogoPreview) URL.revokeObjectURL(pendingLogoPreview);
    setPendingLogo(file);
    setPendingLogoPreview(URL.createObjectURL(file));
    setRemoveLogoRequested(false);
  }

  const acceptAttr = useMemo(() => LOGO_ALLOWED_MIME.join(","), []);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo card */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-medium">{t("logo.title")}</h2>
            <p className="text-muted-foreground text-xs mt-1">{t("logo.hint")}</p>
          </div>

          <div className="flex items-center justify-center rounded-md border bg-muted/30 py-8">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : displayedLogo ? (
              <img
                src={displayedLogo}
                alt="logo"
                className="max-h-24 max-w-[70%] object-contain"
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("logo.fallback")}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex">
              <input
                type="file"
                accept={acceptAttr}
                className="hidden"
                onChange={(e) => handlePickLogo(e.target.files?.[0] ?? null)}
              />
              <Button asChild variant="outline" size="sm">
                <span className="cursor-pointer inline-flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {logoUrl ? t("logo.replace") : t("logo.upload")}
                </span>
              </Button>
            </label>
            {(logoUrl || pendingLogo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (pendingLogoPreview)
                    URL.revokeObjectURL(pendingLogoPreview);
                  setPendingLogo(null);
                  setPendingLogoPreview(null);
                  setRemoveLogoRequested(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("logo.remove")}
              </Button>
            )}
          </div>
        </Card>

        {/* Colors card */}
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-base font-medium">{t("colors.title")}</h2>
          </div>

          <ColorField
            label={t("colors.primary")}
            hint={t("colors.primaryHint")}
            value={primary}
            valid={primaryValid}
            onChange={setPrimary}
            errorText={t("errors.invalidHex")}
          />
          <ColorField
            label={t("colors.primaryForeground")}
            hint={t("colors.primaryForegroundHint")}
            value={primaryFg}
            valid={primaryFgValid}
            onChange={setPrimaryFg}
            errorText={t("errors.invalidHex")}
          />
          <ColorField
            label={t("colors.accent")}
            hint={t("colors.accentHint")}
            value={accent}
            valid={accentValid}
            onChange={setAccent}
            errorText={t("errors.invalidHex")}
          />

          <button
            type="button"
            onClick={() => {
              setPrimary(DEFAULT_PRIMARY);
              setPrimaryFg(DEFAULT_PRIMARY_FG);
              setAccent(DEFAULT_ACCENT);
            }}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            {t("colors.reset")}
          </button>
        </Card>
      </div>

      {/* Live preview */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-medium">{t("preview.title")}</h2>
        <div
          className="rounded-lg border p-6 flex flex-col gap-4 items-start"
          style={{
            ["--tenant-primary" as string]: primaryValid ? primary : DEFAULT_PRIMARY,
            ["--tenant-accent" as string]: accentValid ? accent : DEFAULT_ACCENT,
            ["--primary-foreground" as string]: primaryFgValid
              ? primaryFg
              : DEFAULT_PRIMARY_FG,
          }}
        >
          {displayedLogo ? (
            <img
              src={displayedLogo}
              alt="logo preview"
              className="h-12 w-auto object-contain"
            />
          ) : (
            <TenantLogo height={48} />
          )}
          <button
            type="button"
            className="rounded-md px-4 py-2 text-sm font-medium shadow-sm"
            style={{
              background: primaryValid ? primary : DEFAULT_PRIMARY,
              color: primaryFgValid ? primaryFg : DEFAULT_PRIMARY_FG,
            }}
          >
            {t("preview.primaryButton")}
          </button>
          <div
            className="rounded-md px-4 py-3 text-sm w-full"
            style={{ background: accentValid ? accent : DEFAULT_ACCENT }}
          >
            {t("preview.sampleText")}
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => mutation.mutate()}
          disabled={!allValid || mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("actions.saving")}
            </>
          ) : (
            t("actions.save")
          )}
        </Button>
      </div>
    </div>
  );
}

function ColorField({
  label,
  hint,
  value,
  valid,
  onChange,
  errorText,
}: {
  label: string;
  hint: string;
  value: string;
  valid: boolean;
  onChange: (v: string) => void;
  errorText: string;
}) {
  const safe = valid ? value : "#000000";
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border bg-transparent"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono uppercase max-w-[140px]"
          maxLength={7}
        />
      </div>
      <p className="text-muted-foreground text-xs">{hint}</p>
      {!valid && <p className="text-destructive text-xs">{errorText}</p>}
    </div>
  );
}
