import type { ImgHTMLAttributes } from "react";

export interface YourMealLogoProps {
  size?: number | string;
  showWordmark?: boolean;
  className?: string;
  variant?: "light" | "dark" | "auto";
}

/**
 * Official YourMeal OS Geometric Brandmark (Isotipo)
 * Responsive with automatic dark/light theme support.
 */
export function YourMealMark({
  size = 36,
  className = "",
  variant = "auto",
  ...props
}: YourMealLogoProps & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "size">) {
  const numericSize = typeof size === "number" ? size : parseInt(size as string, 10) || 36;

  if (variant === "dark") {
    return (
      <img
        src="/brand/yourmeal-os-mark-white.png"
        alt="YourMeal OS"
        width={numericSize}
        height={numericSize}
        style={{ width: `${numericSize}px`, height: `${numericSize}px` }}
        className={`shrink-0 object-contain ${className}`}
        {...props}
      />
    );
  }

  if (variant === "light") {
    return (
      <img
        src="/brand/yourmeal-os-mark.png"
        alt="YourMeal OS"
        width={numericSize}
        height={numericSize}
        style={{ width: `${numericSize}px`, height: `${numericSize}px` }}
        className={`shrink-0 object-contain ${className}`}
        {...props}
      />
    );
  }

  // Auto responsive for light / dark theme
  return (
    <div
      style={{ width: `${numericSize}px`, height: `${numericSize}px` }}
      className={`relative shrink-0 inline-flex items-center justify-center ${className}`}
    >
      <img
        src="/brand/yourmeal-os-mark.png"
        alt="YourMeal OS"
        width={numericSize}
        height={numericSize}
        className="w-full h-full object-contain dark:hidden"
        {...props}
      />
      <img
        src="/brand/yourmeal-os-mark-white.png"
        alt="YourMeal OS"
        width={numericSize}
        height={numericSize}
        className="w-full h-full object-contain hidden dark:block"
        {...props}
      />
    </div>
  );
}

/**
 * Official YourMeal OS Full Logo (Mark + Wordmark)
 */
export function YourMealLogo({
  size = 36,
  showWordmark = true,
  className = "",
  variant = "auto",
}: YourMealLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <YourMealMark size={size} variant={variant} />
      {showWordmark && (
        <div className="flex flex-col text-left">
          <span className="font-display font-black text-base tracking-tight text-foreground leading-none">
            YourMeal <span className="text-primary font-black">OS</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mt-0.5">
            Operaciones Gastronómicas
          </span>
        </div>
      )}
    </div>
  );
}
