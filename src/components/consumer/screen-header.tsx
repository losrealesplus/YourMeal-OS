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
 * Layout mobile-first, un solo toque, tipografía dominante.
 */
export function ScreenHeader({ overline, title, subtitle, backTo, trailing }: Props) {
  return (
    <header className="px-6 pt-8 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {backTo ? (
            <Link
              to={backTo}
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-2 -ml-1"
            >
              <ChevronLeft className="size-4" />
              <span className="uppercase tracking-widest">Back</span>
            </Link>
          ) : overline ? (
            <p className="meta-label">{overline}</p>
          ) : null}
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight mt-1 truncate">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          ) : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </header>
  );
}
