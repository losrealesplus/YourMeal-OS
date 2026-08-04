/**
 * ANDROID-ASSETS-001 — install observe-only network/DOM resource probes.
 * Wraps fetch/XHR without altering responses; records img/link/script failures.
 */
import {
  classifyAssetUrl,
  getYmosAssetAuditInstalled,
  markYmosAssetAuditInstalled,
  recordYmosAssetFinish,
  recordYmosAssetStart,
} from "./store";

function resolveUrl(input: RequestInfo | URL | string): string {
  try {
    if (typeof input === "string") return new URL(input, document.baseURI).href;
    if (input instanceof URL) return input.href;
    if (typeof Request !== "undefined" && input instanceof Request) {
      return input.url;
    }
  } catch {
    /* fall through */
  }
  return String(input);
}

function installFetchProbe(): void {
  if (typeof window === "undefined" || !window.fetch) return;
  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = resolveUrl(input);
    const id = recordYmosAssetStart({
      url,
      source: "fetch",
      kind: classifyAssetUrl(url) === "other" ? "fetch" : classifyAssetUrl(url),
    });
    try {
      const res = await original(input, init);
      const ok = res.ok;
      recordYmosAssetFinish(id, {
        status: ok ? "ok" : "error",
        httpStatus: res.status,
        error: ok ? null : `HTTP ${res.status} ${res.statusText || ""}`.trim(),
      });
      return res;
    } catch (err) {
      recordYmosAssetFinish(id, {
        status: "error",
        httpStatus: null,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  };
}

function installXhrProbe(): void {
  if (typeof XMLHttpRequest === "undefined") return;
  const proto = XMLHttpRequest.prototype;
  const open = proto.open;
  const send = proto.send;

  proto.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ) {
    const href = resolveUrl(url);
    (this as XMLHttpRequest & { __ymosAssetUrl?: string }).__ymosAssetUrl = href;
    recordYmosAssetStart({
      url: href,
      source: "xhr",
      kind: classifyAssetUrl(href) === "other" ? "xhr" : classifyAssetUrl(href),
    });
    return open.call(
      this,
      method,
      url as string,
      async ?? true,
      username,
      password,
    );
  };

  proto.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
    const url =
      (this as XMLHttpRequest & { __ymosAssetUrl?: string }).__ymosAssetUrl ??
      "xhr:unknown";

    this.addEventListener("loadend", () => {
      const status = this.status;
      // Capacitor / file WebView often reports HTTP 0 for successful local assets.
      if (status === 0 && this.readyState === 4) {
        recordYmosAssetFinish(url, {
          status: "ok",
          httpStatus: 0,
          error: null,
        });
        return;
      }
      const ok = status >= 200 && status < 400;
      recordYmosAssetFinish(url, {
        status: ok ? "ok" : "error",
        httpStatus: status || null,
        error: ok ? null : `XHR HTTP ${status}`,
      });
    });

    this.addEventListener("error", () => {
      recordYmosAssetFinish(url, {
        status: "error",
        httpStatus: this.status || null,
        error: "XHR network error",
      });
    });

    return send.call(this, body);
  };
}

function installElementErrorProbe(): void {
  if (typeof document === "undefined") return;

  document.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (target instanceof HTMLImageElement) {
        const url = target.currentSrc || target.src;
        if (!url) return;
        recordYmosAssetStart({ url, source: "img", kind: "image" });
        recordYmosAssetFinish(url, {
          status: "error",
          httpStatus: null,
          error: "img load error",
          kind: "image",
        });
        return;
      }

      if (target instanceof HTMLLinkElement) {
        const url = target.href;
        if (!url) return;
        const kind =
          target.rel === "icon" || target.rel.includes("icon")
            ? "favicon"
            : classifyAssetUrl(url);
        recordYmosAssetStart({ url, source: "link", kind });
        recordYmosAssetFinish(url, {
          status: "error",
          httpStatus: null,
          error: `link load error rel=${target.rel}`,
          kind,
        });
        return;
      }

      if (target instanceof HTMLScriptElement) {
        const url = target.src;
        if (!url) return;
        recordYmosAssetStart({ url, source: "script", kind: "js" });
        recordYmosAssetFinish(url, {
          status: "error",
          httpStatus: null,
          error: "script load error",
          kind: "js",
        });
      }
    },
    true,
  );

  document.addEventListener(
    "load",
    (event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement) {
        const url = target.currentSrc || target.src;
        if (!url) return;
        recordYmosAssetStart({ url, source: "img", kind: "image" });
        recordYmosAssetFinish(url, {
          status: target.naturalWidth > 0 ? "ok" : "error",
          httpStatus: null,
          error: target.naturalWidth > 0 ? null : "img naturalWidth=0",
          kind: "image",
        });
      }
    },
    true,
  );
}

function installPerformanceProbe(): void {
  if (typeof performance === "undefined" || typeof PerformanceObserver === "undefined") {
    return;
  }

  const ingest = (entry: PerformanceResourceTiming) => {
    const url = entry.name;
    recordYmosAssetStart({
      url,
      source: "performance",
      kind: classifyAssetUrl(url),
    });
    const failed =
      entry.transferSize === 0 &&
      entry.decodedBodySize === 0 &&
      entry.duration > 0 &&
      // capacitor/file often reports 0 transferSize for successful local assets
      !url.startsWith("capacitor://") &&
      !url.startsWith("file://") &&
      !url.includes("://localhost");

    recordYmosAssetFinish(url, {
      status: failed ? "error" : "ok",
      httpStatus: failed ? 404 : null,
      error: failed ? "performance: empty transfer" : null,
      kind: classifyAssetUrl(url),
    });
  };

  try {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "resource") {
          ingest(entry as PerformanceResourceTiming);
        }
      }
    });
    obs.observe({ type: "resource", buffered: true });
  } catch {
    for (const entry of performance.getEntriesByType("resource")) {
      ingest(entry as PerformanceResourceTiming);
    }
  }
}

function installImportErrorProbe(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const text =
      reason instanceof Error
        ? `${reason.name}: ${reason.message}`
        : String(reason);
    const isImport =
      /dynamically imported module|importing a module script failed|failed to fetch/i.test(
        text,
      );
    if (!isImport) return;
    const match = text.match(/https?:\/\/\S+|capacitor:\/\/\S+|\/assets\/\S+/);
    const url = match?.[0] ?? "dynamic-import";
    recordYmosAssetStart({ url, source: "import", kind: "import" });
    recordYmosAssetFinish(url, {
      status: "error",
      httpStatus: null,
      error: text,
      kind: "import",
    });
  });
}

function scanExistingDomAssets(): void {
  if (typeof document === "undefined") return;

  document.querySelectorAll("link[href]").forEach((node) => {
    const el = node as HTMLLinkElement;
    const url = el.href;
    if (!url) return;
    const kind =
      el.rel === "icon" || el.rel.includes("icon")
        ? "favicon"
        : classifyAssetUrl(url);
    recordYmosAssetStart({ url, source: "link", kind });
    // Presence in DOM after parse ≈ requested; final ok/error via load/error or performance.
  });

  document.querySelectorAll("script[src]").forEach((node) => {
    const el = node as HTMLScriptElement;
    if (!el.src) return;
    recordYmosAssetStart({ url: el.src, source: "script", kind: "js" });
  });

  document.querySelectorAll("img[src]").forEach((node) => {
    const el = node as HTMLImageElement;
    const url = el.currentSrc || el.src;
    if (!url) return;
    recordYmosAssetStart({ url, source: "img", kind: "image" });
    if (el.complete) {
      recordYmosAssetFinish(url, {
        status: el.naturalWidth > 0 ? "ok" : "error",
        httpStatus: null,
        error: el.naturalWidth > 0 ? null : "img naturalWidth=0",
        kind: "image",
      });
    }
  });
}

/** Install once at client boot. Safe to call multiple times. */
export function installYmosAssetResolutionAudit(): void {
  if (typeof window === "undefined") return;
  if (getYmosAssetAuditInstalled()) return;
  markYmosAssetAuditInstalled();

  installFetchProbe();
  installXhrProbe();
  installElementErrorProbe();
  installPerformanceProbe();
  installImportErrorProbe();
  scanExistingDomAssets();
}
