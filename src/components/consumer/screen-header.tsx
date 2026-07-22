import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

type Props = {
  overline?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  backTo?: string;
  trailing?: ReactNode;
};

/**
 * Cabecera unificada de la Customer App.
 * Mobile-first, tipografía dominante, ritmo vertical calmo.
 */
export function ScreenHeader({ overline, title, subtitle, backTo, trailing }: Props) {
  return (
    <header className="px-6 pt-10 pb-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {backTo ? (
            <Link
              to={backTo}
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-3 -ml-1 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="size-4" />
              <span className="uppercase tracking-widest">Back</span>
            </Link>
          ) : overline ? (
            <p className="meta-label">{overline}</p>
          ) : null}
          <h1 className="text-[30px] leading-[1.1] font-extrabold tracking-tight mt-1.5 text-balance">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[34ch]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </header>
  );
}
