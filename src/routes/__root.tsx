import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { Capacitor } from "@capacitor/core";
import { ymosTrace } from "@/runtime/ymos-trace";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { onAuthStateChange } from "@/auth";
import { BootstrapShell } from "@/bootstrap/BootstrapShell";
import { IdentityProvider } from "@/identity/identity-provider";
import i18n from "@/i18n";
import { useLanguageSync } from "@/hooks/use-language-sync";
import { LocalizationProvider } from "@/i18n/localization-provider";
import {
  YmosRuntimeMountProbe,
  ymosRuntimeLog,
} from "@/runtime/ymos-runtime-audit";
import { YmosRuntimeInspector } from "@/runtime/ymos-runtime-inspector";
import {
  markYmosRuntimeRootImported,
  recordYmosRuntimeException,
  recordYmosRuntimeRedirect,
} from "@/runtime/ymos-runtime-status";

// ANDROID-RUNTIME-001 — module load sensor
ymosRuntimeLog("__root imported");
markYmosRuntimeRootImported();

// Hard dependency on the singleton store so production DCE cannot drop resources (BUG-001).
// Prefer options.resources over isInitialized — init() resolves asynchronously.
if (!i18n.options.resources) {
  throw new Error(
    "i18n resources missing — client translations will show raw keys",
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="meta-label">404</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background transition-colors hover:bg-foreground/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("[YMOS-ERROR-BOUNDARY]", error);
  const router = useRouter();
  useEffect(() => {
    const msg = `mount exception captured name=${error?.name} message=${error?.message}`;
    console.error("[YMOS-ERROR-BOUNDARY]", msg, error);
    ymosRuntimeLog(msg);
    recordYmosRuntimeException(msg);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="meta-label">Something broke</p>
        <h1 className="mt-3 text-xl font-bold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Try again, or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-background transition-colors hover:bg-foreground/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "YourMeal OS — The Operating System for Meal Prep & Catering" },
      {
        name: "description",
        content:
          "The multi-tenant operating system for meal prep, healthy catering and corporate food services. Every order generates every department's plan — no Excel, no WhatsApp.",
      },
      { name: "author", content: "YourMeal OS" },
      {
        property: "og:title",
        content: "YourMeal OS — The Operating System for Meal Prep & Catering",
      },
      {
        property: "og:description",
        content:
          "The multi-tenant operating system for meal prep, healthy catering and corporate food services. Every order generates every department's plan — no Excel, no WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "YourMeal OS — The Operating System for Meal Prep & Catering" },
      { name: "twitter:description", content: "The multi-tenant operating system for meal prep, healthy catering and corporate food services. Every order generates every department's plan — no Excel, no WhatsApp." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/59fc57f6-0159-4577-bb70-0b62b1fbcd1d/id-preview-b02a611d--f8ba586d-0a01-4ad6-b65a-43058bf8649c.lovable.app-1784835094341.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/59fc57f6-0159-4577-bb70-0b62b1fbcd1d/id-preview-b02a611d--f8ba586d-0a01-4ad6-b65a-43058bf8649c.lovable.app-1784835094341.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Hooks that call useTranslation must run under I18nextProvider so they
 * share the single instance from src/i18n (BUG-001).
 *
 * ANDROID-RUNTIME-001 probes sit around existing providers — providers themselves
 * are not modified.
 */
function AppProviders({ children }: { children: ReactNode }) {
  useLanguageSync();
  return (
    <LocalizationProvider>
      <YmosRuntimeMountProbe label="LocalizationProvider mounted">
        <IdentityProvider>
          <YmosRuntimeMountProbe label="IdentityProvider mounted">
            <BootstrapShell>
              <YmosRuntimeMountProbe label="BootstrapShell mounted">
                {children}
              </YmosRuntimeMountProbe>
            </BootstrapShell>
          </YmosRuntimeMountProbe>
        </IdentityProvider>
      </YmosRuntimeMountProbe>
    </LocalizationProvider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  ymosRuntimeLog("RootComponent render");

  useEffect(() => {
    const { data: sub } = onAuthStateChange((event) => {
      if (
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT" &&
        event !== "USER_UPDATED"
      )
        return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  // Observe navigations/redirects without changing router behavior.
  useEffect(() => {
    const unsub = router.subscribe("onResolved", ({ pathChanged, toLocation, fromLocation }) => {
      if (!pathChanged || !fromLocation || !toLocation) return;
      ymosRuntimeLog(
        `redirect/nav from=${fromLocation.pathname} to=${toLocation.pathname}`,
      );
      recordYmosRuntimeRedirect(fromLocation.pathname, toLocation.pathname);
    });
    return unsub;
  }, [router]);

  ymosTrace("__root render");
  ymosTrace("before RuntimeInspector");
  try {
    ymosTrace(
      "platform =",
      Capacitor.getPlatform?.() ?? Capacitor.getPlatform(),
    );
  } catch {
    ymosTrace("platform = (unavailable)");
  }
  ymosTrace(
    "pathname =",
    typeof window !== "undefined" ? window.location.pathname : "(ssr)",
  );
  ymosTrace(
    "search =",
    typeof window !== "undefined" ? window.location.search : "(ssr)",
  );
  ymosTrace(
    "VITE_YMOS_RUNTIME_OVERLAY =",
    import.meta.env.VITE_YMOS_RUNTIME_OVERLAY,
  );
  ymosTrace(
    "overlay will mount unconditionally in JSX; gate is inside component",
  );

  return (
    <QueryClientProvider client={queryClient}>
      <YmosRuntimeMountProbe label="QueryClientProvider mounted">
        <I18nextProvider i18n={i18n}>
          <AppProviders>
            <YmosRuntimeMountProbe label="Outlet rendered">
              <Outlet />
            </YmosRuntimeMountProbe>
            {/* YMOS Runtime Inspector — observe-only; gated by flag */}
            <YmosRuntimeInspector />
          </AppProviders>
        </I18nextProvider>
      </YmosRuntimeMountProbe>
    </QueryClientProvider>
  );
}
