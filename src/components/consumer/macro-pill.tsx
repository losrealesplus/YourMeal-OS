import { useFmt } from "@/i18n/localization-provider";

type Kind = "kcal" | "protein" | "carbs" | "fat";

const label: Record<Kind, string> = {
  kcal: "kcal",
  protein: "P",
  carbs: "C",
  fat: "F",
};

export function MacroPill({ kind, value }: { kind: Kind; value: number }) {
  const fmt = useFmt();
  const display =
    kind === "kcal"
      ? Math.round(value).toString()
      : `${fmt.weight(value)}`; // canonical grams → localized unit
  return (
    <div className="flex flex-col items-center bg-secondary/70 rounded-xl py-2 px-3 min-w-[64px]">
      <span className="font-mono text-sm font-bold tabular-nums">{display}</span>
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
        {label[kind]}
      </span>
    </div>
  );
}
