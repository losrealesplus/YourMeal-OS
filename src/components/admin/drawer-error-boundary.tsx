import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatErrorMessage } from "@/domain/errors";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: unknown;
}

export class DrawerErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[DrawerErrorBoundary] Uncaught error:", error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      const message = formatErrorMessage(
        this.state.error,
        "Ha ocurrido un error inesperado al renderizar esta sección.",
      );

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-destructive/30 bg-destructive/5 space-y-4 my-4">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-sm font-semibold text-foreground">
              {this.props.fallbackTitle ?? "Error al cargar el contenido"}
            </h3>
            <p className="text-xs text-muted-foreground">{message}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="flex items-center gap-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reintentar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
