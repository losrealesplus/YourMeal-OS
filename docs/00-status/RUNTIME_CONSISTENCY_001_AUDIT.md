# FOPEBA · RUNTIME-CONSISTENCY-001

**Mode:** READ-ONLY audit + design. **No code changes. No fixes.**  
**Evidence baseline:** DOM tab (ANDROID-DOM-001) shows only `/assets/logo-*.png` + `/assets/eatclean-hero-*.jpg`. Assets tab still lists First Failure `https://localhost/__l5e/…/eatclean-logo.png`.  
**Date:** 2026-08-05 · `main` @ post-#288.

---

## 1. ROOT CAUSE

**The Asset Ledger is a historical, append-mostly event log with a sticky `firstFailureId`. It is not a live view of `document.images`.**

Once an `img load error` (or any error) is recorded, that entry and `firstFailure` **never reconcile against the current DOM**. The Assets tab therefore reports a truth about *past observations*; the DOM tab reports *present Chromium state*. Both can be “correct” relative to their contracts — and **inconsistent with each other**.

| Field | Value |
|-------|--------|
| **Producer of the wrong “current” signal** | `src/runtime/ymos-runtime-assets/store.ts` — sticky `firstFailureId` + never-evicted error entries |
| **Ingest path that created `__l5e` historically** | `install.ts` → `installElementErrorProbe` (`img` `error` event) and/or `scanExistingDomAssets` when `TenantLogo` still used Lovable URL |
| **Consumer that surfaces it as “live”** | `YmosRuntimeInspector` Assets tab → `diagnostic.assets.firstFailure` |
| **Missing invalidator** | No `clear` / `reset` / DOM-reconcile / navigation-scoped reset; `firstFailureId` never cleared |

**Confidence:** ~97% (architectural; matches DOM vs Assets contradiction exactly).

---

## 2. CADENA COMPLETA

```
Boot (router.tsx)
  → installYmosAssetResolutionAudit()   [once per JS realm]
       ├─ fetch / xhr wrappers          → recordStart/Finish
       ├─ document capture error/load   → img/link/script
       ├─ PerformanceObserver(buffered) → ALL resource timings seen so far
       └─ scanExistingDomAssets()       → current link/script/img

Past session (or early boot when __l5e still requested)
  → <img src="/__l5e/…/eatclean-logo.png"> errors
  → recordYmosAssetFinish(…, status: "error", error: "img load error")
  → store.firstFailureId = entry.id     ← SET ONCE, NEVER CLEARED
  → entry remains in store.entries[]    ← NEVER REMOVED (until FIFO trim @ 120)

Present (ASSET-005 + DOM-001)
  → TenantLogo src = /assets/logo-XXXX.png  ✓
  → document.images = [logo, hero] only     ✓
  → store.entries still contains ghost __l5e error
  → getYmosAssetAuditSnapshot().firstFailure → ghost
  → Assets tab “First Failure” → __l5e      ✗ (as “current”)
  → DOM tab → no __l5e                     ✓
```

**Definition clash:** Assets = *ledger of observed loads*. DOM = *live image nodes*. Presenting ledger First Failure as “what is broken now” without cross-checking DOM is the product bug in the inspector UX/contract.

---

## 3. STORE Q&A (`ymos-runtime-assets/store.ts`)

| # | Question | Answer |
|---|----------|--------|
| 1 | Who creates the store? | Module singleton `store` (L30–35). Created at first import of `store.ts`. |
| 2 | Who inserts entries? | `recordYmosAssetStart` (push). Callers: fetch/xhr/img/link/script/performance/import probes + `scanExistingDomAssets`. |
| 3 | Who deletes entries? | Only `trim()` FIFO when `entries.length > 120`. No selective delete. No clear-all. |
| 4 | Who recalculates firstFailure? | Snapshot read path (L183–186): by `firstFailureId`, else first `status==="error"`. |
| 5 | Who clears firstFailure? | **Nobody.** Set only in `recordYmosAssetFinish` when `status==="error" && !firstFailureId` (L144–146). |
| 6 | Can firstFailure freeze? | **Yes — by design today.** Sticky until process death. |
| 7 | Survive rebuild/APK? | **No** across full WebView process kill. **Yes** across React remount / HMR if module instance survives. Soft WebView reuse can keep Performance buffer + if probes re-ingest, ghosts return. |
| 8 | Duplicates? | **Yes.** Same URL after a finished entry creates a **new** id; `byUrl` points to latest; old error row stays in `entries`. |
| 9 | Orphan entries? | **Yes.** Trim can remove the row whose id is `firstFailureId` without clearing the id; snapshot falls back to any error. |
| 10 | Entries absent from DOM? | **Yes — normal.** Ledger is not DOM-scoped. |
| 11 | Prior navigation? | **Yes** within SPA session; no route-change reset. |
| 12 | Survive HMR? | **Likely yes** (module singleton + `window.__YMOS_ASSET_AUDIT__` install flag). |
| 13 | Survive remount? | **Yes.** Store is outside React. |
| 14 | Survive DOM change? | **Yes.** No MutationObserver; no reconcile. |
| 15 | Who invalidates snapshot? | `notify()` clears `cachedSnapshot` then listeners (REACT-185 fix). Does **not** mean data is reconciled with DOM. |

### Install probes (`install.ts`) — extra liars

| Probe | Can invent ghosts? | Notes |
|-------|-------------------|--------|
| `PerformanceObserver({ buffered: true })` | **Yes** | Replays entire resource timing buffer into ledger at install. |
| `scanExistingDomAssets` | Snapshot-at-boot only | Won’t add `__l5e` if DOM clean at install. |
| img `error` capture | **Yes** | Source of historical `__l5e` (`error: "img load error"`). |
| fetch/xhr | Network history | Not DOM images; inflate counts (CASE 2). |
| localhost performance heuristic | Soft | Marks localhost resources OK even if empty transfer — so `__l5e` First Failure is almost certainly **`source: "img"`**, not performance. |

---

## 4. FUENTE MATRIX (quién escribe / lee / invalida / limpia / puede mentir)

| Fuente | Writes | Reads | Invalidates | Clears | Can lie? |
|--------|--------|-------|-------------|--------|----------|
| **DOM `document.images`** | Browser / React commit | DOM tab (`collectDomImages`) | N/A (live) | GC with node removal | Low (ground truth for *current* imgs) |
| **`currentSrc` / `src`** | Browser | DOM tab, img probes | On src change | — | Low |
| **`complete` / natural size** | Browser decode | DOM tab, img load probe | On load | — | Medium (timing) |
| **Asset Ledger `store.entries`** | Probes → `record*` | Assets tab, snapshot | `notify` (cache only) | FIFO trim only | **High** vs “current UI” |
| **`firstFailureId`** | First error finish | Snapshot | Never | **Never** | **Highest** |
| **Snapshot cache** | `getYmosAssetAuditSnapshot` | `useSyncExternalStore` | `notify()` | On notify | Medium if store stale |
| **Performance ResourceTiming** | Browser network stack | PerformanceObserver ingest | Browser buffer policy | Not called (`clearResourceTimings` unused) | Medium; buffered replay |
| **PerformanceObserver** | installPerformanceProbe | → ledger | — | — | Medium |
| **MutationObserver** | — | **Not installed** | — | — | N/A (gap) |
| **fetch / XHR wrappers** | → ledger | Network tab filter | — | — | Low for HTTP; high as “image failure” confusion |
| **React TenantLogo** | Sets img src | — | Remount | — | Was liar for `__l5e`; fixed ASSET-005 |
| **Window install flag** | `markYmosAssetAuditInstalled` | install once | Full reload | — | Prevents re-scan |

---

## 5. INCONSISTENCIAS DETECTADAS (casos reales / esperados)

| Case | Observed / Expected | Classification |
|------|---------------------|----------------|
| **C1** | DOM: `/assets/logo-*.png` · Assets First Failure: `/__l5e/…` | **ERROR — ghost firstFailure** |
| **C2** | DOM: ~2 images · Assets: dozens of entries | **WARNING — historical ledger** (by design today) |
| **C3** | Possible loading rows while DOM complete | **WARNING — ledger stale status** |
| **C6** | Ledger URL not in `document.images` | **WARNING/ERROR for kind=image** |
| **C7** | `firstFailureId` may not resolve after trim | **ERROR — orphan firstFailure** (code path exists) |
| **C8** | ResourceTiming may be thinner than ledger | **WARNING** (ledger also has fetch/xhr) |
| C4/C5/C9/C10 | Not yet auto-measured | Designed below |

---

## 6. COMPONENTES (roles)

| Role | Component |
|------|-----------|
| **Produces incorrect “current failure” datum** | `store.ts` sticky `firstFailureId` + retained error `entries` |
| **Originally ingested `__l5e`** | `install.ts` img error path (when TenantLogo used Lovable URL) |
| **Consumes / presents as live** | `YmosRuntimeInspector` Assets → First Failure |
| **Should invalidate** | Missing: reconcile vs DOM, clear firstFailure when URL absent from `document.images`, reset on full navigation / boot epoch |
| **Ground truth for images** | `dom-images.ts` / `document.images` |

---

## 7. DISEÑO · Runtime Consistency Layer

**Not implemented in this PR.** Proposed shape for RUNTIME-CONSISTENCY-002.

### Placement

```
src/runtime/ymos-runtime-consistency/
  types.ts
  engine.ts          # RuntimeConsistencyEngine.run(ctx) → Report
  rules/*.ts         # one file per assert*
  compare.ts         # URL normalize helpers
```

### Context inputs (read-only)

```ts
type ConsistencyContext = {
  domImages: YmosDomImageRow[];           // collectDomImages()
  ledger: YmosAssetAuditSnapshot;         // getYmosAssetAuditSnapshot()
  performance: PerformanceResourceTiming[]; // getEntriesByType('resource')
  now: number;
  route: string;
};
```

### Rules (PASS | WARNING | ERROR)

| Rule | Intent |
|------|--------|
| `assertLedgerMatchesDOM` | Every ledger `kind==="image"` with status error must appear in DOM `currentSrc`/`src` **or** be marked HISTORICAL |
| `assertNoGhostEntries` | Image URLs in ledger absent from DOM → WARNING (age > N s → escalate) |
| `assertFirstFailureAlive` | `firstFailure.url` must exist in DOM **or** rule ERROR “stale firstFailure” |
| `assertNoOrphanFirstFailure` | `firstFailureId` must resolve to an entry still in `entries` |
| `assertPerformanceMatchesDOM` | Optional: DOM img URLs ⊆ performance names (WARNING if missing) |
| `assertSnapshotFresh` | Snapshot env/time vs last `store.seq` (needs exposing seq) |
| `assertNoDuplicateResources` | Same URL + same terminal status duplicated → WARNING |
| `assertNoHistoricalAssets` | Configurable: image errors older than session boot epoch → WARNING |
| `assertSameImage` | For ownerHint TenantLogo: DOM src must match expected Vite `/assets/logo-` pattern |
| `assertDomCompleteVsLedger` | DOM complete+naturalWidth>0 but ledger loading/error for same URL → ERROR |

### UI (future)

New Inspector tab **Consistency** (or banner on Assets):

```
INCONSISTENT
Asset ledger First Failure references image absent from DOM.
URL: https://localhost/__l5e/…
Rule: assertFirstFailureAlive → ERROR
```

### Auto-remediation policy (later, separate PR)

Observe-only engine first. Optional later: `resetFirstFailureIfGhost()` behind flag — **not** silent deletion without reporting.

---

## 8. REGLA QUE HABRÍA EVITADO ESTE INCIDENTE

**`assertFirstFailureAlive` + `assertLedgerMatchesDOM` (image errors)**

Had they run when DOM showed only `/assets/logo-*.png`, the inspector would have said:

> ERROR: First Failure `/__l5e/…` is not present in `document.images` — ledger is historical, not current.

That stops hours of “who still generates `__l5e`?” once the APK is clean.

---

## 9. RECOMENDACIONES (next PRs — do not mix)

| Priority | PR | Scope |
|----------|-----|--------|
| **P0** | RUNTIME-CONSISTENCY-002 | Implement engine + Consistency tab (observe-only reports) |
| **P1** | ASSET-LEDGER-001 | Clear or recompute `firstFailure` when URL leaves DOM; expose `bootEpoch`; optional `resetLedger()` on full reload |
| **P2** | ASSET-LEDGER-002 | Stop treating ledger First Failure as “current bug” in Assets UI unless Consistency PASS |
| **P3** | PERF-001 | Call `performance.clearResourceTimings()` after buffered ingest **or** filter by `startTime >= bootMark` |

**Do not** reopen TenantLogo / Vite / Capacitor for `__l5e` while DOM proves absence.

---

## 10. ENTREGABLE DE ESTE PR

- Este documento únicamente.
- Sin cambios de runtime.
- Sin fixes.

**Cierre FOPEBA de la contradicción DOM vs Assets:** no es un segundo logo bug; es un **inspector contract bug** (historical ledger presented as live).
