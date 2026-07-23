import { useEffect, useRef, type ReactNode } from "react";
import { applyBrandTheme, brandConfig } from "@/tenant/brand-config";
import { cn } from "@/lib/utils";

/** Wraps Customer App / auth surfaces with Tenant BrandConfig theme. */
export function TenantBrandScope({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    applyBrandTheme(ref.current, brandConfig);
  }, []);

  return (
    <div ref={ref} className={cn("tenant-branded", className)}>
      {children}
    </div>
  );
}

export function PoweredByLine({ className }: { className?: string }) {
  if (!brandConfig.poweredBy.visible) return null;
  return (
    <p
      className={cn(
        "text-[10px] font-medium tracking-wide text-muted-foreground/70 text-center",
        className,
      )}
    >
      {brandConfig.poweredBy.label}
    </p>
  );
}
