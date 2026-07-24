import { useEffect, useRef, type ReactNode } from "react";
import { applyBrandTheme, brandConfig } from "@/tenant/brand-config";
import { cn } from "@/lib/utils";
import { useTenantBrand } from "@/hooks/use-tenant-brand";


/**
 * Wraps Customer App / auth surfaces with the tenant's BrandConfig theme,
 * and overrides color tokens with any values set by the tenant in
 * Ajustes → Marca (BrandingService). Overrides are scoped: they only affect
 * descendants of this element, never global tokens.
 */
export function TenantBrandScope({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { colors } = useTenantBrand();

  useEffect(() => {
    applyBrandTheme(ref.current, brandConfig);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // `.tenant-branded` maps --primary/--accent to --tenant-primary/--tenant-accent.
    // Override the base tenant vars so all shadcn/Tailwind classes pick them up.
    if (colors.primary) {
      el.style.setProperty("--tenant-primary", colors.primary);
    }
    if (colors.accent) {
      el.style.setProperty("--tenant-accent", colors.accent);
    }
    // --primary-foreground is not tokenized through tenant-*; override directly.
    if (colors.primaryForeground) {
      el.style.setProperty("--primary-foreground", colors.primaryForeground);
    }
  }, [colors.primary, colors.accent, colors.primaryForeground]);

  return (
    <div ref={ref} className={cn("tenant-branded", className)}>
      {children}
    </div>
  );
}

export function PoweredByLine({ className }: { className?: string }) {
  const { isSaasAdmin } = useAuth();
  if (!brandConfig.poweredBy.visible) return null;

  const prefix = brandConfig.poweredBy.prefix ?? "Powered by";
  const name = brandConfig.poweredBy.name ?? "YourMeal OS";

  const body = (
    <>
      <span className="block text-[8px] font-normal tracking-[0.1em] text-muted-foreground">
        {prefix}
      </span>
      <span className="mt-0.5 block text-[9px] font-normal tracking-[0.04em] text-muted-foreground">
        {name}
      </span>
      {isSaasAdmin ? (
        <span className="mt-1 block text-[8px] font-medium tracking-[0.14em] uppercase text-primary/80">
          Platform Operations →
        </span>
      ) : null}
    </>
  );

  const baseClass = cn("text-center select-none leading-tight", className);

  if (isSaasAdmin) {
    return (
      <Link
        to="/saas"
        aria-label="Open Platform Operations"
        className={cn(baseClass, "block hover:text-foreground transition-colors")}
      >
        {body}
      </Link>
    );
  }

  return (
    <p className={baseClass} aria-hidden>
      {body}
    </p>
  );
}

