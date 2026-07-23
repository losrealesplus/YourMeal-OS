import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildOperationalTimeline,
  type OperationalStatus,
} from "@/modules/operations";

type Props = {
  status: OperationalStatus | string;
  className?: string;
};

/**
 * Timeline operacional del pedido (creación → entrega).
 * PR-034
 */
export function OperationalTimeline({ status, className }: Props) {
  const steps = buildOperationalTimeline(status);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium">Timeline operacional</p>
      <ol className="space-y-0">
        {steps.map((step, i) => {
          const done = step.state === "done";
          const current = step.state === "current";
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-[10px]",
                    done && "border-primary bg-primary text-primary-foreground",
                    current && "border-primary bg-primary/10 text-primary",
                    !done && !current && "border-muted-foreground/30 text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span
                    className={cn(
                      "my-0.5 w-px flex-1 min-h-[12px]",
                      done ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>
              <div className="pb-3 pt-0.5">
                <p
                  className={cn(
                    "text-sm",
                    current && "font-medium text-foreground",
                    done && "text-muted-foreground",
                    !done && !current && "text-muted-foreground/70",
                  )}
                >
                  {step.label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
