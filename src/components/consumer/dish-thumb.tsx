import { cn } from "@/lib/utils";

/**
 * Foto de plato. Si hay `imageSrc`, la foto domina; si no, emoji sobre gradiente marca.
 */
export function DishThumb({
  emoji,
  imageSrc,
  size = "md",
  className,
}: {
  emoji: string;
  imageSrc?: string;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
}) {
  const sizes: Record<string, string> = {
    sm: "size-16 text-3xl rounded-xl",
    md: "size-24 text-5xl rounded-2xl",
    lg: "h-40 w-full text-7xl rounded-3xl",
    xl: "aspect-[4/3] w-full text-8xl rounded-3xl",
    /** Instagram-style feed frame — photo owns the viewport. */
    hero: "aspect-[5/4] w-full text-8xl rounded-[1.75rem]",
  };

  if (imageSrc) {
    return (
      <div
        className={cn(
          "shrink-0 overflow-hidden border border-border/40 select-none bg-secondary",
          sizes[size],
          className,
        )}
      >
        <img
          src={imageSrc}
          alt=""
          className="size-full object-cover"
          width={800}
          height={640}
        />
      </div>
    );
  }

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
