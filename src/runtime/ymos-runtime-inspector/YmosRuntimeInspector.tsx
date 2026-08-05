/**
 * YMOS Runtime Inspector — visual observe-only overlay.
 * Gate: VITE_YMOS_RUNTIME_OVERLAY | ?debug-runtime=1 | storage | corner long-press.
 *
 * Tabs: General · Runtime · Assets · DOM · i18n · Router · Supabase · Network · Storage · Clipboard · Device · Errors
 * ANDROID-ASSETS-001 → Assets · ANDROID-DOM-001 → DOM (document.images)
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import {
  getYmosRuntimeStatus,
  subscribeYmosRuntimeStatus,
} from "../ymos-runtime-status";
import {
  getYmosAssetAuditSnapshot,
  subscribeYmosAssetAudit,
} from "../ymos-runtime-assets";
import {
  installYmosRuntimeInspectorGestureToggle,
  isYmosRuntimeInspectorEnabled,
  setYmosRuntimeInspectorEnabled,
} from "./enable";
import { collectYmosRuntimeDiagnostic } from "./collect";
import { collectDomImages } from "./dom-images";
import { ymosTrace } from "../ymos-trace";

const TABS = [
  "General",
  "Runtime",
  "Assets",
  "DOM",
  "i18n",
  "Router",
  "Supabase",
  "Network",
  "Storage",
  "Clipboard",
  "Device",
  "Errors",
] as const;

type Tab = (typeof TABS)[number];

function Mark({ ok, label }: { ok: boolean | null; label: string }) {
  const symbol = ok === null ? "·" : ok ? "✓" : "✗";
  const color =
    ok === null ? "text-zinc-400" : ok ? "text-emerald-400" : "text-rose-400";
  return (
    <div className="flex items-start justify-between gap-2 py-0.5">
      <span className="text-zinc-300">{label}</span>
      <span className={`font-mono ${color}`}>
        {symbol} {ok === null ? "…" : ok ? "OK" : "FAILED"}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2 py-0.5">
      <span className="text-zinc-400 shrink-0">{label}</span>
      <span className="font-mono text-zinc-100 text-right break-all">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
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
  ymosTrace("useInspectorEnabled() entered");
  const [enabled, setEnabled] = useState(false);
  ymosTrace("useInspectorEnabled initial state =", enabled);

  useEffect(() => {
    ymosTrace("useInspectorEnabled effect run");
    const sync = () => {
      ymosTrace("env");
      ymosTrace("query");
      ymosTrace("sessionStorage");
      ymosTrace("localStorage");
      const next = isYmosRuntimeInspectorEnabled();
      ymosTrace("useInspectorEnabled sync →", next);
      setEnabled(next);
    };
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

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}`.slice(0, 64) || url.slice(-48);
  } catch {
    return url.length > 48 ? `…${url.slice(-48)}` : url;
  }
}

/**
 * Floating diagnostic card. Safe to mount inside the provider tree.
 * Reads only — never mutates app state, providers, router, or i18n.
 */
export function YmosRuntimeInspector() {
  ymosTrace("component function entered");
  console.log("[YMOS] Inspector component rendered");

  const enabled = useInspectorEnabled();
  const rootRef = useRef<HTMLDivElement | null>(null);

  ymosTrace("enabled =", enabled);
  console.log("[YMOS] Inspector enabled =", enabled);
  console.log(
    "[YMOS] env=",
    import.meta.env.VITE_YMOS_RUNTIME_OVERLAY,
  );
  console.log(
    "[YMOS] href=",
    typeof window !== "undefined" ? window.location.href : "(ssr)",
  );
  console.log(
    "[YMOS] session=",
    typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("ymos.runtime-inspector")
      : "(ssr)",
  );
  console.log(
    "[YMOS] local=",
    typeof localStorage !== "undefined"
      ? localStorage.getItem("ymos.runtime-inspector")
      : "(ssr)",
  );

  const [copied, setCopied] = useState(false);
  const [copiedDom, setCopiedDom] = useState(false);
  /** ANDROID-DOM-001 — land on DOM tab to resolve APK vs Inspector contradiction. */
  const [tab, setTab] = useState<Tab>("DOM");
  const [tick, setTick] = useState(0);

  const status = useSyncExternalStore(
    subscribeYmosRuntimeStatus,
    getYmosRuntimeStatus,
    getYmosRuntimeStatus,
  );
  const assets = useSyncExternalStore(
    subscribeYmosAssetAudit,
    getYmosAssetAuditSnapshot,
    getYmosAssetAuditSnapshot,
  );

  const { i18n } = useTranslation();
  const auth = useAuth();
  const routerState = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      href: s.location.href,
      search: s.location.searchStr,
    }),
  });
  const queryClient = useQueryClient();

  // ANDROID-RUNTIME-007 — prove whether React completes commit.
  useLayoutEffect(() => {
    console.log("[YMOS-LAYOUT] committed");
    ymosTrace("YMOS-LAYOUT committed");
  }, []);

  useEffect(() => {
    console.log("[YMOS-EFFECT] mounted");
    ymosTrace("YMOS-EFFECT mounted");
  }, []);

  useEffect(() => {
    if (!enabled) {
      ymosTrace(
        "returning null because enabled=false (skip refresh interval)",
      );
      return;
    }
    const id = window.setInterval(() => setTick((n) => n + 1), 1200);
    return () => window.clearInterval(id);
  }, [enabled]);

  // ANDROID-RUNTIME-006 — DOM / CSS visibility probe (after paint).
  useEffect(() => {
    if (!enabled) return;

    const probe = (phase: string) => {
      const el =
        document.getElementById("ymos-runtime-inspector") ?? rootRef.current;
      const cs = el ? getComputedStyle(el) : null;
      const rect = el?.getBoundingClientRect();
      const payload = {
        phase,
        exists: Boolean(el),
        inDocument: el ? document.documentElement.contains(el) : false,
        parentTag: el?.parentElement?.tagName ?? null,
        rect: rect
          ? {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left,
              bottom: rect.bottom,
              right: rect.right,
            }
          : null,
        zIndex: cs?.zIndex ?? null,
        display: cs?.display ?? null,
        visibility: cs?.visibility ?? null,
        opacity: cs?.opacity ?? null,
        position: cs?.position ?? null,
        transform: cs?.transform ?? null,
        pointerEvents: cs?.pointerEvents ?? null,
        backgroundColor: cs?.backgroundColor ?? null,
        viewport: {
          w: window.innerWidth,
          h: window.innerHeight,
        },
      };
      console.log("[YMOS-DOM]", payload);
      ymosTrace("YMOS-DOM", payload);
    };

    probe("sync");
    const raf1 = requestAnimationFrame(() => {
      probe("raf1");
      requestAnimationFrame(() => probe("raf2"));
    });
    const t0 = window.setTimeout(() => probe("t+50ms"), 50);
    const t1 = window.setTimeout(() => probe("t+250ms"), 250);
    const t2 = window.setTimeout(() => probe("t+1000ms"), 1000);

    return () => {
      cancelAnimationFrame(raf1);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [enabled]);

  const diagnostic = useMemo(() => {
    void tick;
    return collectYmosRuntimeDiagnostic({
      i18n,
      route: routerState.pathname,
      auth: {
        loading: auth.loading,
        authenticated: Boolean(auth.session && auth.user),
        userId: auth.user?.id ?? null,
        email: auth.user?.email ?? null,
        tenantId: auth.tenantId,
        tenantName: auth.tenant?.name ?? null,
      },
    });
  }, [
    i18n,
    routerState.pathname,
    auth,
    tick,
    i18n.language,
    i18n.resolvedLanguage,
    status,
    assets,
  ]);

  // ANDROID-DOM-001 — live document.images (refreshed with tick).
  const domImages = useMemo(() => {
    void tick;
    return collectDomImages();
  }, [tick]);

  if (!enabled) {
    ymosTrace(
      "returning null because enabled=false (overlay gated off)",
    );
    return null;
  }

  ymosTrace("rendering overlay");

  const nsList = Array.isArray(diagnostic.i18n.namespaces)
    ? (diagnostic.i18n.namespaces as string[])
    : [];

  async function writeClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }

  async function copyDiagnostic() {
    await writeClipboard(JSON.stringify(diagnostic, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function copyDomImages() {
    const payload = {
      tool: "YMOS Runtime Inspector · DOM",
      capturedAt: new Date().toISOString(),
      href: typeof window !== "undefined" ? window.location.href : "",
      count: domImages.length,
      images: domImages,
    };
    await writeClipboard(JSON.stringify(payload, null, 2));
    setCopiedDom(true);
    window.setTimeout(() => setCopiedDom(false), 2000);
  }

  const failures = diagnostic.assets.entries.filter((e) => e.status === "error");
  const networkEntries = diagnostic.assets.entries.filter(
    (e) => e.source === "fetch" || e.source === "xhr",
  );
  const domHasL5e = domImages.some(
    (img) =>
      img.currentSrc.includes("/__l5e/") || img.src.includes("/__l5e/"),
  );

  return (
    <div
      ref={(el) => {
        console.log("[YMOS-REF]", !!el);
        ymosTrace("YMOS-REF", !!el);
        rootRef.current = el;
      }}
      id="ymos-runtime-inspector"
      className="flex flex-col text-[11px] text-zinc-100"
      data-ymos-runtime-inspector="1"
      role="complementary"
      aria-label="YMOS Runtime Inspector"
      /* ANDROID-RUNTIME-006 temporary ultra-visible shell — prove DOM paint */
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(255,0,0,.35)",
        zIndex: 2147483647,
        pointerEvents: "none",
        overflow: "auto",
      }}
    >
      <div
        className="m-4 max-h-[min(78vh,40rem)] w-[min(100vw-2rem,24rem)] self-end overflow-auto rounded-xl border-4 border-yellow-300 bg-zinc-950 text-[11px] text-zinc-100 shadow-2xl"
        style={{ pointerEvents: "auto" }}
      >
      <div className="flex items-center justify-between gap-2 p-3 pb-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-300">
            YMOS Runtime · DOM PROBE
          </p>
          <p className="text-[9px] text-zinc-500">
            ANDROID-RUNTIME-006 · red fullscreen = node is in DOM
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-white/20 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/10"
          onClick={() => setYmosRuntimeInspectorEnabled(false)}
        >
          Close
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto px-2 pb-2 border-b border-white/10">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold ${
              tab === name
                ? "bg-sky-500/90 text-zinc-950"
                : "bg-white/5 text-zinc-400 hover:bg-white/10"
            }`}
          >
            {name}
            {name === "Assets" && failures.length > 0 ? (
              <span className="ml-1 text-rose-200">({failures.length})</span>
            ) : null}
            {name === "DOM" ? (
              <span className={`ml-1 ${domHasL5e ? "text-rose-200" : "text-zinc-500"}`}>
                ({domImages.length})
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3">
        {tab === "General" && (
          <>
            <Mark
              ok={diagnostic.build.capacitorNative || diagnostic.build.mobileSpa}
              label="Build Mobile"
            />
            <Row label="Platform" value={diagnostic.platform} />
            <Row label="Route" value={diagnostic.route} />
            <Row label="baseURI" value={diagnostic.assets.env.baseURI || "—"} />
            <Row label="BASE_URL" value={diagnostic.assets.env.baseUrl || "—"} />
            <Row label="href" value={diagnostic.assets.env.href || "—"} />
          </>
        )}

        {tab === "Runtime" && (
          <>
            <Mark ok={diagnostic.react.rootImported || diagnostic.react.mainStarted} label="Root" />
            <Mark ok={Boolean(queryClient) && diagnostic.react.queryClient} label="QueryClient" />
            <Mark ok={diagnostic.react.bootstrap} label="Bootstrap" />
            <Mark ok={diagnostic.react.localization} label="Localization" />
            <Mark ok={diagnostic.react.identity} label="Identity" />
            <Mark ok={diagnostic.react.outlet} label="Outlet" />
            <Mark ok={diagnostic.branding.logoLoaded} label="Logo" />
          </>
        )}

        {tab === "Assets" && (
          <>
            <Section title="Resolution env">
              <Row label="href" value={diagnostic.assets.env.href || "—"} />
              <Row label="origin" value={diagnostic.assets.env.origin || "—"} />
              <Row label="pathname" value={diagnostic.assets.env.pathname || "—"} />
              <Row label="baseURI" value={diagnostic.assets.env.baseURI || "—"} />
              <Row label="BASE_URL" value={diagnostic.assets.env.baseUrl || "—"} />
              <Row label="readyState" value={diagnostic.assets.env.readyState || "—"} />
            </Section>

            <Section title="Counts">
              <Row label="total" value={String(diagnostic.assets.counts.total)} />
              <Row label="ok" value={String(diagnostic.assets.counts.ok)} />
              <Row label="error" value={String(diagnostic.assets.counts.error)} />
              <Row label="loading" value={String(diagnostic.assets.counts.loading)} />
            </Section>

            <Section title="First failure">
              {diagnostic.assets.firstFailure ? (
                <div className="space-y-1">
                  <Mark ok={false} label={diagnostic.assets.firstFailure.kind} />
                  <Row label="URL" value={diagnostic.assets.firstFailure.url} />
                  <Row
                    label="HTTP"
                    value={
                      diagnostic.assets.firstFailure.httpStatus == null
                        ? "—"
                        : String(diagnostic.assets.firstFailure.httpStatus)
                    }
                  />
                  <Row
                    label="Error"
                    value={diagnostic.assets.firstFailure.error ?? "—"}
                  />
                  <Row label="Source" value={diagnostic.assets.firstFailure.source} />
                </div>
              ) : (
                <Mark ok={true} label="No failures yet" />
              )}
            </Section>

            <Section title="Resources">
              {diagnostic.assets.entries.length === 0 ? (
                <p className="text-zinc-500">No resources observed yet.</p>
              ) : (
                <ul className="space-y-2">
                  {[...diagnostic.assets.entries].reverse().slice(0, 40).map((e) => (
                    <li
                      key={e.id}
                      className="rounded-md border border-white/10 bg-white/5 p-2"
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-mono text-zinc-300">{e.kind}</span>
                        <span
                          className={`font-mono ${
                            e.status === "ok"
                              ? "text-emerald-400"
                              : e.status === "error"
                                ? "text-rose-400"
                                : "text-zinc-400"
                          }`}
                        >
                          {e.status === "ok" ? "✓" : e.status === "error" ? "✗" : "·"}{" "}
                          {e.status}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-zinc-400 break-all mt-0.5">
                        {shortUrl(e.url)}
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                        <span>{e.source}</span>
                        <span>
                          HTTP {e.httpStatus ?? "—"}
                          {e.error ? ` · ${e.error}` : ""}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </>
        )}

        {tab === "DOM" && (
          <>
            <p className="text-[9px] text-zinc-500 mb-2">
              ANDROID-DOM-001 · live{" "}
              <span className="font-mono text-zinc-300">document.images</span>
              {" "}(WebView truth — not the asset ledger)
            </p>
            <Mark
              ok={domImages.length === 0 ? null : !domHasL5e}
              label={
                domHasL5e
                  ? "__l5e present in DOM"
                  : "no __l5e in document.images"
              }
            />
            <Row label="count" value={String(domImages.length)} />
            <Section title="Images">
              {domImages.length === 0 ? (
                <p className="text-zinc-500">No HTMLImageElement in document.images.</p>
              ) : (
                <ul className="space-y-2">
                  {domImages.map((img) => {
                    const broken = img.complete && img.naturalWidth === 0;
                    const hasL5e =
                      img.currentSrc.includes("/__l5e/") ||
                      img.src.includes("/__l5e/");
                    return (
                      <li
                        key={`dom-img-${img.index}`}
                        className="rounded-md border border-white/10 bg-white/5 p-2"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-mono text-zinc-300">
                            #{img.index} · {img.ownerHint}
                          </span>
                          <span
                            className={`font-mono ${
                              hasL5e || broken
                                ? "text-rose-400"
                                : img.naturalWidth > 0
                                  ? "text-emerald-400"
                                  : "text-zinc-400"
                            }`}
                          >
                            {hasL5e
                              ? "✗ __l5e"
                              : broken
                                ? "✗ broken"
                                : img.naturalWidth > 0
                                  ? "✓ ok"
                                  : "· loading"}
                          </span>
                        </div>
                        <Row label="currentSrc" value={img.currentSrc || "—"} />
                        <Row label="src" value={img.src || "—"} />
                        <Row label="alt" value={img.alt || "—"} />
                        <Row
                          label="size"
                          value={`${img.width}×${img.height} css · ${img.naturalWidth}×${img.naturalHeight} natural`}
                        />
                        <Row label="complete" value={String(img.complete)} />
                        {img.className ? (
                          <Row label="class" value={img.className.slice(0, 80)} />
                        ) : null}
                        {img.id ? <Row label="id" value={img.id} /> : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
            <button
              type="button"
              onClick={() => void copyDomImages()}
              className="mt-3 w-full rounded-lg border border-yellow-300/60 bg-yellow-300/10 py-2 text-center text-[11px] font-bold text-yellow-200 hover:bg-yellow-300/20"
            >
              {copiedDom ? "DOM Images Copied ✓" : "Copy DOM Images"}
            </button>
          </>
        )}

        {tab === "i18n" && (
          <>
            <Mark ok={diagnostic.i18n.isInitialized} label="Initialized" />
            <Row label="Language" value={diagnostic.i18n.language ?? "—"} />
            <Row label="Resolved" value={diagnostic.i18n.resolvedLanguage ?? "—"} />
            <Row label="defaultNS" value={String(diagnostic.i18n.defaultNS ?? "—")} />
            <Section title="Namespaces">
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
            </Section>
            <Section title="Translations">
              {Object.entries(diagnostic.i18n.translations).map(([key, value]) => {
                const failed =
                  value === key ||
                  value.startsWith(`${key.split(":")[0]}:`);
                return (
                  <div key={key} className="py-0.5">
                    <div className="font-mono text-zinc-400">{key}</div>
                    <div
                      className={`font-mono ${failed ? "text-rose-400" : "text-emerald-300"}`}
                    >
                      → {value}
                    </div>
                  </div>
                );
              })}
            </Section>
          </>
        )}

        {tab === "Router" && (
          <>
            <Row label="pathname" value={routerState.pathname} />
            <Row label="href" value={routerState.href} />
            <Row label="search" value={routerState.search || "—"} />
            <Row label="last redirect" value={diagnostic.errors.lastRedirect ?? "—"} />
          </>
        )}

        {tab === "Supabase" && (
          <>
            <Mark
              ok={diagnostic.supabase.loading ? null : diagnostic.supabase.authenticated}
              label="Authenticated"
            />
            <Row
              label="User"
              value={
                diagnostic.supabase.email ?? diagnostic.supabase.userId ?? "—"
              }
            />
            <Row
              label="Tenant"
              value={
                diagnostic.supabase.tenantName ??
                diagnostic.supabase.tenantId ??
                "—"
              }
            />
          </>
        )}

        {tab === "Network" && (
          <>
            <Row label="observed" value={String(networkEntries.length)} />
            {networkEntries.length === 0 ? (
              <p className="text-zinc-500 mt-2">No fetch/XHR observed yet.</p>
            ) : (
              <ul className="space-y-2 mt-2">
                {[...networkEntries].reverse().slice(0, 30).map((e) => (
                  <li key={e.id} className="rounded-md border border-white/10 p-2">
                    <Mark ok={e.status === "ok"} label={e.source} />
                    <Row label="URL" value={shortUrl(e.url)} />
                    <Row
                      label="HTTP"
                      value={e.httpStatus == null ? "—" : String(e.httpStatus)}
                    />
                    {e.error ? <Row label="Error" value={e.error} /> : null}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "Storage" && (
          <>
            <Row
              label="localStorage"
              value={
                typeof localStorage === "undefined"
                  ? "n/a"
                  : `${localStorage.length} keys`
              }
            />
            <Row
              label="sessionStorage"
              value={
                typeof sessionStorage === "undefined"
                  ? "n/a"
                  : `${sessionStorage.length} keys`
              }
            />
            <p className="text-zinc-500 mt-2">
              Observe-only — values are not dumped (privacy).
            </p>
          </>
        )}

        {tab === "Clipboard" && (
          <div className="space-y-2 text-zinc-400">
            <p>
              Use{" "}
              <span className="text-sky-300 font-semibold">Copy Diagnostic</span>{" "}
              below to export the full JSON snapshot (includes{" "}
              <span className="font-mono text-zinc-200">trace</span>).
            </p>
            <p>
              WebView DevTools:
              <span className="font-mono text-zinc-200"> window.__YMOS_TRACE__</span>
            </p>
            <p>
              Dump:
              <span className="font-mono text-zinc-200">
                {" "}
                window.__YMOS_TRACE_DUMP__()
              </span>
            </p>
            <Row
              label="buffer"
              value={
                typeof window !== "undefined" && window.__YMOS_TRACE__
                  ? `${window.__YMOS_TRACE__.length} events`
                  : "0 events"
              }
            />
          </div>
        )}

        {tab === "Device" && (
          <>
            <Row label="platform" value={diagnostic.platform} />
            <Row
              label="native"
              value={String(diagnostic.build.capacitorNative)}
            />
            <Row
              label="userAgent"
              value={
                typeof navigator !== "undefined"
                  ? navigator.userAgent.slice(0, 120)
                  : "—"
              }
            />
            <Row
              label="Capacitor.getPlatform"
              value={(() => {
                try {
                  return Capacitor.getPlatform();
                } catch {
                  return "—";
                }
              })()}
            />
          </>
        )}

        {tab === "Errors" && (
          <>
            <Row label="exception" value={diagnostic.errors.lastException ?? "—"} />
            <Row label="redirect" value={diagnostic.errors.lastRedirect ?? "—"} />
            <Section title="Asset errors">
              {failures.length === 0 ? (
                <Mark ok={true} label="None" />
              ) : (
                failures.slice(0, 20).map((e) => (
                  <div key={e.id} className="py-1 border-b border-white/5">
                    <Mark ok={false} label={e.kind} />
                    <Row label="URL" value={shortUrl(e.url)} />
                    <Row label="Error" value={e.error ?? "—"} />
                  </div>
                ))
              )}
            </Section>
          </>
        )}
      </div>

      <div className="p-3 pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={() => void copyDiagnostic()}
          className="w-full rounded-lg bg-sky-500/90 py-2 text-center text-[11px] font-bold text-zinc-950 hover:bg-sky-400"
        >
          {copied ? "Copied ✓" : "Copy Diagnostic"}
        </button>
      </div>
      </div>
    </div>
  );
}
