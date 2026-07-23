import { cn } from "@/lib/utils";

/** Etiquetas de plato (vegan, glutenFree, etc.). Compactas, informativas, sin CTA. */
export function TagChip({
  children,
  tone = "leaf",
}: {
  children: React.ReactNode;
  tone?: "leaf" | "clay" | "muted";
}) {
  const toneClass: Record<string, string> = {
    leaf: "bg-primary/10 text-primary",
    clay: "attention-chip",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-1",
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}
