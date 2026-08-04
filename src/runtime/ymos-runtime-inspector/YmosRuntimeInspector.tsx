/**
 * YMOS Runtime Inspector — visual observe-only overlay.
 * Gate: VITE_YMOS_RUNTIME_OVERLAY | ?debug-runtime=1 | storage | corner long-press.
 */
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  getYmosRuntimeStatus,
  subscribeYmosRuntimeStatus,
} from "../ymos-runtime-status";
import {
  installYmosRuntimeInspectorGestureToggle,
  isYmosRuntimeInspectorEnabled,
  setYmosRuntimeInspectorEnabled,
} from "./enable";
import { collectYmosRuntimeDiagnostic } from "./collect";

function Mark({ ok, label }: { ok: boolean | null; label: string }) {
  const symbol = ok === null ? "·" : ok ? "✓" : "✗";
  const color =
    ok === null
      ? "text-zinc-400"
      : ok
        ? "text-emerald-400"
        : "text-rose-400";
  return (
    <div className="flex items-start justify-between gap-2 py-0.5">
      <span className="text-zinc-300">{label}</span>
      <span className={`font-mono ${color}`}>
        {symbol} {ok === null ? "…" : ok ? "OK" : "FAILED"}
      </span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-white/10 pt-2 mt-2 first:border-0 first:pt-0 first:mt-0">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
        {title}
      </h3>
      {children}
    </section>
  );
}

function useInspectorEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(isYmosRuntimeInspectorEnabled());
    sync();
    const unGesture = installYmosRuntimeInspectorGestureToggle();
    window.addEventListener("ymos-runtime-inspector-toggle", sync);
    window.addEventListener("storage", sync);
    return () => {
      unGesture();
      window.removeEventListener("ymos-runtime-inspector-toggle", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return enabled;
}

/**
 * Floating diagnostic card. Safe to mount inside the provider tree.
 * Reads only — never mutates app state, providers, router, or i18n.
 */
export function YmosRuntimeInspector() {
  const enabled = useInspectorEnabled();
  const [copied, setCopied] = useState(false);
  const [tick, setTick] = useState(0);

  const status = useSyncExternalStore(
    subscribeYmosRuntimeStatus,
    getYmosRuntimeStatus,
    getYmosRuntimeStatus,
  );

  const { i18n } = useTranslation();
  const auth = useAuth();
  const routerState = useRouterState({
    select: (s) => s.location.pathname,
  });
  const queryClient = useQueryClient();

  // Periodic refresh for logo/DOM probes + i18n language changes.
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1500);
    return () => window.clearInterval(id);
  }, [enabled]);

  const diagnostic = useMemo(() => {
    void tick;
    return collectYmosRuntimeDiagnostic({
      i18n,
      route: routerState,
      auth: {
        loading: auth.loading,
        authenticated: Boolean(auth.session && auth.user),
        userId: auth.user?.id ?? null,
        email: auth.user?.email ?? null,
        tenantId: auth.tenantId,
        tenantName: auth.tenant?.name ?? null,
      },
    });
  }, [i18n, routerState, auth, tick, i18n.language, i18n.resolvedLanguage, status]);

  if (!enabled) return null;

  const nsList = Array.isArray(diagnostic.i18n.namespaces)
    ? (diagnostic.i18n.namespaces as string[])
    : [];

  async function copyDiagnostic() {
    const json = JSON.stringify(diagnostic, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for WebView without clipboard permission
      const ta = document.createElement("textarea");
      ta.value = json;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[110] w-[min(100vw-2rem,22rem)] max-h-[min(70vh,36rem)] overflow-auto rounded-xl border border-white/15 bg-zinc-950/95 p-3 text-[11px] text-zinc-100 shadow-2xl backdrop-blur-md"
      data-ymos-runtime-inspector="1"
      role="complementary"
      aria-label="YMOS Runtime Inspector"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-300">
            YMOS Runtime
          </p>
          <p className="text-[9px] text-zinc-500">Inspector · observe only</p>
        </div>
        <button
          type="button"
          className="rounded-md border border-white/20 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/10"
          onClick={() => setYmosRuntimeInspectorEnabled(false)}
        >
          Close
        </button>
      </div>

      <Section title="General">
        <Mark ok={diagnostic.build.capacitorNative || diagnostic.build.mobileSpa} label="Build Mobile" />
        <div className="flex justify-between py-0.5">
          <span className="text-zinc-300">Platform</span>
          <span className="font-mono text-zinc-100">{diagnostic.platform}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-zinc-300">Current Route</span>
          <span className="font-mono text-zinc-100 truncate max-w-[9rem] text-right">
            {diagnostic.route}
          </span>
        </div>
      </Section>

      <Section title="React">
        <Mark ok={diagnostic.react.rootImported || diagnostic.react.mainStarted} label="Root" />
        <Mark ok={Boolean(queryClient) && diagnostic.react.queryClient} label="QueryClient" />
        <Mark ok={diagnostic.react.bootstrap} label="Bootstrap" />
        <Mark ok={diagnostic.react.localization} label="Localization" />
        <Mark ok={diagnostic.react.identity} label="Identity" />
        <Mark ok={diagnostic.react.outlet} label="Outlet" />
      </Section>

      <Section title="i18n">
        <Mark ok={diagnostic.i18n.isInitialized} label="Initialized" />
        <div className="flex justify-between py-0.5">
          <span className="text-zinc-300">Language</span>
          <span className="font-mono">{diagnostic.i18n.language ?? "—"}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-zinc-300">Resolved</span>
          <span className="font-mono">{diagnostic.i18n.resolvedLanguage ?? "—"}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-zinc-300">defaultNS</span>
          <span className="font-mono">{String(diagnostic.i18n.defaultNS ?? "—")}</span>
        </div>
        <p className="text-zinc-400 mt-1 mb-0.5">Namespaces</p>
        {nsList.length === 0 ? (
          <Mark ok={false} label="(none)" />
        ) : (
          nsList.map((ns) => (
            <Mark
              key={ns}
              ok={diagnostic.i18n.bundles[`hasResourceBundle(es,${ns})`] ?? false}
              label={ns}
            />
          ))
        )}
        <p className="text-zinc-400 mt-1 mb-0.5">Translations</p>
        {Object.entries(diagnostic.i18n.translations).map(([key, value]) => {
          const failed = value === key || value.startsWith(key.split(":")[0] + ":");
          return (
            <div key={key} className="py-0.5">
              <div className="font-mono text-zinc-400">{key}</div>
              <div className={`font-mono ${failed ? "text-rose-400" : "text-emerald-300"}`}>
                → {value}
              </div>
            </div>
          );
        })}
      </Section>

      <Section title="Branding">
        <Mark ok={diagnostic.branding.logoLoaded} label="Logo" />
      </Section>

      <Section title="Supabase">
        <Mark
          ok={diagnostic.supabase.loading ? null : diagnostic.supabase.authenticated}
          label="Authenticated"
        />
        <div className="flex justify-between py-0.5">
          <span className="text-zinc-300">User</span>
          <span className="font-mono truncate max-w-[10rem] text-right">
            {diagnostic.supabase.email ?? diagnostic.supabase.userId ?? "—"}
          </span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-zinc-300">Tenant</span>
          <span className="font-mono truncate max-w-[10rem] text-right">
            {diagnostic.supabase.tenantName ?? diagnostic.supabase.tenantId ?? "—"}
          </span>
        </div>
      </Section>

      <Section title="Errors">
        <div className="text-zinc-400 break-words">
          <div>
            Exception:{" "}
            <span className="text-zinc-200">
              {diagnostic.errors.lastException ?? "—"}
            </span>
          </div>
          <div className="mt-1">
            Redirect:{" "}
            <span className="text-zinc-200">
              {diagnostic.errors.lastRedirect ?? "—"}
            </span>
          </div>
        </div>
      </Section>

      <button
        type="button"
        onClick={() => void copyDiagnostic()}
        className="mt-3 w-full rounded-lg bg-sky-500/90 py-2 text-center text-[11px] font-bold text-zinc-950 hover:bg-sky-400"
      >
        {copied ? "Copied ✓" : "Copy Diagnostic"}
      </button>
    </div>
  );
}
