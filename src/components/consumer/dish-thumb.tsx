import { cn } from "@/lib/utils";

/**
 * Placeholder de foto de plato. Sustituir por <img> real cuando exista Storage.
 * Usa gradiente natural (cream → sand) para transmitir marca EatClean.
 */
export function DishThumb({
  emoji,
  size = "md",
  className,
}: {
  emoji: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes: Record<string, string> = {
    sm: "size-16 text-3xl rounded-xl",
    md: "size-24 text-5xl rounded-2xl",
    lg: "h-40 w-full text-7xl rounded-3xl",
    xl: "aspect-[4/3] w-full text-8xl rounded-3xl",
  };
  return (
    <div
      className={cn(
        "shrink-0 grid place-items-center bg-gradient-to-br from-[var(--brand-cream)] to-[var(--brand-sand)] border border-border/60 overflow-hidden select-none",
        sizes[size],
        className,
      )}
      aria-hidden
    >
      <span>{emoji}</span>
    </div>
  );
}
