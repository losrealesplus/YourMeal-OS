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

  const prefix = brandConfig.poweredBy.prefix ?? "Powered by";
  const name = brandConfig.poweredBy.name ?? "YourMeal OS";

  return (
    <p
      className={cn(
        "text-center select-none leading-tight",
        className,
      )}
      aria-hidden
    >
      <span className="block text-[8px] font-normal tracking-[0.1em] text-[#9a8f7c]/50">
        {prefix}
      </span>
      <span className="mt-0.5 block text-[9px] font-normal tracking-[0.04em] text-[#9a8f7c]/40">
        {name}
      </span>
    </p>
  );
}
