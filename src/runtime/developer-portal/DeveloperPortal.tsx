/**
 * Developer Portal — passphrase modal (premium · brand-aligned · no hacker aesthetic).
 * DEVELOPER-PORTAL-001
 */
import { useEffect, useId, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDeveloperPortal } from "./useDeveloperPortal";

export function DeveloperPortal() {
  const {
    open,
    passphrase,
    error,
    shaking,
    setPassphrase,
    closePortal,
    submit,
  } = useDeveloperPortal();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closePortal();
      }}
    >
      <DialogContent
        className="max-w-[min(100vw-2rem,22rem)] gap-5 border-border/80 bg-background sm:rounded-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
            Developer Portal
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Restricted Engineering Access
          </DialogDescription>
        </DialogHeader>

        <form
          className={cn(
            "space-y-3",
            shaking && "animate-[ymos-portal-shake_0.45s_ease-in-out]",
          )}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor={inputId}
              className="text-xs font-medium text-muted-foreground"
            >
              Passphrase
            </label>
            <Input
              id={inputId}
              ref={inputRef}
              type="password"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Enter passphrase..."
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className={cn(
                "h-11 rounded-lg",
                error && "border-destructive focus-visible:ring-destructive",
              )}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${inputId}-error` : undefined}
            />
            {error ? (
              <p
                id={`${inputId}-error`}
                className="text-xs font-medium text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground/80">
                For authorized engineering use only.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={closePortal}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg">
              Open
            </Button>
          </DialogFooter>
        </form>

        <style>{`
          @keyframes ymos-portal-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
